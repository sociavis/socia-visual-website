const { getServiceRoleClient, requireAdminSession } = require('../_lib/auth');

const ALLOWED = [
  'client_email', 'company_name', 'client_name', 'amount_cents', 'currency',
  'description', 'day_of_month', 'stripe_customer_id', 'stripe_payment_method_id',
  'active', 'next_charge_date'
];

function sanitize(body) {
  const row = {};
  for (const k of ALLOWED) {
    if (Object.prototype.hasOwnProperty.call(body, k)) row[k] = body[k];
  }
  return row;
}

module.exports = async (req, res) => {
  if (!requireAdminSession(req, res)) return;
  const sb = getServiceRoleClient();

  try {
    if (req.method === 'GET') {
      const { data, error } = await sb
        .from('retainer_schedules')
        .select('*')
        .order('next_charge_date', { ascending: true });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ schedules: data || [] });
    }

    if (req.method === 'POST') {
      const row = sanitize(req.body || {});
      if (!row.client_email || !row.amount_cents || !row.description
          || !row.day_of_month || !row.next_charge_date) {
        return res.status(400).json({
          error: 'client_email, amount_cents, description, day_of_month, next_charge_date required'
        });
      }
      if (!row.currency) row.currency = 'usd';
      const { data, error } = await sb
        .from('retainer_schedules')
        .insert(row)
        .select()
        .single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ schedule: data });
    }

    if (req.method === 'PATCH') {
      const { id, ...rest } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const row = sanitize(rest);
      row.updated_at = new Date().toISOString();
      const { data, error } = await sb
        .from('retainer_schedules')
        .update(row)
        .eq('id', id)
        .select()
        .single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ schedule: data });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await sb.from('retainer_schedules').delete().eq('id', id);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('retainer-schedules error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
