const { requireAdminSession, getServiceRoleClient } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminSession(req, res)) return;

  try {
    const sb = getServiceRoleClient();
    const { data } = await sb
      .from('admin_settings')
      .select('value')
      .eq('key', 'admin_totp_enabled')
      .maybeSingle();
    return res.status(200).json({ enabled: data && data.value === '1' });
  } catch (err) {
    console.error('2fa-status error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
