-- ═══ MEETING NOTES TABLE ═══
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor
-- This creates the meeting_notes table for the SV Admin discovery meeting forms

CREATE TABLE IF NOT EXISTS public.meeting_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  meeting_date DATE,
  meeting_type TEXT DEFAULT 'discovery',
  attendees TEXT,
  contact TEXT,
  responses JSONB DEFAULT '{}',
  open_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;

-- Allow anon read/write (matches existing admin pattern)
CREATE POLICY "Allow anon full access to meeting_notes"
  ON public.meeting_notes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_notes;
