-- Add missing 'name' column to sessions table
-- The sessions table was created in v1 with only 'label' column
-- v2 code expects both 'name' and 'label' columns

ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS name TEXT;

-- Copy label to name for existing sessions if name is null
UPDATE public.sessions
SET name = label
WHERE name IS NULL;

-- Make name required (NOT NULL)
ALTER TABLE public.sessions
ALTER COLUMN name SET NOT NULL;

-- Add comment
COMMENT ON COLUMN public.sessions.name IS 'Internal name of the session type (used in code and admin interfaces)';
