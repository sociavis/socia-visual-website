-- ═══ PHASE 0: RLS HARDENING ═══
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor
--
-- What this does:
--   1. invoices: deny anon INSERT/UPDATE/DELETE (keeps anon SELECT so portal + invoice.html still work)
--   2. admin_settings: deny anon ALL access (admin password no longer leaks via anon key)
--   3. service_role retains full access on both (used by /api/admin/* + /api/get-invoice)
--
-- What this closes:
--   - Public paid/unpaid toggle on invoice.html (anon can't UPDATE invoices anymore)
--   - Admin password exposure (anon can't SELECT admin_settings anymore)
--
-- What this does NOT close (deferred to Phase 0.5):
--   - Anon read-scraping of invoices (still allowed; needed until portal reads move server-side)
--
-- Idempotent: safe to re-run.

-- ───────── INVOICES ─────────
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Drop any prior permissive policies on invoices
DROP POLICY IF EXISTS "Allow anon full access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.invoices;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.invoices;
DROP POLICY IF EXISTS "anon_select_invoices" ON public.invoices;
DROP POLICY IF EXISTS "anon_write_invoices" ON public.invoices;

-- Allow anon SELECT only (portal + client-facing invoice page still work)
CREATE POLICY "anon_select_invoices"
  ON public.invoices
  FOR SELECT
  TO anon
  USING (true);

-- service_role bypasses RLS by default, but we declare explicitly for clarity
-- (No explicit policy needed for service_role — it bypasses RLS.)

-- Anon has NO insert/update/delete. Any attempt returns 401.
-- This is enforced by the absence of policies granting those operations to anon.


-- ───────── ADMIN_SETTINGS ─────────
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon full access to admin_settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admin_settings;
DROP POLICY IF EXISTS "anon_select_admin_settings" ON public.admin_settings;
DROP POLICY IF EXISTS "anon_write_admin_settings" ON public.admin_settings;

-- No anon policies at all = anon gets 401 on every operation.
-- service_role retains full access (bypasses RLS).


-- ───────── VERIFICATION ─────────
-- After running, verify with:
--   SELECT tablename, policyname, cmd, roles FROM pg_policies
--     WHERE tablename IN ('invoices', 'admin_settings') ORDER BY tablename, cmd;
--
-- Expected result:
--   invoices        | anon_select_invoices | SELECT | {anon}
--   (admin_settings should have zero rows — no anon policies)
