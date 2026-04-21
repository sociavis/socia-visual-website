const { getServiceRoleClient, requireAdminSession } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (!requireAdminSession(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sb = getServiceRoleClient();
  try {
    const { data: customers, error: custErr } = await sb
      .from('stripe_customers')
      .select('*')
      .order('created_at', { ascending: false });
    if (custErr) return res.status(400).json({ error: custErr.message });

    const { data: methods, error: pmErr } = await sb
      .from('payment_methods')
      .select('*')
      .is('detached_at', null)
      .order('created_at', { ascending: false });
    if (pmErr) return res.status(400).json({ error: pmErr.message });

    const byCustomer = new Map();
    for (const pm of methods || []) {
      const arr = byCustomer.get(pm.stripe_customer_id) || [];
      arr.push(pm);
      byCustomer.set(pm.stripe_customer_id, arr);
    }
    const enriched = (customers || []).map(c => ({
      ...c,
      payment_methods: byCustomer.get(c.stripe_customer_id) || []
    }));

    return res.status(200).json({ customers: enriched });
  } catch (err) {
    console.error('admin/customers error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
