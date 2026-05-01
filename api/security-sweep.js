// Security sweep — invoked by Vercel Cron nightly OR by an authenticated admin.
// Auth: Bearer CRON_SECRET (cron) OR sv_admin_session cookie (manual trigger from the admin UI).

const { getServiceRoleClient, readAdminSession } = require('./_lib/auth');
const {
  fingerprint,
  checkTlsCert,
  fetchUrl,
  gradeHeaders,
  checkDnsPosture,
  gradeDnsPosture,
  checkExposedPaths,
  checkWordPress,
  checkRedirectChain
} = require('./_lib/security-checks');

const SEVERITY_RANK = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };

module.exports = async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  const isCron = !!cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isAdmin = !!readAdminSession(req);
  if (!isCron && !isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sb = getServiceRoleClient();
  const slugFilter = req.query?.slug || null;
  const dryRun = req.query?.dry === '1';

  let assetQuery = sb.from('monitored_assets').select('*').eq('active', true);
  if (slugFilter) assetQuery = assetQuery.eq('slug', slugFilter);
  const { data: assets, error: assetsErr } = await assetQuery;
  if (assetsErr) return res.status(500).json({ error: assetsErr.message });

  const summary = [];
  for (const asset of assets || []) {
    try {
      const findings = await sweepAsset(asset);
      if (!dryRun) await reconcileFindings(sb, asset.id, findings);
      const status = computeStatus(findings);
      if (!dryRun) {
        await sb.from('monitored_assets').update({
          last_swept_at: new Date().toISOString(),
          last_status: status,
          updated_at: new Date().toISOString()
        }).eq('id', asset.id);
      }
      summary.push({
        slug: asset.slug,
        label: asset.label,
        status,
        finding_count: findings.length,
        findings: dryRun ? findings : undefined
      });
    } catch (err) {
      console.error(`security-sweep: ${asset.slug} failed`, err);
      summary.push({ slug: asset.slug, error: err.message || String(err) });
    }
  }

  return res.status(200).json({
    swept_at: new Date().toISOString(),
    swept: summary.length,
    dry_run: dryRun,
    assets: summary
  });
};

