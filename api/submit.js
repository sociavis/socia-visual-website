const FROM = 'Socia Visual <contact@sociavisual.com>';
const DEFAULT_RECIPIENT = 'scott@sociavisual.com';
const RECAPTCHA_MIN_SCORE = 0.5;

const FORM_LABELS = {
  contact: 'Contact Form',
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function extractName(fields) {
  if (fields.name) return String(fields.name).trim();
  const first = fields.first_name || fields.firstName || fields.first;
  const last = fields.last_name || fields.lastName || fields.last;
  const combined = [first, last].filter(Boolean).join(' ').trim();
  return combined || null;
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

async function rateLimit(ip) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return { ok: true };
  const key = `submit:${ip}`;
  try {
    const r = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['INCR', key], ['EXPIRE', key, 3600]])
    });
    if (!r.ok) return { ok: true };
    const data = await r.json();
    const count = Array.isArray(data) && data[0] ? data[0].result : 0;
    return { ok: count <= 5, count };
  } catch (err) {
    console.warn('rateLimit failed (fail-open):', err.message);
    return { ok: true };
  }
}

async function verifyRecaptcha(token, ip) {
  if (!process.env.RECAPTCHA_SECRET_KEY) return { skipped: true };
  if (!token) return { ok: false, reason: 'missing-token' };
  try {
    const params = new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: token,
      remoteip: ip
    });
    const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    const j = await r.json();
    if (!j.success) return { ok: false, reason: 'recaptcha-failed', errors: j['error-codes'] };
    if (typeof j.score === 'number' && j.score < RECAPTCHA_MIN_SCORE) {
      return { ok: false, reason: 'low-score', score: j.score };
    }
    return { ok: true, score: j.score };
  } catch (err) {
    console.error('verifyRecaptcha failed:', err.message);
    return { ok: false, reason: 'verify-error', error: err.message };
  }
}

async function insertSubmission(formType, subject, fields, meta) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const cleanFields = Object.fromEntries(
    Object.entries(fields).filter(([k]) => !k.startsWith('_') && k !== 'g-recaptcha-response' && k !== 'website')
  );
  const row = {
    form_type: formType,
    fields: cleanFields,
    email: fields.email || fields.Email || null,
    name: extractName(fields),
    subject,
    source: 'web',
    ip: meta.ip,
    user_agent: meta.userAgent,
    recaptcha_score: meta.recaptchaScore ?? null,
    is_spam: false
  };
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/submissions`, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(row)
    });
    if (!r.ok) console.error('Supabase insert failed:', r.status, await r.text());
  } catch (err) {
    console.error('Supabase insert error:', err);
  }
}

const SITE_URL = 'https://sociavisual.com';
const ACCENT = '#a8ff00';

function buildHtml(formType, fields) {
  const label = FORM_LABELS[formType] || 'Website Form';
  const rows = Object.entries(fields)
    .filter(([k]) => !k.startsWith('_') && k !== 'g-recaptcha-response' && k !== 'website')
    .map(([k, v]) => {
      const display = Array.isArray(v) ? v.join(', ') : v;
      return `
<tr>
  <td style="padding:14px 20px;border-bottom:1px solid #1f1f1f;font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#8a8a8a;vertical-align:top;width:140px;white-space:nowrap;">${escapeHtml(k.replace(/_/g, ' '))}</td>
  <td style="padding:14px 20px;border-bottom:1px solid #1f1f1f;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#ffffff;white-space:pre-wrap;line-height:1.5;">${escapeHtml(display) || '<span style="color:#555;">—</span>'}</td>
</tr>`;
    }).join('');

  const now = new Date();
  const dateLine = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    + ' · ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#050505;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#0d0d0d;border:1px solid #1f1f1f;">
        <tr><td style="height:3px;background:${ACCENT};line-height:3px;font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:36px 32px 28px;text-align:center;">
          <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};margin-bottom:16px;">SOCIA VISUAL</div>
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:22px;letter-spacing:1px;text-transform:uppercase;color:#ffffff;line-height:1.2;">${escapeHtml(label)}</div>
          <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};margin-top:10px;">New Submission</div>
        </td></tr>
        <tr><td style="padding:0 32px;"><div style="height:1px;background:#1f1f1f;line-height:1px;font-size:0;">&nbsp;</div></td></tr>
        <tr><td style="padding:12px 16px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${rows}</table>
        </td></tr>
        <tr><td style="padding:0 32px 32px;text-align:center;">
          <a href="${SITE_URL}/admin#submissions" style="display:inline-block;background:${ACCENT};color:#050505;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:12px 24px;text-decoration:none;border-radius:2px;">View in Admin →</a>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#080808;border-top:1px solid #1f1f1f;text-align:center;">
          <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#666;">Submitted from <a href="${SITE_URL}" style="color:${ACCENT};text-decoration:none;">sociavisual.com</a></div>
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;color:#444;margin-top:6px;">${escapeHtml(dateLine)}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = clientIp(req);
  const userAgent = req.headers['user-agent'] || '';

  const rl = await rateLimit(ip);
  if (!rl.ok) return res.status(429).json({ error: 'Too many submissions. Try again later.' });

  let fields = req.body || {};
  if (typeof fields === 'string') {
    try { fields = JSON.parse(fields); } catch { return res.status(400).json({ error: 'Invalid payload' }); }
  }

  // Honeypots — bots fill hidden fields
  if ((fields._honeypot && String(fields._honeypot).trim() !== '') ||
      (fields.website && String(fields.website).trim() !== '')) {
    return res.status(200).json({ ok: true }); // silently accept
  }

  // reCAPTCHA verification
  const captcha = await verifyRecaptcha(fields['g-recaptcha-response'], ip);
  if (!captcha.skipped && !captcha.ok) {
    console.error('RECAPTCHA_REJECT reason=' + captcha.reason
      + ' score=' + (captcha.score ?? 'n/a')
      + ' errors=' + JSON.stringify(captcha.errors || [])
      + ' tokenLen=' + String(fields['g-recaptcha-response'] || '').length);
    return res.status(403).json({ error: 'Verification failed.', reason: captcha.reason });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const formType = String(fields._form || 'contact').toLowerCase();
  const label = FORM_LABELS[formType] || 'Website Form';
  const subject = fields._subject || `New ${label} submission — Socia Visual`;
  const replyTo = fields.email || fields.Email;

  const recipients = process.env.FORM_RECIPIENT
    ? process.env.FORM_RECIPIENT.split(',').map(s => s.trim()).filter(Boolean)
    : [DEFAULT_RECIPIENT];

  const payload = {
    from: FROM,
    to: recipients,
    subject,
    html: buildHtml(formType, fields)
  };
  if (replyTo && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(replyTo)) {
    payload.reply_to = replyTo;
  }

  // Always persist to DB first — email is best-effort
  await insertSubmission(formType, subject, fields, { ip, userAgent, recaptchaScore: captcha.score });

  try {
    const emailResult = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!emailResult.ok) {
      const errText = await emailResult.text();
      console.error('Resend error:', emailResult.status, errText);
      // Still count as success — submission is saved in DB
      return res.status(200).json({ ok: true, emailDelivered: false });
    }

    return res.status(200).json({ ok: true, emailDelivered: true });
  } catch (err) {
    console.error('Submit (email) error:', err && err.stack ? err.stack : err);
    // Email failed but data saved
    return res.status(200).json({ ok: true, emailDelivered: false });
  }
};
