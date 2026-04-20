const {
  getServiceRoleClient,
  signAdminJwt,
  buildSessionCookie
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

  const { password } = req.body || {};
  if (typeof password !== 'string' || !password.length) {
    return res.status(400).json({ error: 'Password required' });
  }

  try {
    const sb = getServiceRoleClient();
    const { data, error } = await sb
      .from('admin_settings')
      .select('value')
      .eq('key', 'admin_password')
      .single();

    if (error || !data) {
      console.error('admin_password lookup failed', error);
      return res.status(500).json({ error: 'Server error' });
    }

    if (password !== data.value) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const jwtToken = signAdminJwt({ role: 'admin' });
    res.setHeader('Set-Cookie', buildSessionCookie(jwtToken));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
