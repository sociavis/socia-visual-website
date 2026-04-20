const BUCKETS = new Map();

function rateLimit(key, { windowMs, max }) {
  const now = Date.now();
  const entry = BUCKETS.get(key);
  if (!entry || entry.resetAt <= now) {
    BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }
  if (entry.count >= max) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count += 1;
  return { ok: true, remaining: max - entry.count };
}

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

module.exports = { rateLimit, clientIp };
