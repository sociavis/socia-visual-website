-- ═══ PHASE 2C: ADD PERSONAL DOMAINS + CLEAN UP CLIENT ROSTER ═══
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/yjmyqmfvtudhkkxarttw/sql/new
--
-- Two changes:
--   1. Add 6 personal domains hosted at DreamHost (category='personal')
--   2. Deactivate KK + MX207 from active monitoring (still kickoff/concept phase, no SV-built site)
--
-- Idempotent — safe to re-run.

-- ───────── 1. Personal / side-project domains ─────────
INSERT INTO public.monitored_assets
  (slug, label, category, domain, https_url, host_provider, cms, notes, active)
VALUES
  ('hcb',  'Hardcore Barber',     'personal', 'hardcorebarber.com',   'https://hardcorebarber.com',   'dreamhost', NULL, 'Hosted at DreamHost.', true),
  ('jbt',  'Jumpball Training',   'personal', 'jumpballtraining.com', 'https://jumpballtraining.com', 'dreamhost', NULL, 'Hosted at DreamHost.', true),
  ('ncsk', 'Neon Casket',         'personal', 'neoncasket.com',       'https://neoncasket.com',       'dreamhost', NULL, 'Hosted at DreamHost.', true),
  ('pvc',  'Pivot Cinema',        'personal', 'pivotcinema.com',      'https://pivotcinema.com',      'dreamhost', NULL, 'Hosted at DreamHost.', true),
  ('ryt',  'Reynard Training',    'personal', 'reynardtraining.com',  'https://reynardtraining.com',  'dreamhost', NULL, 'Hosted at DreamHost.', true),
  ('rk',   'Ryan King',           'personal', 'ryanking.tv',          'https://ryanking.tv',          'dreamhost', NULL, 'Hosted at DreamHost.', true)
ON CONFLICT (slug) DO NOTHING;


-- ───────── 2. Deactivate clients without SV-built/maintained sites ─────────
-- KK is in kickoff phase, MX207 is in concept phase — neither has a SV web property to monitor.
-- Their rows stay (so we don't lose findings history) but go inactive so the sweep skips them.

UPDATE public.monitored_assets
   SET active = false,
       notes = COALESCE(notes, '') || ' [Deactivated 2026-05-01: no SV-built/maintained site yet]',
       updated_at = now()
 WHERE slug IN ('kk', 'mx207') AND active = true;


-- ───────── VERIFICATION ─────────
-- SELECT category, count(*) FROM public.monitored_assets WHERE active GROUP BY category ORDER BY category;
-- SELECT slug, label, category, domain, active FROM public.monitored_assets ORDER BY active DESC, category, label;
