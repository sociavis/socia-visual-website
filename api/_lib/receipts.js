// Payment receipts + internal payment notifications.
// Fired from the Stripe webhook when an invoice is marked paid.
// Everything here is BEST-EFFORT: it must never throw into the webhook —
// a receipt email failing can never block payment recording.

const { getStripeClient } = require('./stripe');

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const SITE_URL = 'https://sociavisual.com';
const ACCENT = '#a8ff00';

// Reuse the same verified sender the contact form uses (contact@sociavisual.com
// is already verified in Resend). Overridable via env if a billing@ sender is added.
const BRAND_FROM = process.env.BILLING_FROM || 'Socia Visual <contact@sociavisual.com>';
const REPLY_TO = process.env.BILLING_REPLY_TO || 'scott@sociavisual.com';

// Who gets the internal "you got paid" ping. Falls back to the contact-form
// recipient, then Scott.
function internalRecipients() {
  const raw = process.env.PAYMENT_NOTIFY_EMAIL || process.env.FORM_RECIPIENT || 'scott@sociavisual.com';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fmtMoney(cents, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase()
    }).format((Number(cents) || 0) / 100);
  } catch {
    return `$${((Number(cents) || 0) / 100).toFixed(2)}`;
  }
}

function fmtDate(d) {
  const date = d ? new Date(d) : new Date();
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function paymentMethodLabel(charge) {
  const type = charge?.payment_method_details?.type;
  if (!type) return null;
  const details = charge.payment_method_details[type] || {};
  const brand = details.brand ? details.brand.charAt(0).toUpperCase() + details.brand.slice(1) : null;
  const last4 = details.last4;
  if (type === 'card' && brand && last4) return `${brand} ···· ${last4}`;
  if (last4) return `${type.replace(/_/g, ' ')} ···· ${last4}`;
  if (type === 'link') return 'Link';
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function sendEmail(payload) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('[receipts] RESEND_API_KEY missing — skipping email');
    return { ok: false, skipped: true };
  }
  try {
    const r = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) {
      console.error('[receipts] Resend error', r.status, await r.text());
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error('[receipts] send failed', err && err.message);
    return { ok: false };
  }
}

// Pull receipt_url + payment-method details from the charge behind the PI.
async function getChargeDetails(pi) {
  try {
    let charge = pi.latest_charge;
    if (!charge || typeof charge === 'string') {
      const full = await getStripeClient().paymentIntents.retrieve(pi.id, { expand: ['latest_charge'] });
      charge = full.latest_charge;
    }
    return (charge && typeof charge === 'object') ? charge : null;
  } catch (err) {
    console.warn('[receipts] charge lookup failed', err && err.message);
    return null;
  }
}

function itemRows(invoice) {
  const items = Array.isArray(invoice?.items) ? invoice.items : [];
  if (!items.length) return '';
  return items.map(it => {
    const qty = Number(it.qty) || 0;
    const price = Number(it.price) || 0;
    const lineCents = Math.round(qty * price * 100);
    const qtyLabel = qty === 1 ? '' : `<span style="color:#8a8a8a;">${escapeHtml(qty)} × </span>`;
    return `
<tr>
  <td style="padding:12px 20px;border-bottom:1px solid #1f1f1f;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#ffffff;line-height:1.5;">${qtyLabel}${escapeHtml(it.description || 'Services')}</td>
  <td style="padding:12px 20px;border-bottom:1px solid #1f1f1f;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#ffffff;text-align:right;white-space:nowrap;">${fmtMoney(lineCents, invoice.currency)}</td>
</tr>`;
  }).join('');
}

