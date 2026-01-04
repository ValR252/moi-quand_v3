-- Phase 2.3: Enrich bookings table
-- Adds payment tracking, communication status, custom form data, and booking lifecycle

-- Add payment columns
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;

-- Add communication tracking columns
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmation_sent BOOLEAN DEFAULT false;

-- Add custom form data (JSONB)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS form_data JSONB;

-- Add therapist private notes
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS therapist_notes TEXT;

-- Add booking lifecycle columns
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN public.bookings.payment_status IS 'Payment status: pending (awaiting payment), paid (payment received), cancelled (booking cancelled)';
COMMENT ON COLUMN public.bookings.payment_method IS 'Payment method used: virement, twint, especes, etc.';
COMMENT ON COLUMN public.bookings.form_data IS 'Client responses to custom intake form as JSON. Example: {"motif": "Stress", "urgence": "Non"}';
COMMENT ON COLUMN public.bookings.therapist_notes IS 'Private notes visible only to therapist';
COMMENT ON COLUMN public.bookings.status IS 'Booking lifecycle status: pending (awaiting confirmation), confirmed (appointment confirmed), cancelled (booking cancelled), completed (session took place)';

-- Update existing bookings with default values
UPDATE public.bookings
SET
  payment_status = COALESCE(payment_status, 'pending'),
  status = COALESCE(status, 'pending'),
  reminder_sent = COALESCE(reminder_sent, false),
  confirmation_sent = COALESCE(confirmation_sent, false)
WHERE payment_status IS NULL OR status IS NULL;

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
