-- Ajouter la colonne pour stocker l'ID de l'agenda Google sélectionné
ALTER TABLE therapists 
ADD COLUMN IF NOT EXISTS google_calendar_id TEXT DEFAULT 'primary';

COMMENT ON COLUMN therapists.google_calendar_id IS 'ID de l''agenda Google où créer les événements (par défaut: primary)';