async function sweepAsset(asset) {
  const findings = [];
  const url = asset.https_url;
  const host = asset.domain;

  // 1) TLS cert
  const cert = await checkTlsCert(host);
  if (!cert.ok && cert.error) {
    findings.push({ source: 'sweep:ssl', check_key: 'tls_unreachable', severity: 'critical', title: `TLS handshake failed: ${cert.error}`, detail: cert });
  } else if (!cert.ok && cert.auth_error) {
    findings.push({ source: 'sweep:ssl', check_key: 'tls_invalid', severity: 'critical', title: `Certificate not trusted: ${cert.auth_error}`, detail: cert });
  } else if (typeof cert.days_left === 'number') {
    if (cert.days_left < 0) {
      findings.push({ source: 'sweep:ssl', check_key: 'cert_expired', severity: 'critical', title: `Certificate expired ${-cert.days_left} day(s) ago`, detail: cert });
    } else if (cert.days_left <= 14) {
      findings.push({ source: 'sweep:ssl', check_key: 'cert_expiring', severity: 'high', title: `Certificate expires in ${cert.days_left} day(s)`, detail: cert });
    } else if (cert.days_left <= 30) {
      findings.push({ source: 'sweep:ssl', check_key: 'cert_expiring_soon', severity: 'medium', title: `Certificate expires in ${cert.days_left} day(s)`, detail: cert });
    }
  }

  // 2) HTTP fetch — uptime, status, headers
  const fetched = await fetchUrl(url);
  if (!fetched.ok) {
    findings.push({ source: 'sweep:uptime', check_key: 'http_unreachable', severity: 'high', title: `Site unreachable: ${fetched.error}`, detail: fetched });
  } else {
    if (fetched.status >= 500) {
      findings.push({ source: 'sweep:uptime', check_key: 'http_5xx', severity: 'high', title: `Site returning HTTP ${fetched.status}`, detail: { status: fetched.status, final_url: fetched.final_url } });
    } else if (fetched.status >= 400) {
      findings.push({ source: 'sweep:uptime', check_key: 'http_4xx', severity: 'medium', title: `Site returning HTTP ${fetched.status}`, detail: { status: fetched.status, final_url: fetched.final_url } });
    }
    if (fetched.duration_ms > 5000) {
      findings.push({ source: 'sweep:uptime', check_key: 'slow_response', severity: 'low', title: `Slow response: ${fetched.duration_ms}ms`, detail: { duration_ms: fetched.duration_ms } });
    }

    const headerFindings = gradeHeaders(fetched.headers);
    headerFindings.forEach(f => findings.push({ source: 'sweep:headers', ...f }));

    const redirectFindings = await checkRedirectChain(url);
    redirectFindings.forEach(f => findings.push({ source: 'sweep:headers', ...f }));
  }

  // 3) DNS posture
  const dnsRes = await checkDnsPosture(host);
  const dnsFindings = gradeDnsPosture(dnsRes);
  dnsFindings.forEach(f => findings.push({ source: 'sweep:dns', ...f }));

  // 4) Exposed paths (only for sites that responded)
  if (fetched.ok && fetched.status < 500) {
    const exposed = await checkExposedPaths(url);
    for (const e of exposed) {
      findings.push({
        source: 'sweep:exposure',
        check_key: `exposed${e.path.replace(/[^a-z0-9]/gi, '_')}`,
        severity: 'critical',
        title: `Sensitive file exposed: ${e.path}`,
        detail: e
      });
    }
  }

  // 5) WordPress checks (DME, AZH, SLR, etc.)
  if (asset.cms === 'wordpress' && fetched.ok) {
    const wpFindings = await checkWordPress(url);
    wpFindings.forEach(f => findings.push({ source: 'sweep:wordpress', ...f }));
  }

  return findings;
}

async function reconcileFindings(sb, assetId, findings) {
  const { data: existing, error } = await sb
    .from('security_events')
    .select('id, fingerprint, severity, title')
    .eq('asset_id', assetId)
    .eq('status', 'open');
  if (error) throw new Error(`reconcile: ${error.message}`);

  const existingMap = new Map((existing || []).map(e => [e.fingerprint, e]));
  const seen = new Set();

  for (const f of findings) {
    const fp = fingerprint(assetId, f.check_key);
    seen.add(fp);
    const prior = existingMap.get(fp);
    if (prior) {
      // Already open. Update severity/title/detail in case it shifted (e.g., expiry days ticking down).
      if (prior.severity !== f.severity || prior.title !== f.title) {
        await sb.from('security_events').update({
          severity: f.severity,
          title: f.title,
          detail: f.detail || {},
          source: f.source
        }).eq('id', prior.id);
      }
      continue;
    }
    const { error: insErr } = await sb.from('security_events').insert({
      asset_id: assetId,
      source: f.source,
      check_key: f.check_key,
      severity: f.severity,
      status: 'open',
      title: f.title,
      detail: f.detail || {},
      fingerprint: fp
    });
    if (insErr) console.error(`security_events insert failed for ${f.check_key}:`, insErr.message);
  }

  // Auto-resolve open events whose check passed this sweep.
  for (const [fp, ev] of existingMap) {
    if (!seen.has(fp)) {
      await sb.from('security_events').update({
        status: 'resolved',
        resolved_at: new Date().toISOString()
      }).eq('id', ev.id);
    }
  }
}

function computeStatus(findings) {
  let max = -1;
  for (const f of findings) {
    const r = SEVERITY_RANK[f.severity] ?? 0;
    if (r > max) max = r;
  }
  if (max >= SEVERITY_RANK.high) return 'red';
  if (max >= SEVERITY_RANK.medium) return 'yellow';
  return 'green';
}
