const { requireAdminSession, signInvoiceToken } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminSession(req, res)) return;

  const { invoice_id } = req.body || {};
  if (typeof invoice_id !== 'string' || !invoice_id.length) {
    return res.status(400).json({ error: 'invoice_id required' });
  }

  const token = signInvoiceToken(invoice_id);

  const origin =
    process.env.PUBLIC_SITE_ORIGIN ||
    `https://${req.headers.host || 'sociavisual.com'}`;

  const url = `${origin}/invoice.html?id=${encodeURIComponent(invoice_id)}&t=${token}`;

  return res.status(200).json({ token, url });
};
