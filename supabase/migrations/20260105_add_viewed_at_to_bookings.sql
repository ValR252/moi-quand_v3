-- Add viewed_at column to track when therapist views a booking
-- Used for notification badge system

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.bookings.viewed_at IS 'Timestamp when therapist first viewed this booking in the dashboard. NULL = unread/new booking.';

-- Create index for faster queries on unread bookings
CREATE INDEX IF NOT EXISTS idx_bookings_viewed_at ON public.bookings(therapist_id, viewed_at) WHERE viewed_at IS NULL;
