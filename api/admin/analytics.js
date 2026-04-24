const jwt = require('jsonwebtoken');
const { requireAdminSession } = require('../_lib/auth');

const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DATA_API = 'https://analyticsdata.googleapis.com/v1beta';

const cache = { data: null, expires: 0, token: null, tokenExpires: 0 };
const TTL_MS = 5 * 60 * 1000;

async function getAccessToken() {
  if (cache.token && Date.now() < cache.tokenExpires) return cache.token;
  const raw = process.env.GA4_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('GA4_SERVICE_ACCOUNT_KEY not set');
  const key = JSON.parse(raw);
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    { iss: key.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 },
    key.private_key,
    { algorithm: 'RS256' }
  );
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });
  if (!res.ok) throw new Error('Token exchange failed: ' + res.status + ' ' + await res.text());
  const json = await res.json();
  cache.token = json.access_token;
  cache.tokenExpires = Date.now() + (json.expires_in - 60) * 1000;
  return cache.token;
}

async function runReport(propertyId, body) {
  const token = await getAccessToken();
  const res = await fetch(`${DATA_API}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('GA4 report failed: ' + res.status + ' ' + await res.text());
  return res.json();
}

function rows(report, dimCount) {
  return (report.rows || []).map(r => ({
    dims: r.dimensionValues.slice(0, dimCount).map(v => v.value),
    metrics: r.metricValues.map(v => Number(v.value) || 0)
  }));
}

module.exports = async (req, res) => {
  if (!requireAdminSession(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId || !process.env.GA4_SERVICE_ACCOUNT_KEY) {
    return res.status(200).json({ configured: false });
  }

  if (cache.data && Date.now() < cache.expires) {
    return res.status(200).json(cache.data);
  }

  try {
    const range28 = { startDate: '28daysAgo', endDate: 'today' };
    const rangeToday = { startDate: 'today', endDate: 'today' };

    const [totals, byDay, topPages, topSources] = await Promise.all([
      runReport(propertyId, {
        dateRanges: [range28],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'engagementRate' }]
      }),
      runReport(propertyId, {
        dateRanges: [range28],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }]
      }),
      runReport(propertyId, {
        dateRanges: [range28],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 5
      }),
      runReport(propertyId, {
        dateRanges: [range28],
        dimensions: [{ name: 'sessionSource' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 5
      })
    ]);

    const t = (totals.rows && totals.rows[0]) ? totals.rows[0].metricValues.map(v => Number(v.value) || 0) : [0, 0, 0, 0];
    const data = {
      configured: true,
      range: '28d',
      totals: {
        activeUsers: t[0],
        sessions: t[1],
        pageViews: t[2],
        engagementRate: t[3]
      },
      byDay: rows(byDay, 1).map(r => ({ date: r.dims[0], users: r.metrics[0] })),
      topPages: rows(topPages, 1).map(r => ({ path: r.dims[0], views: r.metrics[0] })),
      topSources: rows(topSources, 1).map(r => ({ source: r.dims[0], sessions: r.metrics[0] })),
      cachedAt: new Date().toISOString()
    };

    cache.data = data;
    cache.expires = Date.now() + TTL_MS;
    return res.status(200).json(data);
  } catch (err) {
    console.error('admin/analytics error', err);
    return res.status(500).json({ error: 'Analytics fetch failed', detail: err.message });
  }
};
