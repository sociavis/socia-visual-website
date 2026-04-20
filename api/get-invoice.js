const { getServiceRoleClient, verifyInvoiceToken } = require('./_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, t } = req.query || {};
  if (typeof id !== 'string' || !id.length) {
    return res.status(400).json({ error: 'id required' });
  }
  if (typeof t !== 'string' || !t.length) {
    return res.status(400).json({ error: 'token required' });
  }

  if (!verifyInvoiceToken(id, t)) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  try {
    const sb = getServiceRoleClient();
    const { data, error } = await sb
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Not found' });

    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).json({ invoice: data });
  } catch (err) {
    console.error('get-invoice error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
