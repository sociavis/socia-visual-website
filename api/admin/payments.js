const { getServiceRoleClient, requireAdminSession } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (!requireAdminSession(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sb = getServiceRoleClient();
  const invoiceId = req.query?.invoice_id;

  try {
    let chargesQuery = sb
      .from('charges')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (invoiceId) chargesQuery = chargesQuery.eq('invoice_id', invoiceId);
    const { data: charges, error: cErr } = await chargesQuery;
    if (cErr) return res.status(400).json({ error: cErr.message });

    let piQuery = sb
      .from('payment_intents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (invoiceId) piQuery = piQuery.eq('invoice_id', invoiceId);
    const { data: pis, error: piErr } = await piQuery;
    if (piErr) return res.status(400).json({ error: piErr.message });

    return res.status(200).json({
      charges: charges || [],
      payment_intents: pis || []
    });
  } catch (err) {
    console.error('admin/payments error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
