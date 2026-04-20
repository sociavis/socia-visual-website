const { readAdminSession } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = readAdminSession(req);
  if (!session) return res.status(200).json({ authenticated: false });
  return res.status(200).json({ authenticated: true, role: session.role });
};
