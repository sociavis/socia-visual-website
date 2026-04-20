const {
  getServiceRoleClient,
  requireAdminSession
} = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminSession(req, res)) return;

  const { current_password, new_password } = req.body || {};
  if (typeof current_password !== 'string' || typeof new_password !== 'string') {
    return res.status(400).json({ error: 'current_password and new_password required' });
  }
  if (new_password.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters' });
  }

  try {
    const sb = getServiceRoleClient();
    const { data, error } = await sb
      .from('admin_settings')
      .select('value')
      .eq('key', 'admin_password')
      .single();
    if (error || !data) return res.status(500).json({ error: 'Server error' });

    if (current_password !== data.value) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const { error: updErr } = await sb
      .from('admin_settings')
      .update({ value: new_password, updated_at: new Date().toISOString() })
      .eq('key', 'admin_password');
    if (updErr) return res.status(500).json({ error: 'Failed to update password' });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('change-password error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
