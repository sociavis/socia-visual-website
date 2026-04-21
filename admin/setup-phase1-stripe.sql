-- ═══ PHASE 1A: STRIPE MVP TABLES ═══
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/yjmyqmfvtudhkkxarttw/sql/new
--
-- What this creates:
--   1. webhook_events    — idempotency log for Stripe webhook deliveries
--   2. payment_intents   — mirror of Stripe PaymentIntent objects, keyed to invoices
--   3. charges           — successful charges with fee breakdown
--   4. invoices columns  — amount_cents, currency, paid_at, stripe_payment_intent_id
--
-- All service-role only (anon has zero access to payments data).
-- Idempotent: safe to re-run.

-- ───────── webhook_events (idempotency) ─────────
CREATE TABLE IF NOT EXISTS public.webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- No anon policies = anon denied.


-- ───────── payment_intents ─────────
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  invoice_id               TEXT REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount_cents             BIGINT NOT NULL,
  currency                 TEXT NOT NULL DEFAULT 'usd',
  status                   TEXT NOT NULL,
  payment_method_type      TEXT,
  last_error               TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_intents_invoice_id_idx ON public.payment_intents (invoice_id);

ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;


-- ───────── charges ─────────
CREATE TABLE IF NOT EXISTS public.charges (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_charge_id         TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  invoice_id               TEXT REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount_cents             BIGINT NOT NULL,
  fee_cents                BIGINT,
  net_cents                BIGINT,
  currency                 TEXT NOT NULL DEFAULT 'usd',
  status                   TEXT NOT NULL,
  payment_method_type      TEXT,
  receipt_url              TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS charges_invoice_id_idx ON public.charges (invoice_id);
CREATE INDEX IF NOT EXISTS charges_pi_idx ON public.charges (stripe_payment_intent_id);

ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;


-- ───────── invoices: payment columns ─────────
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS amount_cents              BIGINT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS currency                  TEXT DEFAULT 'usd';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_at                   TIMESTAMPTZ;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS stripe_payment_intent_id  TEXT;

CREATE INDEX IF NOT EXISTS invoices_stripe_pi_idx ON public.invoices (stripe_payment_intent_id);


-- ───────── VERIFICATION ─────────
-- After running, verify:
--   SELECT table_name FROM information_schema.tables
--     WHERE table_schema='public'
--       AND table_name IN ('webhook_events','payment_intents','charges');
-- Should return 3 rows.
--
--   SELECT column_name FROM information_schema.columns
--     WHERE table_schema='public' AND table_name='invoices'
--       AND column_name IN ('amount_cents','currency','paid_at','stripe_payment_intent_id');
-- Should return 4 rows.
