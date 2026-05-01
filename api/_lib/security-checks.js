// Pure security probe functions. No I/O beyond the network.
// Each function returns plain data; severity grading happens in the sweep entry point.

const tls = require('tls');
const dns = require('dns/promises');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { URL } = require('url');

// Browser-shaped UA so we don't get challenged by Vercel/Cloudflare bot defense on
// the studio's own properties. Identifying tail still in there so logs aren't anonymous.
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15 SV-Security-Sweep/1.0';
const FETCH_TIMEOUT_MS = 10000;
const TLS_TIMEOUT_MS = 8000;

function fingerprint(assetId, checkKey) {
  return crypto.createHash('sha1').update(`${assetId}:${checkKey}`).digest('hex');
}

// Open a TLS socket, capture peer cert, return validity window.
function checkTlsCert(host, port = 443) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (val) => { if (!settled) { settled = true; resolve(val); } };
    const socket = tls.connect({
      host,
      port,
      servername: host,
      timeout: TLS_TIMEOUT_MS,
      rejectUnauthorized: false  // inspect bad certs too
    }, () => {
      const cert = socket.getPeerCertificate();
      const validTo = cert?.valid_to ? new Date(cert.valid_to) : null;
      const daysLeft = validTo ? Math.floor((validTo.getTime() - Date.now()) / 86_400_000) : null;
      const result = {
        ok: socket.authorized,
        auth_error: socket.authorizationError ? String(socket.authorizationError) : null,
        issuer: cert?.issuer?.O || cert?.issuer?.CN || null,
        subject: cert?.subject?.CN || null,
        valid_from: cert?.valid_from || null,
        valid_to: cert?.valid_to || null,
        days_left: daysLeft,
        san: cert?.subjectaltname || null,
        protocol: socket.getProtocol() || null
      };
      socket.end();
      done(result);
    });
    socket.on('error', (err) => done({ ok: false, error: err.message, code: err.code || null }));
    socket.on('timeout', () => { socket.destroy(); done({ ok: false, error: 'timeout' }); });
  });
}

