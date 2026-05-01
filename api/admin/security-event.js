// PATCH /api/admin/security-event?id=… — triage actions: resolve, ignore, reopen, add note.

const { getServiceRoleClient, requireAdminSession } = require('../_lib/auth');

const VALID_STATUSES = new Set(['open', 'resolved', 'ignored']);

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
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const id = req.query?.id;
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    const body = await readBody(req);
    const update = {};
    if (body.status) {
      if (!VALID_STATUSES.has(body.status)) return res.status(400).json({ error: 'Invalid status' });
      update.status = body.status;
      update.resolved_at = body.status === 'open' ? null : new Date().toISOString();
    }
    if (typeof body.triage_note === 'string') update.triage_note = body.triage_note.slice(0, 1000);
    if (Object.keys(update).length === 0) return res.status(400).json({ error: 'Nothing to update' });

    const sb = getServiceRoleClient();
    const { data, error } = await sb.from('security_events').update(update).eq('id', id).select('*').single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ event: data });
  } catch (err) {
    console.error('admin/security-event error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
};
