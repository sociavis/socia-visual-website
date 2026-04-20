const { getServiceRoleClient, requireAdminSession } = require('../_lib/auth');

const ALLOWED_FIELDS = [
  'id', 'number', 'date', 'status', 'company_name', 'client_name',
  'client_email', 'period', 'items', 'notes'
];

function sanitize(body) {
  const row = {};
  for (const k of ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, k)) row[k] = body[k];
  }
  return row;
}

module.exports = async (req, res) => {
  if (!requireAdminSession(req, res)) return;

  const sb = getServiceRoleClient();

  try {
    if (req.method === 'POST') {
      const row = sanitize(req.body || {});
      if (!row.id || !row.number) {
        return res.status(400).json({ error: 'id and number required' });
      }
      row.updated_at = new Date().toISOString();
      const { data, error } = await sb.from('invoices').insert(row).select().single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ invoice: data });
    }

    if (req.method === 'PATCH') {
      const { id, ...rest } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const row = sanitize({ ...rest, id });
      row.updated_at = new Date().toISOString();
      const { data, error } = await sb
        .from('invoices')
        .upsert(row)
        .select()
        .single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ invoice: data });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await sb.from('invoices').delete().eq('id', id);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('invoices error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
