-- ═══ PHASE 2B: SEED CLIENT ROSTER FOR SECURITY MONITORING ═══
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/yjmyqmfvtudhkkxarttw/sql/new
--
-- Adds the rest of Scott's active client sites to monitored_assets so the
-- nightly security sweep covers the whole studio surface, not just sociavisual.com.
--
-- Idempotent — ON CONFLICT (slug) DO NOTHING. Safe to re-run.
-- Seeded based on DNS probes + git/Vercel ownership confirmation on 2026-05-01.
-- Ones marked active=false either lack a confirmed live domain or are off-scope
-- for monitoring (e.g., sponsorship-deck-only clients with no web property yet).

INSERT INTO public.monitored_assets
  (slug, label, category, domain, https_url, host_provider, cms, notes, active)
VALUES
  -- ── Vercel-hosted client builds (Scott's own deploys) ──
  ('hor',  'Haus of Revival',                  'client', 'hausofrevival.com',          'https://hausofrevival.com',          'vercel',     'static',    'Print-on-demand brand. Vercel project, redirects from www.', true),
  ('pzax', 'Partzilla Arenacross',             'client', 'partzillaarenacross.com',    'https://partzillaarenacross.com',    'vercel',     'static',    'AX series 2026-27. Bobby Snyder @ TriStarMX. Vercel.', true),
  ('vat',  'Victory Advanced Technologies',    'client', 'victoryadvancedtech.com',    'https://victoryadvancedtech.com',    'vercel',     'custom',    'Industrial manufacturing. Hand-coded HTML + Vercel serverless. Jetwerx partnership.', true),

  -- ── WordPress / hosted CMS ──
  ('dme',  'DME Academy',                      'client', 'dme-academy.com',            'https://dme-academy.com',            'other',      'wordpress', 'WordPress, monthly $65/hr maintenance. Greg Birgfeld + Austin Fetzer.', true),
  ('slr',  'SLR Honda',                        'client', 'slrhonda.com',               'https://slrhonda.com',               'hostinger',  'wordpress', 'Honda dealer / powersports. WordPress on Hostinger. Mark Samuels.', true),
  ('azh',  'Arizona Hardscapes',               'client', 'arizonahardscapes.com',      'https://arizonahardscapes.com',      'other',      'wordpress', 'Hardscaping AZ. WordPress.', true),

  -- ── Other live client sites ──
  ('tcs',  'Triple Crown Series',              'client', 'tcs2026.com',                'https://tcs2026.com',                'site5',      'custom',    '2026 racing series. Site5 + Vercel split deploy. Round 1 = June 7, 2026.', true),
  ('tfx',  'The Fittest Experience',           'client', 'thefittestexperience.com',   'https://thefittestexperience.com',   'other',      'custom',    'CrossFit competition. Cloudflare in front. Paying client of Gridline Leads.', true),
  ('kk',   'KefiKanna',                        'client', 'kefikanna.com',              'https://kefikanna.com',              'other',      'custom',    'Web/graphic/motion. Bobby Gibbs + Peter Wakem Jr. Cloudflare.', true),
  ('mx207','MX207',                            'client', 'mx207.com',                  'https://mx207.com',                  'squarespace','custom',    'Maine motocross brand (area 207). Danny Stuart. Squarespace.', true),

  -- ── Scott's own products ──
  ('gl',   'Gridline Leads',                   'product', 'gridlineleads.com',         'https://gridlineleads.com',          'hostinger',  'custom',    'Scott''s lead-gen product. TFX is paying client.', true),

  -- ── Inactive / placeholder rows (no confirmed live domain — Scott to confirm) ──
  ('ll',   'Little Legends',                   'client', 'littlelegends.tbd',          'https://littlelegends.tbd',          NULL,         NULL,        'TODO: confirm domain. Danny Stuart. Youth motorsport. Marked inactive until verified.', false),
  ('hte',  'Honor The Earth',                  'client', 'honortheearth.tbd',          'https://honortheearth.tbd',          NULL,         NULL,        'TODO: confirm domain. May be inactive engagement.', false),
  ('vmx',  'Veterans MX Championship',         'client', 'veteransmx.tbd',             'https://veteransmx.tbd',             NULL,         NULL,        'TODO: no live web property — sponsorship deck only.', false),
  ('cm',   'Crockett Myers',                   'client', 'crockettmyers.tbd',          'https://crockettmyers.tbd',          NULL,         NULL,        'TODO: sponsorship deck delivered. No web project yet.', false)
ON CONFLICT (slug) DO NOTHING;


-- ───────── VERIFICATION ─────────
-- SELECT slug, label, category, domain, host_provider, cms, active
--   FROM public.monitored_assets
--   ORDER BY active DESC, category, label;
