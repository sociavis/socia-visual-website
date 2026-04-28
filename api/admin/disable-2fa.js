const {
  requireAdminSession,
  getServiceRoleClient,
  verifyPassword,
  verifyTotpToken
} = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminSession(req, res)) return;

  const { password, totp_code } = req.body || {};
  if (typeof password !== 'string' || typeof totp_code !== 'string') {
    return res.status(400).json({ error: 'password and totp_code required' });
  }

  try {
    const sb = getServiceRoleClient();
    const { data: rows, error } = await sb
      .from('admin_settings')
      .select('key, value')
      .in('key', ['admin_password', 'admin_totp_secret', 'admin_totp_enabled']);
    if (error) return res.status(500).json({ error: 'Server error' });
    const settings = Object.fromEntries((rows || []).map(r => [r.key, r.value]));

    if (settings['admin_totp_enabled'] !== '1') {
      return res.status(400).json({ error: '2FA is not enabled' });
    }
    if (!(await verifyPassword(password, settings['admin_password']))) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    if (!verifyTotpToken(totp_code, settings['admin_totp_secret'])) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    await sb.from('admin_settings').delete().in('key', ['admin_totp_secret', 'admin_totp_enabled']);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('disable-2fa error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
