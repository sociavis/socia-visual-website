const { buildSessionCookie } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Set-Cookie', buildSessionCookie('', { clear: true }));
  return res.status(200).json({ ok: true });
};
