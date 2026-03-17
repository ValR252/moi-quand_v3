-- Migration: Ajouter la limite de réservation en mois
-- Feature 1: Limite de réservation

-- Ajouter la colonne booking_limit_months à la table therapists
-- Valeur par défaut: 2 mois
ALTER TABLE therapists 
ADD COLUMN IF NOT EXISTS booking_limit_months INTEGER DEFAULT 2;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN therapists.booking_limit_months IS 'Nombre de mois à l''avance maximum pour les réservations (défaut: 2)';

-- Mettre à jour les thérapeutes existants avec la valeur par défaut
UPDATE therapists 
SET booking_limit_months = 2 
WHERE booking_limit_months IS NULL;

SELECT 'Migration booking_limit_months completed successfully! ✅' as status;
