-- Add missing 'reason' column to holidays table
-- This column allows therapists to add a note/reason for the holiday period

ALTER TABLE public.holidays
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Add comment
COMMENT ON COLUMN public.holidays.reason IS 'Optional note explaining the reason for this holiday period (e.g., "Summer vacation", "Conference")';
