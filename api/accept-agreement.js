// Click-to-accept agreements.
//
//   GET  /api/accept-agreement?id=<contract id>
//        → { status, signed_at, accepted_by_name, title }   (no PII beyond first name)
//
//   POST /api/accept-agreement  { id, t, name, email, agree: true, website: "" }
//        → flips the contract to status=signed (acceptance_method=click), then
//          best-effort activation: first invoice row + internal + client emails.
//          Requires the contract's accept_token (t). One accept per contract; a
//          second POST returns 409 with the existing acceptance.
//
// The token is a per-contract random secret stored on the row (contracts.accept_token),
// so this endpoint needs no admin session and no shared signing secret.

const crypto = require('crypto');
const { getServiceRoleClient } = require('./_lib/auth');
const { rateLimit, clientIp } = require('./_lib/rate-limit');

const SITE_URL = 'https://sociavisual.com';
const ACCENT = '#a8ff00';
const FROM = process.env.BILLING_FROM || 'Socia Visual <contact@sociavisual.com>';
const REPLY_TO = process.env.BILLING_REPLY_TO || 'scott@sociavisual.com';
const INTERNAL_TO = (process.env.AGREEMENT_NOTIFY_EMAIL || process.env.FORM_RECIPIENT || 'scott@sociavisual.com')
  .split(',').map(s => s.trim()).filter(Boolean);

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a), bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function firstName(full) {
  return String(full || '').trim().split(/\s+/)[0] || '';
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Phoenix' });
}

function readBody(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  return b && typeof b === 'object' ? b : {};
}

// ── Activation side effects (all best-effort) ────────────────────────────────

async function createFirstInvoice(sb, c) {
  const act = c.activation || {};
  const inv = act.first_invoice;
  if (!inv || !inv.amount_cents) return null;              // contract does not want an auto invoice

  const { data: last } = await sb.from('invoices').select('number').order('number', { ascending: false }).limit(1);
  const nextNum = String((parseInt(last?.[0]?.number, 10) || 0) + 1).padStart(4, '0');
  const slug = String(inv.client_slug || 'client').replace(/[^a-z0-9]+/gi, '').toLowerCase();
  const id = `inv_${slug}_${nextNum}`;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Phoenix' }); // YYYY-MM-DD

  const row = {
    id,
    number: nextNum,
    date: today,
    status: 'unpaid',
    company_name: c.client_company,
    client_name: c.accepted_by_name || c.client_name,
    client_email: c.accepted_by_email || c.client_email,
    period: inv.period || '',
    items: inv.items || [{ qty: 1, price: inv.amount_cents / 100, description: inv.description || c.title }],
    notes: inv.notes || `Net 10. Agreement #${c.number} accepted ${fmtDate(c.signed_at)}.`,
    amount_cents: inv.amount_cents,
    currency: 'usd',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const { data, error } = await sb.from('invoices').insert(row).select('id, number').single();
  if (error) { console.error('accept-agreement: invoice insert failed', error.message); return { error: error.message }; }
  return data;
}

async function sendEmail(payload) {
  if (!process.env.RESEND_API_KEY) return { skipped: true };
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { console.error('accept-agreement: resend failed', r.status, j); return { error: j }; }
    return { id: j.id };
  } catch (err) {
    console.error('accept-agreement: resend error', err.message);
    return { error: err.message };
  }
}

function shell(inner) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#050505;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#0d0d0d;border:1px solid #1f1f1f;">
<tr><td style="height:3px;background:${ACCENT};line-height:3px;font-size:0;">&nbsp;</td></tr>
${inner}
<tr><td style="padding:20px 32px;background:#080808;border-top:1px solid #1f1f1f;text-align:center;">
<div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#666;"><a href="${SITE_URL}" style="color:${ACCENT};text-decoration:none;">sociavisual.com</a></div>
</td></tr></table></td></tr></table></body></html>`;
}

function row(k, v) {
  return `<tr><td style="padding:12px 20px;border-bottom:1px solid #1f1f1f;font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#8a8a8a;vertical-align:top;width:150px;white-space:nowrap;">${esc(k)}</td>
<td style="padding:12px 20px;border-bottom:1px solid #1f1f1f;font-size:14px;color:#fff;line-height:1.5;">${v}</td></tr>`;
}

function internalEmail(c, invoice) {
  const inner = `
<tr><td style="padding:36px 32px 24px;text-align:center;">
<div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};margin-bottom:16px;">SOCIA VISUAL</div>
<div style="font-weight:700;font-size:22px;letter-spacing:1px;text-transform:uppercase;color:#fff;line-height:1.2;">Agreement activated</div>
<div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};margin-top:10px;">#${esc(c.number)} · ${esc(c.client_company)}</div>
</td></tr>
<tr><td style="padding:0 16px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
${row('Agreement', esc(c.title))}
${row('Accepted by', `${esc(c.accepted_by_name)}<br><span style="color:#949494">${esc(c.accepted_by_email)}</span>`)}
${row('When', esc(fmtDate(c.signed_at)))}
${row('First invoice', invoice?.number ? `#${esc(invoice.number)} created, unpaid. Sign the pay link from the admin.` : (invoice?.error ? `<span style="color:#ff4444">failed: ${esc(invoice.error)}</span>` : 'none configured'))}
</table></td></tr>
<tr><td style="padding:16px 32px 32px;text-align:center;">
<a href="${SITE_URL}/admin#contracts" style="display:inline-block;background:${ACCENT};color:#050505;font-weight:700;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:12px 24px;text-decoration:none;border-radius:2px;">Open in Admin →</a>
</td></tr>`;
  return shell(inner);
}

function clientEmail(c) {
  const url = c.agreement_url ? `${c.agreement_url}${c.agreement_url.includes('?') ? '&' : '?'}t=${encodeURIComponent(c.accept_token)}` : `${SITE_URL}/contract.html?id=${encodeURIComponent(c.id)}`;
  const next = Array.isArray(c.activation?.next_steps) ? c.activation.next_steps : [];
  const inner = `
