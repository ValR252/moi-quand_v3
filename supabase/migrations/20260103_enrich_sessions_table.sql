-- Phase 2.4: Enrich sessions table
-- Adds description, visual customization, and availability constraints

-- Add display and description columns
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366f1';

-- Add availability constraint
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS max_per_day INTEGER;

-- Add display order for sorting
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.sessions.description IS 'Detailed description of the session type shown to clients';
COMMENT ON COLUMN public.sessions.color IS 'Hex color code for displaying this session type in calendars and UI (e.g., #6366f1)';
COMMENT ON COLUMN public.sessions.max_per_day IS 'Maximum number of bookings allowed per day for this session type (NULL = unlimited)';
COMMENT ON COLUMN public.sessions.display_order IS 'Order in which sessions are displayed (lower numbers first)';

-- Update existing sessions with default values
UPDATE public.sessions
SET
  color = COALESCE(color, '#6366f1'),
  display_order = COALESCE(display_order, 0)
WHERE color IS NULL OR display_order IS NULL;

-- Create index on display_order for faster sorting
CREATE INDEX IF NOT EXISTS idx_sessions_display_order ON public.sessions(display_order);
