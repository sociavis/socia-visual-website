const Stripe = require('stripe');

let _client = null;

function getStripeClient() {
  if (_client) return _client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing required env var: STRIPE_SECRET_KEY');
  _client = new Stripe(key, {
    apiVersion: '2025-01-27.acacia',
    typescript: false,
    telemetry: false,
    appInfo: { name: 'socia-visual-website', version: '1.0.0' }
  });
  return _client;
}

function invoiceToAmountCents(invoice) {
  const items = Array.isArray(invoice?.items) ? invoice.items : [];
  let totalCents = 0;
  for (const item of items) {
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    totalCents += Math.round(qty * price * 100);
  }
  return totalCents;
}

async function readRawBody(req) {
  if (req.body && typeof req.body === 'string') return Buffer.from(req.body);
  if (Buffer.isBuffer(req.body)) return req.body;
  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = {
  getStripeClient,
  invoiceToAmountCents,
  readRawBody
};
