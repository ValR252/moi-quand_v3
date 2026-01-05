-- Add Google Calendar event ID to bookings table
-- This allows us to track which Google Calendar event corresponds to each booking

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS google_event_id TEXT;

COMMENT ON COLUMN public.bookings.google_event_id IS 'Google Calendar event ID for synced appointments. Null if therapist does not have Google Calendar connected or sync failed.';

-- Create index for faster lookups when updating/deleting events
CREATE INDEX IF NOT EXISTS idx_bookings_google_event_id ON public.bookings(google_event_id) WHERE google_event_id IS NOT NULL;
