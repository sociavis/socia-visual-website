-- ═══ PHASE 2: SECURITY MONITORING ═══
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/yjmyqmfvtudhkkxarttw/sql/new
--
-- What this creates:
--   1. monitored_assets   — the inventory of domains/sites/APIs the sweep covers
--   2. security_events    — findings written by the nightly sweep cron
--
-- All service-role only (anon zero access). Idempotent — safe to re-run.

-- ───────── monitored_assets ─────────
CREATE TABLE IF NOT EXISTS public.monitored_assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,        -- 'sv', 'tcs', 'dme', etc.
  label           TEXT NOT NULL,               -- 'Socia Visual'
  category        TEXT NOT NULL DEFAULT 'client', -- 'crown-jewel' | 'studio' | 'client' | 'product'
  domain          TEXT NOT NULL,               -- 'sociavisual.com'
  https_url       TEXT NOT NULL,               -- 'https://sociavisual.com'
  host_provider   TEXT,                        -- 'vercel' | 'hostinger' | 'site5' | 'wordpress.com' | 'other'
  cms             TEXT,                        -- 'wordpress' | 'static' | 'ecwid' | 'custom'
  notes           TEXT,
  active          BOOLEAN NOT NULL DEFAULT true,
  last_swept_at   TIMESTAMPTZ,
  last_status     TEXT,                        -- 'green' | 'yellow' | 'red'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS monitored_assets_active_idx ON public.monitored_assets (active) WHERE active = true;
CREATE INDEX IF NOT EXISTS monitored_assets_category_idx ON public.monitored_assets (category);

ALTER TABLE public.monitored_assets ENABLE ROW LEVEL SECURITY;


-- ───────── security_events ─────────
CREATE TABLE IF NOT EXISTS public.security_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id      UUID REFERENCES public.monitored_assets(id) ON DELETE CASCADE,
  source        TEXT NOT NULL,            -- 'sweep:ssl' | 'sweep:headers' | 'sweep:dns' | 'sweep:uptime' | 'sweep:exposure' | 'sweep:wordpress' | 'webhook:*'
  check_key     TEXT NOT NULL,            -- 'cert_expiring' | 'csp' | 'spf_missing' | etc.
  severity      TEXT NOT NULL,            -- 'info' | 'low' | 'medium' | 'high' | 'critical'
  status        TEXT NOT NULL DEFAULT 'open', -- 'open' | 'resolved' | 'ignored'
  title         TEXT NOT NULL,
  detail        JSONB NOT NULL DEFAULT '{}'::jsonb,
  fingerprint   TEXT NOT NULL,            -- sha1(asset_id + check_key); used for dedup + auto-resolve
  detected_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ,
  triage_note   TEXT
);

-- Only one OPEN event per (asset, fingerprint). Resolved/ignored rows are not constrained
-- so we keep history.
CREATE UNIQUE INDEX IF NOT EXISTS security_events_open_unique
  ON public.security_events (asset_id, fingerprint)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS security_events_asset_idx     ON public.security_events (asset_id, status, severity);
CREATE INDEX IF NOT EXISTS security_events_recent_idx    ON public.security_events (detected_at DESC);
CREATE INDEX IF NOT EXISTS security_events_severity_idx  ON public.security_events (severity, status);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;


-- ───────── seed: Socia Visual studio (the crown jewel) ─────────
-- Idempotent: only inserts if the slug doesn't already exist.
INSERT INTO public.monitored_assets (slug, label, category, domain, https_url, host_provider, cms, notes)
VALUES
  ('sv',     'Socia Visual',           'crown-jewel', 'sociavisual.com',         'https://sociavisual.com',         'vercel',     'custom', 'Studio site + admin + Stripe + Supabase. Highest priority.'),
  ('sv-www', 'Socia Visual (www)',     'crown-jewel', 'www.sociavisual.com',     'https://www.sociavisual.com',     'vercel',     'custom', 'Apex redirect target — verify HSTS preload + redirect chain.')
ON CONFLICT (slug) DO NOTHING;


-- ───────── VERIFICATION ─────────
-- SELECT slug, label, category, domain, active FROM public.monitored_assets ORDER BY category, label;
-- SELECT count(*) FROM public.security_events;
