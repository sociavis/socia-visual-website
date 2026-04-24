-- ═══ FORM SUBMISSIONS ═══
-- Run in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor
--
-- Stores form submissions from sociavisual.com /api/submit
-- Service role writes; anon has zero access; admin reads via /api/admin/submissions
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  form_type text NOT NULL DEFAULT 'contact',
  fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  email text,
  name text,
  subject text,
  source text,
  ip text,
  user_agent text,
  recaptcha_score numeric,
  is_spam boolean NOT NULL DEFAULT false,
  is_read boolean NOT NULL DEFAULT false,
  notes text
);

CREATE INDEX IF NOT EXISTS submissions_created_at_idx ON public.submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS submissions_unread_idx ON public.submissions (created_at DESC) WHERE is_read = false AND is_spam = false;

-- Lock down: anon has no access, service_role bypasses RLS automatically
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_no_access" ON public.submissions;
CREATE POLICY "anon_no_access" ON public.submissions FOR ALL TO anon USING (false) WITH CHECK (false);
