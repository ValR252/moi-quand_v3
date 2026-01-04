-- Phase 2.2: Create holidays table
-- Stores therapist's vacation periods and unavailable dates

CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_holidays_therapist_id ON public.holidays(therapist_id);
CREATE INDEX IF NOT EXISTS idx_holidays_dates ON public.holidays(start_date, end_date);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view holidays (needed for public booking page to check availability)
CREATE POLICY "Holidays are viewable by everyone"
  ON public.holidays
  FOR SELECT
  USING (true);

-- Policy: Only therapists can insert their own holidays
CREATE POLICY "Therapists can insert their own holidays"
  ON public.holidays
  FOR INSERT
  WITH CHECK (auth.uid() = therapist_id);

-- Policy: Only therapists can update their own holidays
CREATE POLICY "Therapists can update their own holidays"
  ON public.holidays
  FOR UPDATE
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

-- Policy: Only therapists can delete their own holidays
CREATE POLICY "Therapists can delete their own holidays"
  ON public.holidays
  FOR DELETE
  USING (auth.uid() = therapist_id);

COMMENT ON TABLE public.holidays IS 'Therapist vacation periods and unavailable dates';
COMMENT ON COLUMN public.holidays.start_date IS 'First day of holiday period (inclusive)';
COMMENT ON COLUMN public.holidays.end_date IS 'Last day of holiday period (inclusive)';
COMMENT ON COLUMN public.holidays.reason IS 'Optional reason for the holiday (e.g., "Vacances d''été", "Formation")';