<tr><td style="padding:36px 32px 24px;">
<div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};margin-bottom:16px;">SOCIA VISUAL</div>
<div style="font-weight:700;font-size:22px;color:#fff;line-height:1.25;">You're all set, ${esc(firstName(c.accepted_by_name))}.</div>
<p style="font-size:14px;color:#c8c8c8;line-height:1.6;margin:16px 0 0;">Your agreement with Socia Visual is active as of ${esc(fmtDate(c.signed_at))}. A copy of everything you accepted stays at the link below, and you can come back to it any time.</p>
${next.length ? `<p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};font-family:'Courier New',monospace;margin:24px 0 8px;">What happens next</p><ul style="margin:0;padding-left:18px;color:#c8c8c8;font-size:14px;line-height:1.7;">${next.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
</td></tr>
<tr><td style="padding:0 32px 32px;">
<a href="${url}" style="display:inline-block;background:${ACCENT};color:#050505;font-weight:700;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:12px 24px;text-decoration:none;border-radius:2px;">View your agreement →</a>
<p style="font-size:12px;color:#777;margin:20px 0 0;line-height:1.6;">Questions? Reply to this email and it comes straight to Scott.</p>
</td></tr>`;
  return shell(inner);
}

// ── Handler ──────────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');

  const sb = getServiceRoleClient();

  if (req.method === 'GET') {
    const id = typeof req.query?.id === 'string' ? req.query.id : '';
    if (!id) return res.status(400).json({ error: 'id required' });
    const { data: c, error } = await sb.from('contracts')
      .select('id, title, status, signed_at, accepted_by_name, acceptance_method, accept_token')
      .eq('id', id).single();
    if (error || !c) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({
      id: c.id,
      title: c.title,
      status: c.status,
      accepts_click: !!c.accept_token,
      signed_at: c.status === 'signed' ? c.signed_at : null,
      accepted_by: c.status === 'signed' ? firstName(c.accepted_by_name) : null
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = clientIp(req);
  const rl = rateLimit(`accept:${ip}`, { windowMs: 10 * 60 * 1000, max: 10 });
  if (!rl.ok) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });

  const b = readBody(req);
  if (b.website && String(b.website).trim()) return res.status(200).json({ ok: true }); // honeypot

  const id = String(b.id || '').trim();
  const t = String(b.t || '').trim();
  const name = String(b.name || '').trim().slice(0, 120);
  const email = String(b.email || '').trim().toLowerCase().slice(0, 200);
  if (!id || !t) return res.status(400).json({ error: 'Missing agreement reference.' });
  if (name.length < 2) return res.status(400).json({ error: 'Please enter your full name.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (b.agree !== true && b.agree !== 'true' && b.agree !== 'on') return res.status(400).json({ error: 'Please confirm you agree to the terms.' });

  try {
    const { data: c, error } = await sb.from('contracts').select('*').eq('id', id).single();
    if (error || !c) return res.status(404).json({ error: 'Agreement not found.' });
    if (!c.accept_token || !safeEqual(c.accept_token, t)) return res.status(403).json({ error: 'This agreement link is not valid.' });
    if (c.status === 'signed') {
      return res.status(409).json({
        error: 'This agreement is already active.',
        status: 'signed', signed_at: c.signed_at, accepted_by: firstName(c.accepted_by_name)
      });
    }

    const now = new Date();
    const ipHash = crypto.createHash('sha256').update(`${process.env.ADMIN_JWT_SECRET || 'sv'}:${ip}`).digest('hex').slice(0, 32);
    const patch = {
      status: 'signed',
      acceptance_method: 'click',
      accepted_by_name: name,
      accepted_by_email: email,
      accepted_ip_hash: ipHash,
      accepted_user_agent: String(req.headers['user-agent'] || '').slice(0, 300),
      signed_at: now.toISOString(),
      signature_date: now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', timeZone: 'America/Phoenix' }),
      updated_at: now.toISOString()
    };
    // Only flip if still unsigned (guards a double-click race).
    const { data: updated, error: upErr } = await sb.from('contracts').update(patch)
      .eq('id', id).neq('status', 'signed').select('*').single();
    if (upErr || !updated) {
      return res.status(409).json({ error: 'This agreement is already active.', status: 'signed' });
    }

    // Activation side effects, best-effort and logged onto the row.
    const invoice = await createFirstInvoice(sb, updated);
    const internal = await sendEmail({
      from: FROM, to: INTERNAL_TO, reply_to: email,
      subject: `Agreement #${updated.number} activated: ${updated.client_company}`,
      html: internalEmail(updated, invoice)
    });
    const client = await sendEmail({
      from: FROM, to: [email], reply_to: REPLY_TO,
      subject: `Your agreement with Socia Visual is active`,
      html: clientEmail(updated)
    });
    const activation = {
      ...(updated.activation || {}),
      activated_at: now.toISOString(),
      first_invoice_id: invoice?.id || null,
      first_invoice_number: invoice?.number || null,
      first_invoice_error: invoice?.error || null,
      internal_email: internal,
      client_email: client
    };
    await sb.from('contracts').update({ activation }).eq('id', id);

    return res.status(200).json({
      ok: true, status: 'signed', signed_at: updated.signed_at, accepted_by: firstName(name),
      invoice_number: invoice?.number || null
    });
  } catch (err) {
    console.error('accept-agreement error', err);
    return res.status(500).json({ error: 'Server error. Please try again or email scott@sociavisual.com.' });
  }
};
