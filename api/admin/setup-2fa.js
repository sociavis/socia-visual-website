const {
  requireAdminSession,
  getServiceRoleClient,
  generateTotpSecret,
  getTotpUri
} = require('../_lib/auth');
const QRCode = require('qrcode');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminSession(req, res)) return;

  try {
    const sb = getServiceRoleClient();

    // If already enabled, refuse (must disable first).
    const { data: cur } = await sb
      .from('admin_settings')
      .select('value')
      .eq('key', 'admin_totp_enabled')
      .maybeSingle();
    if (cur && cur.value === '1') {
      return res.status(400).json({ error: '2FA is already enabled. Disable it first to re-enroll.' });
    }

    const secret = generateTotpSecret();
    const uri = getTotpUri(secret);
    const qr = await QRCode.toDataURL(uri, { margin: 1, width: 240 });

    // Store secret as PENDING — only promoted to active after verify-2fa-setup.
    await sb
      .from('admin_settings')
      .upsert([{ key: 'admin_totp_secret_pending', value: secret }], { onConflict: 'key' });

    return res.status(200).json({ secret, qr_data_url: qr, uri });
  } catch (err) {
    console.error('setup-2fa error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
