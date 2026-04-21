module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'public, max-age=60');
  return res.status(200).json({
    stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY || ''
  });
};