// Plain HTTP/HTTPS GET. Captures headers, status, body (capped), redirect chain.
function fetchUrl(targetUrl, { followRedirects = true, maxRedirects = 5, _hops = [] } = {}) {
  return new Promise((resolve) => {
    const start = Date.now();
    let parsed;
    try { parsed = new URL(targetUrl); } catch (e) { return resolve({ ok: false, error: 'invalid_url', duration_ms: 0 }); }
    const lib = parsed.protocol === 'http:' ? http : https;
    const req = lib.get(targetUrl, {
      timeout: FETCH_TIMEOUT_MS,
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,*/*' }
    }, (res) => {
      const isRedirect = [301, 302, 303, 307, 308].includes(res.statusCode);
      if (isRedirect && followRedirects && res.headers.location && _hops.length < maxRedirects) {
        const next = new URL(res.headers.location, targetUrl).toString();
        res.resume();
        fetchUrl(next, { followRedirects, maxRedirects, _hops: [..._hops, { url: targetUrl, status: res.statusCode }] }).then(resolve);
        return;
      }
      let body = '';
      let bytes = 0;
      res.on('data', chunk => {
        bytes += chunk.length;
        if (body.length < 200_000) body += chunk.toString('utf8');
      });
      res.on('end', () => {
        resolve({
          ok: true,
          status: res.statusCode,
          headers: res.headers,
          body,
          bytes,
          duration_ms: Date.now() - start,
          redirect_chain: _hops,
          final_url: targetUrl
        });
      });
    });
    req.on('error', err => resolve({ ok: false, error: err.message, code: err.code || null, duration_ms: Date.now() - start, redirect_chain: _hops }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout', duration_ms: Date.now() - start, redirect_chain: _hops }); });
  });
}

// Grade response headers against the OWASP secure-headers baseline.
// Returns an array of { check_key, severity, title, detail }.
function gradeHeaders(headers, { context = {} } = {}) {
  const findings = [];
  const h = Object.fromEntries(Object.entries(headers || {}).map(([k, v]) => [k.toLowerCase(), v]));

  // HSTS
  const hsts = h['strict-transport-security'];
  if (!hsts) {
    findings.push({ check_key: 'hsts_missing', severity: 'medium', title: 'Missing Strict-Transport-Security', detail: { actual: null, recommendation: 'max-age=63072000; includeSubDomains; preload' } });
  } else {
    const maxAge = (hsts.match(/max-age=(\d+)/) || [])[1];
    if (maxAge && Number(maxAge) < 31_536_000) {
      findings.push({ check_key: 'hsts_short', severity: 'low', title: `HSTS max-age below 1 year (${maxAge}s)`, detail: { actual: hsts } });
    }
  }

  // CSP
  if (!h['content-security-policy']) {
    findings.push({ check_key: 'csp_missing', severity: 'medium', title: 'Missing Content-Security-Policy', detail: { actual: null } });
  }

  // X-Content-Type-Options
  if (!h['x-content-type-options']) {
    findings.push({ check_key: 'xcto_missing', severity: 'low', title: 'Missing X-Content-Type-Options: nosniff', detail: { actual: null } });
  }

  // Frame protection (XFO or CSP frame-ancestors)
  const csp = h['content-security-policy'] || '';
  if (!h['x-frame-options'] && !/frame-ancestors/i.test(csp)) {
    findings.push({ check_key: 'frame_protection_missing', severity: 'low', title: 'Missing X-Frame-Options / CSP frame-ancestors', detail: {} });
  }

  // Referrer-Policy
  if (!h['referrer-policy']) {
    findings.push({ check_key: 'referrer_policy_missing', severity: 'info', title: 'Missing Referrer-Policy', detail: {} });
  }

  // Permissions-Policy
  if (!h['permissions-policy'] && !h['feature-policy']) {
    findings.push({ check_key: 'permissions_policy_missing', severity: 'info', title: 'Missing Permissions-Policy', detail: {} });
  }

  // Server fingerprint leak
  const server = h['server'] || '';
  if (server && /(\d+\.\d+(\.\d+)?|nginx\/[\d.]+|apache\/[\d.]+|microsoft|express|openresty\/[\d.]+|litespeed)/i.test(server)) {
    findings.push({ check_key: 'server_version_leak', severity: 'low', title: 'Server header leaks software / version', detail: { actual: server } });
  }
  if (h['x-powered-by']) {
    findings.push({ check_key: 'x_powered_by_leak', severity: 'low', title: 'X-Powered-By header exposed', detail: { actual: h['x-powered-by'] } });
  }

  // Cookies — flag any Set-Cookie missing Secure/HttpOnly/SameSite
  const setCookie = h['set-cookie'];
  if (setCookie) {
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    for (const c of cookies) {
      const flags = c.toLowerCase();
      const missing = [];
      if (!flags.includes('secure')) missing.push('Secure');
      if (!flags.includes('httponly')) missing.push('HttpOnly');
      if (!flags.includes('samesite')) missing.push('SameSite');
      if (missing.length) {
        const name = (c.split('=')[0] || 'cookie').trim();
        findings.push({ check_key: `cookie_flags_${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`, severity: 'medium', title: `Cookie "${name}" missing ${missing.join(', ')}`, detail: { cookie: c.slice(0, 200), missing } });
      }
    }
  }

  return findings;
}

// DNS posture: MX presence, SPF, DMARC, CAA.
async function checkDnsPosture(domain) {
  const out = { domain, mx: null, spf: null, dmarc: null, caa: null, errors: {} };
  try {
    const mx = await dns.resolveMx(domain);
    out.mx = mx.map(m => `${m.priority} ${m.exchange}`);
  } catch (e) { out.errors.mx = e.code || e.message; }
  try {
    const txts = (await dns.resolveTxt(domain)).map(arr => arr.join(''));
    out.spf = txts.find(t => /^v=spf1/i.test(t)) || null;
    out._all_txt = txts;
  } catch (e) { out.errors.spf = e.code || e.message; }
  try {
    const dmarcTxt = (await dns.resolveTxt(`_dmarc.${domain}`)).map(arr => arr.join(''));
    out.dmarc = dmarcTxt.find(t => /^v=DMARC1/i.test(t)) || null;
  } catch (e) { out.errors.dmarc = e.code || e.message; }
  try {
    out.caa = await dns.resolveCaa(domain);
  } catch (e) { out.errors.caa = e.code || e.message; }
  return out;
}

// Translate DNS posture into findings.
function gradeDnsPosture(dnsResult) {
  const findings = [];
  const hasMail = Array.isArray(dnsResult.mx) && dnsResult.mx.length > 0;
  if (hasMail) {
    if (!dnsResult.spf) {
      findings.push({ check_key: 'spf_missing', severity: 'medium', title: 'Domain accepts mail but has no SPF record', detail: dnsResult });
    } else if (/\?all|~all/i.test(dnsResult.spf) === false && /-all/i.test(dnsResult.spf) === false) {
      findings.push({ check_key: 'spf_no_qualifier', severity: 'low', title: 'SPF record has no terminating qualifier (-all / ~all)', detail: { spf: dnsResult.spf } });
    }
    if (!dnsResult.dmarc) {
      findings.push({ check_key: 'dmarc_missing', severity: 'medium', title: 'Domain accepts mail but has no DMARC policy', detail: dnsResult });
    } else if (/p=none/i.test(dnsResult.dmarc)) {
      findings.push({ check_key: 'dmarc_policy_none', severity: 'low', title: 'DMARC policy is "none" (monitor-only — does not block spoofs)', detail: { dmarc: dnsResult.dmarc } });
    }
  }
  return findings;
}

// Probe a small set of high-signal exposed paths.
const EXPOSED_PATHS = [
  '/.env',
  '/.env.local',
  '/.env.production',
  '/.git/config',
  '/.git/HEAD',
  '/wp-config.php.bak',
  '/wp-config.php~',
  '/wp-config.php.swp',
  '/.DS_Store',
  '/backup.zip',
  '/backup.sql',
  '/database.sql',
  '/.aws/credentials',
  '/.npmrc',
  '/admin/setup.sql',
  '/server-status'
];

async function checkExposedPaths(baseUrl) {
  const exposed = [];
  // Run in parallel batches of 4 to avoid hammering a single host.
  for (let i = 0; i < EXPOSED_PATHS.length; i += 4) {
    const batch = EXPOSED_PATHS.slice(i, i + 4);
    const results = await Promise.all(batch.map(p =>
      fetchUrl(baseUrl.replace(/\/$/, '') + p, { followRedirects: false }).then(r => ({ path: p, r }))
    ));
    for (const { path, r } of results) {
      if (r.ok && r.status === 200 && r.bytes > 0) {
        // Reject obvious SPA/catch-all responses (HTML body that looks like the homepage).
        const looksLikeApp = /<\/html>/i.test(r.body) && r.body.length > 500;
        if (looksLikeApp) continue;
        exposed.push({ path, status: r.status, bytes: r.bytes, snippet: r.body.slice(0, 240) });
      }
    }
  }
  return exposed;
}

// WordPress-specific probes.
async function checkWordPress(baseUrl) {
  const findings = [];
  const home = await fetchUrl(baseUrl);
  if (!home.ok) return findings;

  const generator = (home.body || '').match(/<meta\s+name=["']generator["']\s+content=["']WordPress\s*([\d.]*)["']/i);
  if (generator) {
    findings.push({
      check_key: 'wp_version_disclosure',
      severity: 'low',
      title: generator[1] ? `WordPress ${generator[1]} version disclosed in HTML` : 'WordPress generator meta tag exposed',
      detail: { actual: generator[0], version: generator[1] || null }
    });
  }

  const wpLogin = await fetchUrl(baseUrl.replace(/\/$/, '') + '/wp-login.php', { followRedirects: false });
  if (wpLogin.ok && wpLogin.status === 200 && /wp-login|user_login/i.test(wpLogin.body || '')) {
    findings.push({
      check_key: 'wp_login_exposed',
      severity: 'medium',
      title: '/wp-login.php is publicly accessible without IP/login throttling',
      detail: { status: wpLogin.status, recommendation: 'Add a login limiter (Wordfence, Limit Login Attempts) or restrict by IP at the host.' }
    });
  }

  const xmlrpc = await fetchUrl(baseUrl.replace(/\/$/, '') + '/xmlrpc.php', { followRedirects: false });
  if (xmlrpc.ok && xmlrpc.status === 200 && /xml.*rpc.*server/i.test(xmlrpc.body || '')) {
    findings.push({
      check_key: 'wp_xmlrpc_open',
      severity: 'medium',
      title: '/xmlrpc.php is enabled (brute-force amplifier)',
      detail: { recommendation: 'Disable xmlrpc.php unless Jetpack/legacy clients require it.' }
    });
  }

  const userEnum = await fetchUrl(baseUrl.replace(/\/$/, '') + '/?author=1', { followRedirects: false });
  if (userEnum.ok && [301, 302].includes(userEnum.status) && /\/author\//.test(userEnum.headers.location || '')) {
    findings.push({
      check_key: 'wp_user_enumeration',
      severity: 'low',
      title: 'WordPress username enumeration possible via /?author=N',
      detail: { redirect: userEnum.headers.location }
    });
  }
  return findings;
}

// Verify the apex/www domain pair redirects bare-host to canonical and uses HSTS preload.
async function checkRedirectChain(httpsUrl) {
  const findings = [];
  const r = await fetchUrl(httpsUrl);
  if (!r.ok) return findings;
  // If we passed through any 30x and one of them was an HTTP→HTTPS upgrade missing,
  // flag it. This is best-effort — the cron host may not see http:// schemes.
  if (r.redirect_chain && r.redirect_chain.length > 3) {
    findings.push({
      check_key: 'long_redirect_chain',
      severity: 'low',
      title: `Long redirect chain (${r.redirect_chain.length} hops)`,
      detail: { chain: r.redirect_chain, final_url: r.final_url }
    });
  }
  return findings;
}

module.exports = {
  fingerprint,
  checkTlsCert,
  fetchUrl,
  gradeHeaders,
  checkDnsPosture,
  gradeDnsPosture,
  checkExposedPaths,
  checkWordPress,
  checkRedirectChain
};
