// GET /api/admin/command-center — global rollup for the operations dashboard.
// Aggregates KPIs across security, billing, retainers, and form submissions,
// plus per-client cards for the mission grid and a unified recent-activity stream.

const { getServiceRoleClient, requireAdminSession } = require('../_lib/auth');

const SEVERITY_RANK = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };

module.exports = async (req, res) => {
  if (!requireAdminSession(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sb = getServiceRoleClient();
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

  // Run every query in parallel — page should load fast even with chatty Supabase.
  const [
    assetsRes,
    eventsRes,
    invoicesUnpaidRes,
    invoicesRecentRes,
    submissionsRes,
    retainersRes,
    chargesRes
  ] = await Promise.all([
    sb.from('monitored_assets').select('*').order('category').order('label'),
    sb.from('security_events').select('id, asset_id, severity, status, title, source, check_key, detected_at').order('detected_at', { ascending: false }).limit(500),
    sb.from('invoices').select('id, number, company_name, client_name, client_email, amount_cents, currency, status, date, period').eq('status', 'unpaid').order('date', { ascending: false }),
    sb.from('invoices').select('id, number, company_name, client_email, amount_cents, currency, status, date, paid_at, updated_at').gte('updated_at', thirtyDaysAgo).order('updated_at', { ascending: false }).limit(50),
    sb.from('submissions').select('id, name, email, message, is_read, is_spam, created_at').gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }).limit(50),
    sb.from('retainer_schedules').select('id, client_email, company_name, amount_cents, currency, next_charge_date, active, last_error').eq('active', true),
    sb.from('charges').select('id, amount_cents, currency, status, invoice_id, created_at, brand, last4, customer_email').gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }).limit(50)
  ]);

  if (assetsRes.error)        return res.status(400).json({ error: 'assets: ' + assetsRes.error.message });
  if (eventsRes.error)        return res.status(400).json({ error: 'events: ' + eventsRes.error.message });
  if (invoicesUnpaidRes.error) return res.status(400).json({ error: 'invoices: ' + invoicesUnpaidRes.error.message });

  const assets = assetsRes.data || [];
  const events = eventsRes.data || [];
  const unpaidInvoices = invoicesUnpaidRes.data || [];
  const recentInvoices = invoicesRecentRes.data || [];
  const submissions = submissionsRes.data || [];
  const retainers = retainersRes.data || [];
  const charges = chargesRes.data || [];

  // ── Per-asset enrichment: open finding count + worst severity ──
  const assetEnrichment = new Map();
  for (const ev of events) {
    if (ev.status !== 'open' || !ev.asset_id) continue;
    const cur = assetEnrichment.get(ev.asset_id) || { open_count: 0, worst_severity: null, worst_rank: -1 };
    cur.open_count += 1;
    const rank = SEVERITY_RANK[ev.severity] ?? 0;
    if (rank > cur.worst_rank) {
      cur.worst_rank = rank;
      cur.worst_severity = ev.severity;
    }
    assetEnrichment.set(ev.asset_id, cur);
  }

  const enrichedAssets = assets.map(a => {
    const e = assetEnrichment.get(a.id) || { open_count: 0, worst_severity: null };
    // Mission status combines security + sweep freshness:
    //   - never swept → 'unknown'
    //   - critical/high open → 'red'
    //   - medium open → 'yellow'
    //   - else → 'green'
    let mission_status = 'unknown';
    if (a.last_swept_at) {
      if (e.worst_severity === 'critical' || e.worst_severity === 'high') mission_status = 'red';
      else if (e.worst_severity === 'medium') mission_status = 'yellow';
      else mission_status = 'green';
    }
    return {
      ...a,
      open_count: e.open_count,
      worst_severity: e.worst_severity,
      mission_status
    };
  });

  // ── KPIs ──
  const openSecurity = events.filter(e => e.status === 'open');
  const openCritical = openSecurity.filter(e => e.severity === 'critical').length;
  const openHigh     = openSecurity.filter(e => e.severity === 'high').length;
  const openMedium   = openSecurity.filter(e => e.severity === 'medium').length;

  const overdueInvoices = unpaidInvoices.filter(i => i.date && i.date < today);
  const overdueAmount   = unpaidInvoices.reduce((s, i) => s + (i.amount_cents || 0), 0);

  const unreadSubmissions = submissions.filter(s => !s.is_read && !s.is_spam).length;
  const totalSubmissions30d = submissions.filter(s => !s.is_spam).length;

  const mrrCents = retainers.reduce((s, r) => s + (r.amount_cents || 0), 0);
  const retainerErrors = retainers.filter(r => r.last_error).length;

  const charges30dTotal = charges
    .filter(c => c.status === 'succeeded')
    .reduce((s, c) => s + (c.amount_cents || 0), 0);

  const assetStatusTally = enrichedAssets.reduce((acc, a) => {
    if (!a.active) return acc;
    acc[a.mission_status] = (acc[a.mission_status] || 0) + 1;
    return acc;
  }, { green: 0, yellow: 0, red: 0, unknown: 0 });

  // ── Unified activity stream: merge events from each source, sort desc ──
  const activity = [];

  for (const ev of events.slice(0, 20)) {
    activity.push({
      type: 'security',
      severity: ev.severity,
      title: ev.title,
      asset_id: ev.asset_id,
      ts: ev.detected_at,
      meta: ev.source
    });
  }
  for (const inv of recentInvoices.slice(0, 20)) {
    let kind = 'invoice_updated';
    if (inv.status === 'paid' && inv.paid_at) kind = 'invoice_paid';
    else if (inv.status === 'unpaid') kind = 'invoice_issued';
    activity.push({
      type: 'invoice',
      kind,
      title: `${inv.status === 'paid' ? 'Paid' : 'Issued'} #${inv.number} · ${inv.company_name || inv.client_email || ''} · $${((inv.amount_cents||0)/100).toFixed(2)} ${(inv.currency||'usd').toUpperCase()}`,
      ts: inv.paid_at || inv.updated_at || inv.date,
      meta: 'invoices'
    });
  }
  for (const sub of submissions.slice(0, 15)) {
    if (sub.is_spam) continue;
    activity.push({
      type: 'submission',
      title: `New form submission · ${sub.name || sub.email}`,
      ts: sub.created_at,
      meta: 'submissions'
    });
  }
  for (const ch of charges.slice(0, 15)) {
    if (ch.status !== 'succeeded') continue;
    activity.push({
      type: 'charge',
      title: `${ch.brand || 'card'} ${ch.last4 || ''} · $${((ch.amount_cents||0)/100).toFixed(2)} ${(ch.currency||'usd').toUpperCase()} · ${ch.customer_email || ''}`,
      ts: ch.created_at,
      meta: 'charges'
    });
  }

  activity.sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0));
  const trimmedActivity = activity.slice(0, 60);

  return res.status(200).json({
    generated_at: new Date().toISOString(),
    kpis: {
      open_critical: openCritical,
      open_high: openHigh,
      open_medium: openMedium,
      open_security_total: openSecurity.length,
      overdue_invoice_count: overdueInvoices.length,
      overdue_invoice_amount_cents: overdueAmount,
      unpaid_invoice_count: unpaidInvoices.length,
      unread_submissions: unreadSubmissions,
      submissions_30d: totalSubmissions30d,
      mrr_cents: mrrCents,
      active_retainers: retainers.length,
      retainer_errors: retainerErrors,
      charges_30d_cents: charges30dTotal,
      assets_active: enrichedAssets.filter(a => a.active).length,
      asset_status: assetStatusTally
    },
    assets: enrichedAssets,
    activity: trimmedActivity
  });
};
