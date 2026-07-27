const { getServiceRoleClient, signInvoiceToken } = require('./_lib/auth');
const { invoiceToAmountCents } = require('./_lib/stripe');

// System sender — these are billing notifications, not personal mail. Replies
// still route to a human.
const FROM = 'Socia Visual Billing <billing@sociavisual.com>';
const REPLY_TO = 'scott@sociavisual.com';

// Days-past-invoice-date at which each reminder goes out.
const STAGES = [7, 14, 30];

// Invoices older than this are treated as settled offline or written off —
// never email about them. Stops a first deploy from waking up ancient rows.
const MAX_AGE_DAYS = 120;

module.exports = async (req, res) => {
  // Auth: Vercel Cron sends Authorization: Bearer $CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ?dry=1 reports exactly what would be sent without sending or recording.
  const dryRun = String(req.query?.dry || '') === '1';

  // Kill switch. Ships OFF: without INVOICE_REMINDERS_ENABLED=true in the
  // environment this endpoint never emails anyone, so deploying the cron is
  // inert until someone deliberately turns it on. Dry runs still work.
  const enabled = String(process.env.INVOICE_REMINDERS_ENABLED || '').toLowerCase() === 'true';
  if (!enabled && !dryRun) {
    return res.status(200).json({ disabled: true, sent: 0 });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const sb = getServiceRoleClient();
  const today = new Date();

  const { data: invoices, error } = await sb
    .from('invoices')
    .select('*')
    .eq('status', 'unpaid');

  if (error) {
    console.error('invoice-reminders query error', error);
    return res.status(500).json({ error: 'Query failed' });
  }

  const results = [];

  for (const invoice of invoices || []) {
    try {
      const age = ageInDays(invoice.date, today);
      if (age === null || age < STAGES[0] || age > MAX_AGE_DAYS) continue;

      const email = (invoice.client_email || '').trim();
      if (!isEmail(email)) {
        results.push({ invoice_id: invoice.id, skipped: 'no valid client_email' });
        continue;
      }

      const amountCents = invoice.amount_cents || invoiceToAmountCents(invoice);
      if (amountCents < 50) {
        results.push({ invoice_id: invoice.id, skipped: 'amount below Stripe minimum' });
        continue;
      }

      // Which stages has this invoice already passed, and which are recorded?
      const dueStages = STAGES.filter(s => age >= s);
      const { data: sent } = await sb
        .from('invoice_reminders')
        .select('stage')
        .eq('invoice_id', invoice.id);
      const sentStages = new Set((sent || []).map(r => r.stage));

      const pending = dueStages.filter(s => !sentStages.has(s));
      if (!pending.length) continue;

      // Only ever send the newest due stage. Anything older is backfilled as
      // skipped so enabling this mid-life doesn't fire three emails at once.
      const stage = pending[pending.length - 1];
      const backfill = pending.slice(0, -1);

      if (dryRun) {
        results.push({
          invoice_id: invoice.id,
          number: invoice.number,
          to: email,
          age_days: age,
          would_send_stage: stage,
          would_backfill: backfill,
          amount_cents: amountCents
        });
        continue;
      }

      // Claim the stage BEFORE sending. If the insert conflicts, another run
      // already has it — bail rather than risk a double email.
      const { error: claimErr } = await sb
        .from('invoice_reminders')
        .insert({ invoice_id: invoice.id, stage });
      if (claimErr) {
        results.push({ invoice_id: invoice.id, skipped: 'already claimed', stage });
        continue;
      }

      if (backfill.length) {
        await sb.from('invoice_reminders').insert(
          backfill.map(s => ({ invoice_id: invoice.id, stage: s, skipped: true }))
        );
      }

      const origin = process.env.PUBLIC_SITE_ORIGIN || 'https://sociavisual.com';
      const payUrl = `${origin}/invoice.html?id=${encodeURIComponent(invoice.id)}&t=${signInvoiceToken(invoice.id)}`;

      const messageId = await sendReminder({
        to: email,
        invoice,
        stage,
        age,
        amountCents,
        payUrl
      });

      await sb
        .from('invoice_reminders')
        .update({ resend_message_id: messageId })
        .eq('invoice_id', invoice.id)
        .eq('stage', stage);

      results.push({
        invoice_id: invoice.id,
        number: invoice.number,
        to: email,
        stage,
        age_days: age,
        message_id: messageId
      });
    } catch (err) {
      console.error(`invoice-reminders: ${invoice.id} failed`, err.message);
      results.push({ invoice_id: invoice.id, error: err.message });
    }
  }

  return res.status(200).json({ dry_run: dryRun, processed: results.length, results });
};

async function sendReminder({ to, invoice, stage, age, amountCents, payUrl }) {
  const copy = STAGE_COPY[stage];

  const payload = {
    from: FROM,
    to: [to],
    reply_to: REPLY_TO,
    subject: copy.subject(invoice.number),
    html: buildHtml({ invoice, copy, age, amountCents, payUrl }),
    text: buildText({ invoice, copy, age, amountCents, payUrl })
  };

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!r.ok) {
    throw new Error(`Resend ${r.status}: ${await r.text()}`);
  }
  const body = await r.json().catch(() => ({}));
  return body.id || null;
}