function buildReceiptHtml(invoice, pi, charge) {
  const total = fmtMoney(pi.amount, pi.currency);
  const receiptUrl = charge?.receipt_url || null;
  const receiptNumber = charge?.receipt_number || null;
  const method = paymentMethodLabel(charge);
  const billTo = escapeHtml(invoice.company_name || invoice.client_name || 'Valued Client');
  const period = invoice.period ? ` · ${escapeHtml(invoice.period)}` : '';

  const metaRow = (label, value) => `
<tr>
  <td style="padding:6px 0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#8a8a8a;">${label}</td>
  <td style="padding:6px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#ffffff;text-align:right;">${value}</td>
</tr>`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#050505;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#0d0d0d;border:1px solid #1f1f1f;">
        <tr><td style="height:3px;background:${ACCENT};line-height:3px;font-size:0;">&nbsp;</td></tr>

        <tr><td style="padding:36px 32px 24px;text-align:center;">
          <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};margin-bottom:16px;">SOCIA VISUAL</div>
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:22px;letter-spacing:1px;text-transform:uppercase;color:#ffffff;line-height:1.2;">Payment Receipt</div>
          <div style="display:inline-block;margin-top:14px;background:rgba(168,255,0,0.12);border:1px solid ${ACCENT};color:${ACCENT};font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:5px 14px;border-radius:2px;">✓ Paid</div>
        </td></tr>

        <tr><td style="padding:8px 32px 20px;">
          <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#8a8a8a;margin-bottom:6px;">Billed To</div>
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;color:#ffffff;font-weight:600;">${billTo}</div>
        </td></tr>

        <tr><td style="padding:0 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:1px solid #1f1f1f;border-bottom:1px solid #1f1f1f;">
            <tr>
              <td style="padding:12px 20px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#8a8a8a;">Description</td>
              <td style="padding:12px 20px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#8a8a8a;text-align:right;">Amount</td>
            </tr>
            ${itemRows(invoice)}
            <tr>
              <td style="padding:16px 20px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#8a8a8a;">Total Paid</td>
              <td style="padding:16px 20px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:700;color:${ACCENT};text-align:right;white-space:nowrap;">${total}</td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:20px 32px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${metaRow('Invoice', '#' + escapeHtml(invoice.number || '') + period)}
            ${metaRow('Date Paid', escapeHtml(fmtDate(invoice.paid_at || Date.now())))}
            ${method ? metaRow('Payment Method', escapeHtml(method)) : ''}
            ${receiptNumber ? metaRow('Receipt No.', escapeHtml(receiptNumber)) : ''}
          </table>
        </td></tr>

        ${receiptUrl ? `
        <tr><td style="padding:20px 32px 32px;text-align:center;">
          <a href="${escapeHtml(receiptUrl)}" style="display:inline-block;background:${ACCENT};color:#050505;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:13px 26px;text-decoration:none;border-radius:2px;">View / Download Receipt →</a>
        </td></tr>` : `<tr><td style="height:12px;"></td></tr>`}

        <tr><td style="padding:24px 32px;background:#080808;border-top:1px solid #1f1f1f;text-align:center;">
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#cccccc;line-height:1.6;margin-bottom:8px;">Thank you for your business.</div>
          <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#666;"><a href="${SITE_URL}" style="color:${ACCENT};text-decoration:none;">sociavisual.com</a> · Web Design · Graphics · Brand Identity</div>
        </td></tr>
      </table>
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;color:#444;margin-top:16px;">Questions about this receipt? Reply to this email.</div>
    </td></tr>
  </table>
</body></html>`;
}

function buildNotifyHtml(invoice, pi, charge) {
  const total = fmtMoney(pi.amount, pi.currency);
  const receiptUrl = charge?.receipt_url || null;
  const method = paymentMethodLabel(charge);
  const company = escapeHtml(invoice.company_name || invoice.client_name || 'Client');

  const row = (label, value) => `
<tr>
  <td style="padding:12px 20px;border-bottom:1px solid #1f1f1f;font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#8a8a8a;width:150px;">${label}</td>
  <td style="padding:12px 20px;border-bottom:1px solid #1f1f1f;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#ffffff;">${value}</td>
</tr>`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#050505;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#0d0d0d;border:1px solid #1f1f1f;">
        <tr><td style="height:3px;background:${ACCENT};line-height:3px;font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:36px 32px 20px;text-align:center;">
          <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};margin-bottom:12px;">SOCIA VISUAL · BILLING</div>
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:24px;color:#ffffff;line-height:1.2;">💰 Payment Received</div>
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:28px;font-weight:700;color:${ACCENT};margin-top:12px;">${total}</div>
        </td></tr>
        <tr><td style="padding:8px 12px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            ${row('Client', company)}
            ${row('Invoice', '#' + escapeHtml(invoice.number || ''))}
            ${row('Email', escapeHtml(invoice.client_email || '—'))}
            ${method ? row('Method', escapeHtml(method)) : ''}
          </table>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;text-align:center;">
          <a href="${SITE_URL}/admin#invoices" style="display:inline-block;background:${ACCENT};color:#050505;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:12px 24px;text-decoration:none;border-radius:2px;margin:0 4px;">Open Admin →</a>
          ${receiptUrl ? `<a href="${escapeHtml(receiptUrl)}" style="display:inline-block;background:transparent;color:${ACCENT};border:1px solid ${ACCENT};font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:11px 24px;text-decoration:none;border-radius:2px;margin:0 4px;">Receipt →</a>` : ''}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Public entry point. Sends the client receipt + internal notification.
// Guaranteed not to throw — logs and returns on any failure.
async function sendInvoicePaidEmails(invoice, pi) {
  try {
    if (!invoice || !pi) return;
    const charge = await getChargeDetails(pi);

    // Client-facing branded receipt
    if (invoice.client_email) {
      await sendEmail({
        from: BRAND_FROM,
        to: [invoice.client_email],
        reply_to: REPLY_TO,
        subject: `Receipt — Invoice #${invoice.number || ''} · Socia Visual`,
        html: buildReceiptHtml(invoice, pi, charge)
      });
    }

    // Internal "you got paid" ping
    await sendEmail({
      from: BRAND_FROM,
      to: internalRecipients(),
      subject: `💰 Paid — ${invoice.company_name || invoice.client_name || 'Client'} · ${fmtMoney(pi.amount, pi.currency)} (Inv #${invoice.number || ''})`,
      html: buildNotifyHtml(invoice, pi, charge)
    });
  } catch (err) {
    console.error('[receipts] sendInvoicePaidEmails failed (non-fatal)', err && err.message);
  }
}

module.exports = { sendInvoicePaidEmails };
