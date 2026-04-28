const {
  requireAdminSession,
  getServiceRoleClient,
  verifyTotpToken
} = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminSession(req, res)) return;

  const { totp_code } = req.body || {};
  if (typeof totp_code !== 'string' || !totp_code.length) {
    return res.status(400).json({ error: 'totp_code required' });
  }

  try {
    const sb = getServiceRoleClient();
    const { data: pending, error } = await sb
      .from('admin_settings')
      .select('value')
      .eq('key', 'admin_totp_secret_pending')
      .maybeSingle();

    if (error || !pending) {
      return res.status(400).json({ error: 'No pending 2FA setup. Call /api/admin/setup-2fa first.' });
    }
    const secret = pending.value;
    if (!verifyTotpToken(totp_code, secret)) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    // Promote pending → active.
    await sb.from('admin_settings').upsert(
      [
        { key: 'admin_totp_secret', value: secret },
        { key: 'admin_totp_enabled', value: '1' }
      ],
      { onConflict: 'key' }
    );
    await sb.from('admin_settings').delete().eq('key', 'admin_totp_secret_pending');

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('verify-2fa-setup error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