// System voice: factual, no first person, no greeting or signoff. Each stage
// states the account status and nothing else.
const STAGE_COPY = {
  7: {
    status: 'Payment due',
    accent: '#a8ff00',
    subject: n => `Invoice #${n} — payment due`,
    lead: 'This invoice is outstanding and no payment has been recorded against it.'
  },
  14: {
    status: '14 days outstanding',
    accent: '#ffb020',
    subject: n => `Invoice #${n} — 14 days outstanding`,
    lead: 'This invoice remains unpaid 14 days after its issue date.'
  },
  30: {
    status: 'Past due',
    accent: '#ff5c5c',
    subject: n => `Invoice #${n} — past due`,
    lead: 'This invoice is now 30 days past its issue date and remains unpaid.'
  }
};

function buildHtml({ invoice, copy, age, amountCents, payUrl }) {
  const rows = (Array.isArray(invoice.items) ? invoice.items : [])
    .map(item => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #ecebe8;color:#3c3a37;font-size:14px;line-height:1.5;">
          ${escapeHtml(item.description || '')}
        </td>
        <td style="padding:10px 0 10px 16px;border-bottom:1px solid #ecebe8;color:#78746e;font-size:14px;white-space:nowrap;text-align:right;">
          ${formatLineTotal(item)}
        </td>
      </tr>`)
    .join('');

  const meta = [
    ['Invoice', `#${escapeHtml(invoice.number || '')}`],
    ['Issued', formatDate(invoice.date)],
    invoice.period ? ['Period', escapeHtml(invoice.period)] : null,
    invoice.company_name ? ['Billed to', escapeHtml(invoice.company_name)] : null
  ].filter(Boolean).map(([k, v]) => `
      <tr>
        <td style="padding:4px 0;color:#a8a49e;font-size:13px;">${k}</td>
        <td style="padding:4px 0 4px 16px;color:#3c3a37;font-size:13px;text-align:right;">${v}</td>
      </tr>`).join('');

  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f3f1;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f1;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

        <tr><td style="background:#0a0a0a;padding:22px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="color:#ffffff;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Socia Visual</td>
            <td style="text-align:right;color:#6f6c66;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;">Billing notice</td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:28px 32px 0;">
          <div style="display:inline-block;padding:5px 12px;border-radius:4px;background:${copy.accent}1f;color:#2b2926;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;border-left:3px solid ${copy.accent};">
            ${escapeHtml(copy.status)}
          </div>
          <div style="margin:16px 0 6px;color:#a8a49e;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Amount due</div>
          <div style="color:#0a0a0a;font-size:34px;font-weight:700;letter-spacing:-0.5px;">${formatMoney(amountCents, invoice.currency)}</div>
          <p style="margin:14px 0 0;color:#57544f;font-size:14px;line-height:1.6;">${escapeHtml(copy.lead)}</p>
        </td></tr>

        <tr><td style="padding:24px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #ecebe8;padding-top:8px;">
            ${meta}
          </table>
        </td></tr>

        <tr><td style="padding:20px 32px 0;">
          <div style="color:#a8a49e;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding-bottom:4px;">Line items</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${rows}
            <tr>
              <td style="padding:14px 0 0;color:#2b2926;font-size:14px;font-weight:600;">Total</td>
              <td style="padding:14px 0 0 16px;text-align:right;color:#2b2926;font-size:16px;font-weight:700;white-space:nowrap;">${formatMoney(amountCents, invoice.currency)}</td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:26px 32px 30px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="background:#0a0a0a;border-radius:8px;">
              <a href="${payUrl}" style="display:inline-block;padding:14px 28px;color:#a8ff00;font-size:15px;font-weight:600;text-decoration:none;">View invoice &amp; pay →</a>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="background:#faf9f7;padding:16px 32px;border-top:1px solid #ecebe8;">
          <div style="color:#a8a49e;font-size:12px;line-height:1.6;">
            Automated notice from the Socia Visual billing system. Reply to this message with any billing questions.<br>
            sociavisual.com
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildText({ invoice, copy, age, amountCents, payUrl }) {
  const lines = (Array.isArray(invoice.items) ? invoice.items : [])
    .map(i => `  ${i.description || ''} — ${formatLineTotal(i)}`)
    .join('\n');

  return [
    `SOCIA VISUAL — BILLING NOTICE`,
    `Status: ${copy.status}`,
    '',
    copy.lead,
    '',
    `Amount due:  ${formatMoney(amountCents, invoice.currency)}`,
    `Invoice:     #${invoice.number || ''}`,
    `Issued:      ${formatDate(invoice.date)}`,
    invoice.period ? `Period:      ${invoice.period}` : null,
    invoice.company_name ? `Billed to:   ${invoice.company_name}` : null,
    '',
    'Line items:',
    lines,
    '',
    `View invoice & pay: ${payUrl}`,
    '',
    '—',
    'Automated notice from the Socia Visual billing system.',
    'Reply to this message with any billing questions.',
    'sociavisual.com'
  ].filter(l => l !== null).join('\n');
}

function formatDate(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return escapeHtml(iso || '');
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function ageInDays(dateStr, now) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const then = new Date(dateStr + 'T00:00:00Z');
  if (Number.isNaN(then.getTime())) return null;
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((todayUtc - then.getTime()) / 86400000);
}

function isEmail(v) {
  return typeof v === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
}

function formatMoney(cents, currency) {
  const amount = (Number(cents) || 0) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (currency || 'usd').toUpperCase()
  }).format(amount);
}

function formatLineTotal(item) {
  const qty = Number(item.qty) || 0;
  const price = Number(item.price) || 0;
  return formatMoney(Math.round(qty * price * 100), 'usd');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
