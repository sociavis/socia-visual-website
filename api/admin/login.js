const {
  getServiceRoleClient,
  signAdminJwt,
  buildSessionCookie,
  hashPassword,
  verifyPassword,
  isBcryptHash,
  verifyTotpToken
} = require('../_lib/auth');
const { rateLimit, clientIp } = require('../_lib/rate-limit');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = clientIp(req);
  const rl = rateLimit(`admin-login:${ip}`, { windowMs: 60_000, max: 5 });
  if (!rl.ok) return res.status(429).json({ error: 'Too many attempts, wait a minute' });

  const { password, totp_code } = req.body || {};
  if (typeof password !== 'string' || !password.length) {
    return res.status(400).json({ error: 'Password required' });
  }

  try {
    const sb = getServiceRoleClient();

    const { data: rows, error } = await sb
      .from('admin_settings')
      .select('key, value')
      .in('key', ['admin_password', 'admin_totp_secret', 'admin_totp_enabled']);

    if (error) {
      console.error('admin_settings lookup failed', error);
      return res.status(500).json({ error: 'Server error' });
    }

    const settings = Object.fromEntries((rows || []).map(r => [r.key, r.value]));
    const stored = settings['admin_password'];
    if (!stored) return res.status(500).json({ error: 'Server error' });

    const valid = await verifyPassword(password, stored);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Silent migration: first successful login on a plaintext value upgrades it to bcrypt.
    if (!isBcryptHash(stored)) {
      try {
        const newHash = await hashPassword(password);
        await sb
          .from('admin_settings')
          .update({ value: newHash })
          .eq('key', 'admin_password');
      } catch (e) {
        console.error('password hash migration failed (non-fatal)', e);
      }
    }

    // 2FA gate (only if enabled).
    const totpEnabled = settings['admin_totp_enabled'] === '1' && !!settings['admin_totp_secret'];
    if (totpEnabled) {
      if (typeof totp_code !== 'string' || !totp_code.length) {
        return res.status(200).json({ ok: false, totp_required: true });
      }
      if (!verifyTotpToken(totp_code, settings['admin_totp_secret'])) {
        return res.status(401).json({ error: 'Invalid 2FA code' });
      }
    }

    const jwtToken = signAdminJwt({ role: 'admin' });
    res.setHeader('Set-Cookie', buildSessionCookie(jwtToken));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
