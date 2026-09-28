// Mid-market FX rate, proxied same-origin.
//
// The admin shows a USD equivalent beside non-USD invoice totals. Calling a rate
// provider straight from the page is blocked by the site's CSP, which pins
// connect-src to 'self'. Widening that for every page to serve one admin readout
// is the wrong trade, so the lookup happens here instead and the CSP stays shut.
//
// Reference only: nothing here is stored or billed, so a miss degrades to the
// admin saying the equivalent is unavailable.
const ALLOWED = new Set(['usd', 'cad', 'eur', 'gbp', 'aud']);

const SOURCES = [
  {
    name: 'frankfurter',
    url: (from) => `https://api.frankfurter.dev/v1/latest?base=${from}&symbols=USD`,
    pick: (d) => ({ rate: d && d.rates && d.rates.USD, date: d && d.date })
  },
  {
    name: 'er-api',
    url: (from) => `https://open.er-api.com/v6/latest/${from}`,
    pick: (d) => ({ rate: d && d.rates && d.rates.USD, date: null })
  }
];

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const from = String((req.query && req.query.from) || '').toLowerCase();
  if (!ALLOWED.has(from)) return res.status(400).json({ error: 'Unsupported currency' });
  if (from === 'usd') {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).json({ from: 'usd', to: 'usd', rate: 1, date: null, source: 'identity' });
  }

  for (const src of SOURCES) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const r = await fetch(src.url(from.toUpperCase()), { signal: ctrl.signal });
      clearTimeout(timer);
      if (!r.ok) continue;
      const { rate, date } = src.pick(await r.json());
      if (typeof rate !== 'number' || !isFinite(rate) || rate <= 0) continue;
      // An hour is plenty: this is a sanity figure next to a total, not a booking rate.
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
      return res.status(200).json({ from, to: 'usd', rate, date, source: src.name });
    } catch (err) {
      // try the next source
    }
  }

  return res.status(502).json({ error: 'No rate available' });
};
