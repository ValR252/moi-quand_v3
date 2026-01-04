-- Create schedules table
-- This table stores the weekly availability schedule for therapists

CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  -- 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  start_time TEXT NOT NULL,
  -- Format: "HH:MM" (e.g., "09:00")
  end_time TEXT NOT NULL,
  -- Format: "HH:MM" (e.g., "17:00")
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure start_time is before end_time
  CONSTRAINT valid_time_range CHECK (start_time < end_time),

  -- Prevent overlapping schedules for the same therapist on the same day
  UNIQUE (therapist_id, day_of_week, start_time, end_time)
);

-- Add index for faster queries
CREATE INDEX idx_schedules_therapist_id ON public.schedules(therapist_id);
CREATE INDEX idx_schedules_day_of_week ON public.schedules(day_of_week);

-- Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read schedules (needed for public booking page)
CREATE POLICY "Schedules are viewable by everyone"
  ON public.schedules
  FOR SELECT
  USING (true);

-- Policy: Only therapists can insert their own schedules
CREATE POLICY "Therapists can insert their own schedules"
  ON public.schedules
  FOR INSERT
  WITH CHECK (auth.uid() = therapist_id);

-- Policy: Only therapists can update their own schedules
CREATE POLICY "Therapists can update their own schedules"
  ON public.schedules
  FOR UPDATE
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

-- Policy: Only therapists can delete their own schedules
CREATE POLICY "Therapists can delete their own schedules"
  ON public.schedules
  FOR DELETE
  USING (auth.uid() = therapist_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default schedule for existing therapist (Monday to Friday, 9:00-17:00)
INSERT INTO public.schedules (therapist_id, day_of_week, start_time, end_time, is_available)
SELECT
  id,
  day,
  '09:00',
  '17:00',
  true
FROM
  public.therapists,
  generate_series(1, 5) AS day  -- Monday (1) to Friday (5)
WHERE
  id = 'da067f75-f9c1-45e4-bece-d1d7f5c51e59'
ON CONFLICT (therapist_id, day_of_week, start_time, end_time) DO NOTHING;

COMMENT ON TABLE public.schedules IS 'Weekly availability schedules for therapists';
COMMENT ON COLUMN public.schedules.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
COMMENT ON COLUMN public.schedules.start_time IS 'Start time in HH:MM format';
COMMENT ON COLUMN public.schedules.end_time IS 'End time in HH:MM format';
