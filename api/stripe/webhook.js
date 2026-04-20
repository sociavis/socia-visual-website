const { getServiceRoleClient } = require('../_lib/auth');
const { getStripeClient, readRawBody } = require('../_lib/stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return res.status(400).json({ error: 'Missing signature' });

  let event;
  try {
    const raw = await readRawBody(req);
    event = getStripeClient().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error('webhook signature verification failed', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const sb = getServiceRoleClient();

  // Idempotency: dedupe by stripe event id
  const { error: insertErr } = await sb.from('webhook_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event
  });
  if (insertErr) {
    if (insertErr.code === '23505') {
      // duplicate — already processed
      return res.status(200).json({ received: true, duplicate: true });
    }
    console.error('webhook_events insert error', insertErr);
    return res.status(500).json({ error: 'Persistence error' });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(sb, event.data.object);
        break;
      case 'payment_intent.processing':
        await updatePaymentIntent(sb, event.data.object);
        break;
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
        await updatePaymentIntent(sb, event.data.object, {
          last_error: event.data.object.last_payment_error?.message || null
        });
        break;
      case 'charge.succeeded':
      case 'charge.updated':
        await upsertCharge(sb, event.data.object);
        break;
      case 'charge.refunded':
        await upsertCharge(sb, event.data.object);
        await markInvoiceRefunded(sb, event.data.object);
        break;
      default:
        // Ignore other events for MVP
        break;
    }
  } catch (err) {
    console.error(`webhook handler error for ${event.type}`, err);
    // Still 200 so Stripe doesn't retry; we have the event logged in webhook_events
    return res.status(200).json({ received: true, handled: false, error: err.message });
  }

  return res.status(200).json({ received: true });
};

async function updatePaymentIntent(sb, pi, extra = {}) {
  await sb.from('payment_intents').upsert({
    stripe_payment_intent_id: pi.id,
    invoice_id: pi.metadata?.invoice_id || null,
    amount_cents: pi.amount,
    currency: pi.currency,
    status: pi.status,
    payment_method_type: pi.payment_method_types?.[0] || null,
    updated_at: new Date().toISOString(),
    ...extra
  }, { onConflict: 'stripe_payment_intent_id' });
}

async function handlePaymentIntentSucceeded(sb, pi) {
  await updatePaymentIntent(sb, pi);
  const invoiceId = pi.metadata?.invoice_id;
  if (!invoiceId) return;

  await sb.from('invoices').update({
    status: 'paid',
    paid_at: new Date().toISOString(),
    amount_cents: pi.amount,
    currency: pi.currency,
    stripe_payment_intent_id: pi.id,
    updated_at: new Date().toISOString()
  }).eq('id', invoiceId);
}

async function upsertCharge(sb, charge) {
  const bt = charge.balance_transaction;
  await sb.from('charges').upsert({
    stripe_charge_id: charge.id,
    stripe_payment_intent_id: charge.payment_intent || null,
    invoice_id: charge.metadata?.invoice_id || null,
    amount_cents: charge.amount,
    fee_cents: typeof bt === 'object' && bt ? bt.fee : null,
    net_cents: typeof bt === 'object' && bt ? bt.net : null,
    currency: charge.currency,
    status: charge.status,
    payment_method_type: charge.payment_method_details?.type || null,
    receipt_url: charge.receipt_url || null
  }, { onConflict: 'stripe_charge_id' });
}

async function markInvoiceRefunded(sb, charge) {
  const invoiceId = charge.metadata?.invoice_id;
  if (!invoiceId) return;
  // Only flip to refunded if fully refunded; partial refunds stay "paid"
  if (charge.amount_refunded >= charge.amount) {
    await sb.from('invoices').update({
      status: 'refunded',
      updated_at: new Date().toISOString()
    }).eq('id', invoiceId);
  }
}

module.exports.config = {
  api: { bodyParser: false }
};
