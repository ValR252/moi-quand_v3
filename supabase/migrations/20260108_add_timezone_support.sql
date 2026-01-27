-- Migration: Add timezone support for international therapists and patients
-- Date: 2026-01-08
-- Purpose: Allow therapists to set their timezone and store patient timezone for bookings

-- Add timezone field to therapists table
ALTER TABLE therapists
ADD COLUMN timezone VARCHAR DEFAULT 'Europe/Zurich';

-- Add timezone fields to bookings table
ALTER TABLE bookings
ADD COLUMN patient_timezone VARCHAR,
ADD COLUMN therapist_timezone VARCHAR;

-- Update existing bookings with default timezone
UPDATE bookings
SET therapist_timezone = 'Europe/Zurich'
WHERE therapist_timezone IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN therapists.timezone IS 'IANA timezone identifier (e.g., Europe/Paris, America/Montreal)';
COMMENT ON COLUMN bookings.patient_timezone IS 'Patient''s timezone at time of booking';
COMMENT ON COLUMN bookings.therapist_timezone IS 'Therapist''s timezone at time of booking (booking time stored in this timezone)';
