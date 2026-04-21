-- ═══ PHASE 1B: CUSTOMERS + PAYMENT METHODS + RETAINER SCHEDULES ═══
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/yjmyqmfvtudhkkxarttw/sql/new
--
-- What this creates:
--   1. stripe_customers     — mirror of Stripe Customer objects, keyed by email
--   2. payment_methods      — saved payment methods attached to customers (for retainer auto-charge)
--   3. retainer_schedules   — recurring billing config (amount, day of month, next_charge_date)
--
-- All service-role only (anon has zero access).
-- Idempotent: safe to re-run.

-- ───────── stripe_customers ─────────
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id          TEXT UNIQUE NOT NULL,
  client_email                TEXT NOT NULL,
  company_name                TEXT,
  client_name                 TEXT,
  default_payment_method_id   TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stripe_customers_email_idx ON public.stripe_customers (lower(client_email));

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;


-- ───────── payment_methods ─────────
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  stripe_customer_id       TEXT NOT NULL,
  type                     TEXT NOT NULL,
  brand                    TEXT,
  last4                    TEXT,
  exp_month                INT,
  exp_year                 INT,
  bank_name                TEXT,
  is_default               BOOLEAN NOT NULL DEFAULT false,
  detached_at              TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_methods_customer_idx ON public.payment_methods (stripe_customer_id);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;


-- ───────── retainer_schedules ─────────
CREATE TABLE IF NOT EXISTS public.retainer_schedules (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_email             TEXT NOT NULL,
  company_name             TEXT,
  client_name              TEXT,
  amount_cents             BIGINT NOT NULL,
  currency                 TEXT NOT NULL DEFAULT 'usd',
  description              TEXT NOT NULL,
  day_of_month             INT NOT NULL CHECK (day_of_month BETWEEN 1 AND 28),
  stripe_customer_id       TEXT,
  stripe_payment_method_id TEXT,
  active                   BOOLEAN NOT NULL DEFAULT true,
  next_charge_date         DATE NOT NULL,
  last_invoice_id          TEXT,
  last_charge_at           TIMESTAMPTZ,
  last_error               TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS retainer_schedules_next_idx ON public.retainer_schedules (next_charge_date) WHERE active = true;
CREATE INDEX IF NOT EXISTS retainer_schedules_email_idx ON public.retainer_schedules (lower(client_email));

ALTER TABLE public.retainer_schedules ENABLE ROW LEVEL SECURITY;


-- ───────── VERIFICATION ─────────
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema='public'
--     AND table_name IN ('stripe_customers','payment_methods','retainer_schedules');
-- Should return 3 rows.
