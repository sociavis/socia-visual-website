const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const otplib = require('otplib');
const { createClient } = require('@supabase/supabase-js');

const ADMIN_COOKIE_NAME = 'sv_admin_session';
const ADMIN_SESSION_TTL_SECONDS = 12 * 60 * 60;
const BCRYPT_HASH_RE = /^\$2[aby]\$/;

function env(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function getServiceRoleClient() {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function signInvoiceToken(invoiceId) {
  const secret = env('INVOICE_TOKEN_SECRET');
  return crypto.createHmac('sha256', secret).update(String(invoiceId)).digest('base64url');
}

function verifyInvoiceToken(invoiceId, token) {
  if (typeof token !== 'string' || typeof invoiceId !== 'string') return false;
  const expected = signInvoiceToken(invoiceId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function signAdminJwt(payload = {}) {
  return jwt.sign(payload, env('ADMIN_JWT_SECRET'), {
    expiresIn: ADMIN_SESSION_TTL_SECONDS,
    issuer: 'sociavisual-admin'
  });
}

function verifyAdminJwt(token) {
  try {
    return jwt.verify(token, env('ADMIN_JWT_SECRET'), { issuer: 'sociavisual-admin' });
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx < 0) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function buildSessionCookie(jwtToken, { clear = false } = {}) {
  const parts = [
    `${ADMIN_COOKIE_NAME}=${clear ? '' : encodeURIComponent(jwtToken)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    clear ? 'Max-Age=0' : `Max-Age=${ADMIN_SESSION_TTL_SECONDS}`
  ];
  return parts.join('; ');
}

function readAdminSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[ADMIN_COOKIE_NAME];
  if (!token) return null;
  return verifyAdminJwt(token);
}

function requireAdminSession(req, res) {
  const session = readAdminSession(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return session;
}

function isBcryptHash(value) {
  return typeof value === 'string' && BCRYPT_HASH_RE.test(value);
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

async function verifyPassword(plain, stored) {
  if (typeof plain !== 'string' || typeof stored !== 'string') return false;
  if (isBcryptHash(stored)) {
    try { return await bcrypt.compare(plain, stored); } catch { return false; }
  }
  // Legacy plaintext — constant-time compare.
  if (plain.length !== stored.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(plain), Buffer.from(stored));
  } catch { return false; }
}

function generateTotpSecret() {
  return otplib.generateSecret();
}

function verifyTotpToken(token, secret) {
  if (typeof token !== 'string' || typeof secret !== 'string') return false;
  const cleaned = token.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleaned)) return false;
  try {
    const result = otplib.verifySync({ token: cleaned, secret });
    return !!(result && result.valid);
  } catch { return false; }
}

function getTotpUri(secret, label = 'admin@sociavisual.com', issuer = 'Socia Visual') {
  return otplib.generateURI({ label, issuer, secret });
}

module.exports = {
  ADMIN_COOKIE_NAME,
  getServiceRoleClient,
  signInvoiceToken,
  verifyInvoiceToken,
  signAdminJwt,
  verifyAdminJwt,
  buildSessionCookie,
  readAdminSession,
  requireAdminSession,
  isBcryptHash,
  hashPassword,
  verifyPassword,
  generateTotpSecret,
  verifyTotpToken,
  getTotpUri
};
