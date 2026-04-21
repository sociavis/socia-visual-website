const { getServiceRoleClient } = require('./_lib/auth');
const { getStripeClient } = require('./_lib/stripe');

module.exports = async (req, res) => {
  // Auth: Vercel Cron sends Authorization: Bearer $CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sb = getServiceRoleClient();
  const stripe = getStripeClient();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Pick active schedules whose next charge is today or past due.
  const { data: schedules, error } = await sb
    .from('retainer_schedules')
    .select('*')
    .eq('active', true)
    .lte('next_charge_date', today);

  if (error) {
    console.error('retainer-charges query error', error);
    return res.status(500).json({ error: 'Query failed' });
  }

  const results = [];

  for (const sched of schedules || []) {
    try {
      const invoiceId = `inv_ret_${Date.now()}_${sched.id.slice(0, 8)}`;
      const invoiceNumber = await nextInvoiceNumber(sb);
      const chargeMonth = monthNameFromDate(today);

      // 1) Create the invoice row
      const invoiceRow = {
        id: invoiceId,
        number: invoiceNumber,
        date: today,
        status: 'unpaid',
        company_name: sched.company_name || null,
        client_name: sched.client_name || null,
        client_email: sched.client_email,
        period: chargeMonth,
        items: [{
          qty: 1,
          price: sched.amount_cents / 100,
          description: sched.description
        }],
        notes: 'Auto-generated retainer invoice',
        amount_cents: sched.amount_cents,
        currency: sched.currency,
        updated_at: new Date().toISOString()
      };

      const { error: invInsertErr } = await sb.from('invoices').insert(invoiceRow);
      if (invInsertErr) throw new Error(`invoice insert failed: ${invInsertErr.message}`);

      // 2) Create off-session PaymentIntent against the saved PM
      const pi = await stripe.paymentIntents.create({
        amount: sched.amount_cents,
        currency: sched.currency,
        customer: sched.stripe_customer_id,
        payment_method: sched.stripe_payment_method_id,
        off_session: true,
        confirm: true,
        description: `Retainer: ${sched.description}`,
        metadata: {
          invoice_id: invoiceId,
          invoice_number: invoiceNumber,
          retainer_schedule_id: sched.id,
          client_email: sched.client_email
        },
        receipt_email: sched.client_email || undefined
      });

      await sb.from('payment_intents').upsert({
        stripe_payment_intent_id: pi.id,
        invoice_id: invoiceId,
        amount_cents: sched.amount_cents,
        currency: sched.currency,
        status: pi.status
      }, { onConflict: 'stripe_payment_intent_id' });

      await sb.from('invoices').update({
        stripe_payment_intent_id: pi.id
      }).eq('id', invoiceId);

      // 3) Advance the schedule
      const nextDate = advanceDate(sched.next_charge_date, sched.day_of_month);
      await sb.from('retainer_schedules').update({
        next_charge_date: nextDate,
        last_invoice_id: invoiceId,
        last_charge_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString()
      }).eq('id', sched.id);

      results.push({ schedule_id: sched.id, invoice_id: invoiceId, pi_id: pi.id, status: pi.status });
    } catch (err) {
      console.error(`retainer-charges: ${sched.id} failed`, err.message);
      await sb.from('retainer_schedules').update({
        last_error: err.message,
        updated_at: new Date().toISOString()
      }).eq('id', sched.id);
      results.push({ schedule_id: sched.id, error: err.message });
    }
  }

  return res.status(200).json({ processed: results.length, results });
};

async function nextInvoiceNumber(sb) {
  const { data } = await sb
    .from('invoices')
    .select('number')
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle();
  const last = parseInt(data?.number, 10) || 498;
  return String(last + 1).padStart(4, '0');
}

function monthNameFromDate(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function advanceDate(currentIso, dayOfMonth) {
  const d = new Date(currentIso + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + 1);
  // Clamp day_of_month to the chosen day (capped to 28 by the schema).
  d.setUTCDate(dayOfMonth);
  return d.toISOString().slice(0, 10);
}
