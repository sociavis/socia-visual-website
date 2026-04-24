const { getServiceRoleClient, requireAdminSession } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (!requireAdminSession(req, res)) return;
  const sb = getServiceRoleClient();

  try {
    if (req.method === 'GET') {
      const { data, error } = await sb
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ submissions: data || [] });
    }

    if (req.method === 'PATCH') {
      const { id, ...updates } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const allowed = {};
      if ('is_read' in updates) allowed.is_read = !!updates.is_read;
      if ('is_spam' in updates) allowed.is_spam = !!updates.is_spam;
      if ('notes' in updates) allowed.notes = updates.notes ? String(updates.notes) : null;
      if (!Object.keys(allowed).length) return res.status(400).json({ error: 'No valid fields' });
      const { error } = await sb.from('submissions').update(allowed).eq('id', id);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const { error } = await sb.from('submissions').delete().eq('id', id);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin/submissions error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
