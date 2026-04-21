const { getServiceRoleClient, verifyInvoiceToken } = require('../_lib/auth');
const { getStripeClient, invoiceToAmountCents } = require('../_lib/stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { invoice_id, token } = req.body || {};
  if (typeof invoice_id !== 'string' || !invoice_id || typeof token !== 'string' || !token) {
    return res.status(400).json({ error: 'invoice_id and token required' });
  }
  if (!verifyInvoiceToken(invoice_id, token)) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  try {
    const sb = getServiceRoleClient();
    const { data: invoice, error } = await sb
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .single();

    if (error || !invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status === 'paid') return res.status(400).json({ error: 'Invoice already paid' });

    const amountCents = invoiceToAmountCents(invoice);
    if (amountCents < 50) return res.status(400).json({ error: 'Invoice amount too small' });

    const currency = (invoice.currency || 'usd').toLowerCase();
    const stripe = getStripeClient();

    // Reuse existing PaymentIntent if one is attached and still usable.
    if (invoice.stripe_payment_intent_id) {
      try {
        const existing = await stripe.paymentIntents.retrieve(invoice.stripe_payment_intent_id);
        if (['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing'].includes(existing.status)
            && existing.amount === amountCents
            && existing.currency === currency) {
          return res.status(200).json({
            client_secret: existing.client_secret,
            payment_intent_id: existing.id,
            amount_cents: amountCents,
            currency
          });
        }
        if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existing.status)) {
          await stripe.paymentIntents.cancel(existing.id).catch(() => {});
        }
      } catch { /* fall through to creating a new one */ }
    }

    // Look up or create a Stripe Customer for this client_email — enables
    // saving the payment method for future retainer auto-charges.
    let stripeCustomerId = null;
    const clientEmail = (invoice.client_email || '').trim().toLowerCase();
    if (clientEmail) {
      const { data: existingCustomer } = await sb
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('client_email', clientEmail)
        .maybeSingle();

      if (existingCustomer?.stripe_customer_id) {
        stripeCustomerId = existingCustomer.stripe_customer_id;
      } else {
        const customer = await stripe.customers.create({
          email: invoice.client_email,
          name: invoice.client_name || undefined,
          metadata: {
            company_name: invoice.company_name || '',
            source: 'invoice'
          }
        });
        stripeCustomerId = customer.id;
        await sb.from('stripe_customers').upsert({
          stripe_customer_id: customer.id,
          client_email: clientEmail,
          company_name: invoice.company_name || null,
          client_name: invoice.client_name || null
        }, { onConflict: 'stripe_customer_id' });
      }
    }

    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      automatic_payment_methods: { enabled: true },
      customer: stripeCustomerId || undefined,
      setup_future_usage: stripeCustomerId ? 'off_session' : undefined,
      description: `Invoice #${invoice.number} — ${invoice.company_name || invoice.client_name || 'Client'}`,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.number || '',
        client_email: invoice.client_email || ''
      },
      receipt_email: invoice.client_email || undefined
    });

    await sb.from('payment_intents').upsert({
      stripe_payment_intent_id: pi.id,
      invoice_id: invoice.id,
      amount_cents: amountCents,
      currency,
      status: pi.status,
      updated_at: new Date().toISOString()
    }, { onConflict: 'stripe_payment_intent_id' });

    await sb.from('invoices').update({
      stripe_payment_intent_id: pi.id,
      amount_cents: amountCents,
      currency,
      updated_at: new Date().toISOString()
    }).eq('id', invoice.id);

    return res.status(200).json({
      client_secret: pi.client_secret,
      payment_intent_id: pi.id,
      amount_cents: amountCents,
      currency
    });
  } catch (err) {
    console.error('create-payment-intent error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
