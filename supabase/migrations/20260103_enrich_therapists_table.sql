-- Phase 2.1: Enrich therapists table with profile, config, and JSONB columns
-- Adds fields for complete therapist profile management and customization

-- Add profile columns
ALTER TABLE public.therapists
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'CH',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Add configuration columns
ALTER TABLE public.therapists
ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_confirm BOOLEAN DEFAULT false;

-- Add JSONB columns for flexible data structures
ALTER TABLE public.therapists
ADD COLUMN IF NOT EXISTS custom_form JSONB,
ADD COLUMN IF NOT EXISTS payment_config JSONB,
ADD COLUMN IF NOT EXISTS email_templates JSONB;

-- Add timestamp columns if not exist
ALTER TABLE public.therapists
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Add comments for documentation
COMMENT ON COLUMN public.therapists.custom_form IS 'Custom intake form fields as JSON array. Example: [{"id": "1", "label": "Motif de consultation", "type": "textarea", "required": true}]';
COMMENT ON COLUMN public.therapists.payment_config IS 'Payment configuration as JSON. Example: {"methods": ["virement", "twint"], "iban": "CH93...", "bank_name": "UBS"}';
COMMENT ON COLUMN public.therapists.email_templates IS 'Email templates with placeholders. Example: {"confirmation": "Bonjour {{client_name}}, votre RDV..."}';

-- Create updated_at trigger if doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS set_therapists_updated_at ON public.therapists;

CREATE TRIGGER set_therapists_updated_at
  BEFORE UPDATE ON public.therapists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Set default values for existing therapist
UPDATE public.therapists
SET
  booking_enabled = COALESCE(booking_enabled, true),
  auto_confirm = COALESCE(auto_confirm, false),
  country = COALESCE(country, 'CH'),
  created_at = COALESCE(created_at, timezone('utc'::text, now())),
  updated_at = COALESCE(updated_at, timezone('utc'::text, now()))
WHERE id = 'da067f75-f9c1-45e4-bece-d1d7f5c51e59';
