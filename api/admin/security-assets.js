// CRUD for monitored_assets — POST create, PATCH update, DELETE remove.

const { getServiceRoleClient, requireAdminSession } = require('../_lib/auth');

const ALLOWED_FIELDS = ['slug', 'label', 'category', 'domain', 'https_url', 'host_provider', 'cms', 'notes', 'active'];

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (!requireAdminSession(req, res)) return;
  const sb = getServiceRoleClient();

  try {
    if (req.method === 'POST') {
      const body = await readBody(req);
      if (!body.slug || !body.label || !body.domain) {
        return res.status(400).json({ error: 'slug, label, domain are required' });
      }
      const insert = {
        slug: String(body.slug).toLowerCase().trim(),
        label: String(body.label).trim(),
        category: body.category || 'client',
        domain: String(body.domain).toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, ''),
        https_url: body.https_url || `https://${String(body.domain).toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')}`,
        host_provider: body.host_provider || null,
        cms: body.cms || null,
        notes: body.notes || null,
        active: body.active !== false
      };
      const { data, error } = await sb.from('monitored_assets').insert(insert).select('*').single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ asset: data });
    }

    if (req.method === 'PATCH') {
      const id = req.query?.id;
      if (!id) return res.status(400).json({ error: 'id required' });
      const body = await readBody(req);
      const update = {};
      for (const k of ALLOWED_FIELDS) {
        if (k in body) update[k] = body[k];
      }
      update.updated_at = new Date().toISOString();
      const { data, error } = await sb.from('monitored_assets').update(update).eq('id', id).select('*').single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ asset: data });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await sb.from('monitored_assets').delete().eq('id', id);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin/security-assets error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
};
