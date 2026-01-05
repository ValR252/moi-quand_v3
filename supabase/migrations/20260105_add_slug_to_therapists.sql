-- Add slug column for personalized booking URLs
-- Example: moi-quand.com/marcel-dupont instead of moi-quand.com/book/uuid

ALTER TABLE public.therapists
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

COMMENT ON COLUMN public.therapists.slug IS 'URL-friendly identifier for personalized booking links. Example: "marcel-dupont" for moi-quand.com/marcel-dupont';

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_therapists_slug ON public.therapists(slug);

-- Generate initial slugs from existing therapist names
-- This creates URL-friendly slugs like "marcel-dupont" from "Marcel Dupont"
UPDATE public.therapists
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      UNACCENT(name), -- Remove accents (é -> e, à -> a, etc.)
      '[^a-zA-Z0-9\s-]', -- Remove special characters
      '',
      'g'
    ),
    '\s+', -- Replace spaces with hyphens
    '-',
    'g'
  )
)
WHERE slug IS NULL;
