-- ═══ PHASE 2D: ASSET TYPES (websites vs decks) ═══
-- Adds asset_type column so the dashboard can group/filter by what KIND of thing it is,
-- separate from who owns it (category).
--
-- Idempotent — safe to re-run.

-- ───────── 1. Schema change ─────────
ALTER TABLE public.monitored_assets
  ADD COLUMN IF NOT EXISTS asset_type TEXT NOT NULL DEFAULT 'website';
-- Allowed values: 'website' | 'deck' | 'app' | 'portal' (free-form for now, no CHECK constraint
-- so the admin UI can introduce new types without a migration).

CREATE INDEX IF NOT EXISTS monitored_assets_type_idx ON public.monitored_assets (asset_type);


-- ───────── 2. Register the PZAX hosted deck ─────────
INSERT INTO public.monitored_assets
  (slug, label, category, asset_type, domain, https_url, host_provider, cms, notes, active)
VALUES
  ('pzax-deck', 'PZAX Sponsorship Deck', 'client', 'deck',
   'deck.partzillaarenacross.com', 'https://deck.partzillaarenacross.com',
   'vercel', 'static', 'Hosted sponsorship deck for Partzilla Arenacross.', true)
ON CONFLICT (slug) DO NOTHING;


-- ───────── VERIFICATION ─────────
-- SELECT category, asset_type, count(*) FROM public.monitored_assets WHERE active GROUP BY 1, 2 ORDER BY 1, 2;
