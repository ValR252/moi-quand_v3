-- Migration: Add Google Calendar Integration
-- Date: 2026-01-01
-- Description: Adds columns to store Google OAuth tokens and event IDs

-- Add Google Calendar OAuth columns to therapists table
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMP;

-- Add Google Calendar event ID to bookings table (for sync)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_bookings_google_event ON bookings(google_event_id);

-- Comments for documentation
COMMENT ON COLUMN therapists.google_access_token IS 'Google OAuth access token (short-lived)';
COMMENT ON COLUMN therapists.google_refresh_token IS 'Google OAuth refresh token (long-lived)';
COMMENT ON COLUMN therapists.google_token_expiry IS 'Expiration timestamp for access token';
COMMENT ON COLUMN bookings.google_event_id IS 'Google Calendar event ID for this booking';

-- Success message
SELECT 'Google Calendar migration completed! 🗓️' as status;
