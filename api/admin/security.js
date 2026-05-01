// GET /api/admin/security — return inventory + recent events for the admin Security tab.

const { getServiceRoleClient, requireAdminSession } = require('../_lib/auth');

const SEVERITY_RANK = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };

module.exports = async (req, res) => {
  if (!requireAdminSession(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sb = getServiceRoleClient();
  const [{ data: assets, error: aErr }, { data: events, error: eErr }] = await Promise.all([
    sb.from('monitored_assets').select('*').order('category', { ascending: true }).order('label', { ascending: true }),
    sb.from('security_events').select('*').order('detected_at', { ascending: false }).limit(500)
  ]);
  if (aErr) return res.status(400).json({ error: aErr.message });
  if (eErr) return res.status(400).json({ error: eErr.message });

  // Compute aggregate posture: total open by severity, plus per-asset open counts.
  const openByAsset = new Map();
  const tally = { open: 0, resolved: 0, ignored: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const ev of events || []) {
    tally[ev.status] = (tally[ev.status] || 0) + 1;
    if (ev.status === 'open') {
      tally[ev.severity] = (tally[ev.severity] || 0) + 1;
      const a = openByAsset.get(ev.asset_id) || { count: 0, max: -1 };
      a.count += 1;
      a.max = Math.max(a.max, SEVERITY_RANK[ev.severity] ?? 0);
      openByAsset.set(ev.asset_id, a);
    }
  }

  // Worst-case asset rolls up to a 0-100 score: 100 = clean, drops by severity.
  const SEVERITY_PENALTY = { info: 0, low: 2, medium: 8, high: 20, critical: 35 };
  let totalPenalty = 0;
  for (const ev of events || []) {
    if (ev.status === 'open') totalPenalty += SEVERITY_PENALTY[ev.severity] || 0;
  }
  const score = Math.max(0, Math.min(100, 100 - totalPenalty));

  return res.status(200).json({
    assets: (assets || []).map(a => ({
      ...a,
      open_count: openByAsset.get(a.id)?.count || 0
    })),
    events: events || [],
    summary: {
      score,
      open: tally.open || 0,
      resolved_total: tally.resolved || 0,
      by_severity: {
        critical: tally.critical || 0,
        high: tally.high || 0,
        medium: tally.medium || 0,
        low: tally.low || 0,
        info: tally.info || 0
      }
    }
  });
};
