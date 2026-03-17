-- 🚀 Migration pour les Features 1 & 2
-- Feature 1: Limite de réservation (booking_limit_months)
-- Feature 2: Paiement PayPal

-- ============================================
-- FEATURE 1: Limite de réservation
-- ============================================

-- Ajouter la colonne booking_limit_months à la table therapists
ALTER TABLE therapists 
ADD COLUMN IF NOT EXISTS booking_limit_months INT DEFAULT 2;

-- Commentaire pour documentation
COMMENT ON COLUMN therapists.booking_limit_months IS 'Nombre de mois à l''avance pour les réservations (défaut: 2)';

-- ============================================
-- FEATURE 2: Configuration PayPal
-- ============================================

-- Ajouter les colonnes PayPal à la table therapists
ALTER TABLE therapists 
ADD COLUMN IF NOT EXISTS paypal_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS paypal_client_id VARCHAR,
ADD COLUMN IF NOT EXISTS paypal_client_secret VARCHAR,
ADD COLUMN IF NOT EXISTS paypal_webhook_id VARCHAR,
ADD COLUMN IF NOT EXISTS paypal_environment VARCHAR DEFAULT 'sandbox' CHECK (paypal_environment IN ('sandbox', 'production'));

-- Commentaires pour documentation
COMMENT ON COLUMN therapists.paypal_enabled IS 'Activation des paiements PayPal';
COMMENT ON COLUMN therapists.paypal_client_id IS 'Client ID PayPal (sandbox ou production)';
COMMENT ON COLUMN therapists.paypal_client_secret IS 'Client Secret PayPal (sandbox ou production)';
COMMENT ON COLUMN therapists.paypal_webhook_id IS 'ID du webhook PayPal pour les notifications';
COMMENT ON COLUMN therapists.paypal_environment IS 'Environnement PayPal: sandbox ou production';

-- ============================================
-- FEATURE 2: Tracking PayPal dans les réservations
-- ============================================

-- Ajouter les colonnes de tracking PayPal à la table bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS paypal_order_id VARCHAR,
ADD COLUMN IF NOT EXISTS paypal_capture_id VARCHAR,
ADD COLUMN IF NOT EXISTS paypal_refund_id VARCHAR,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'paypal')),
ADD COLUMN IF NOT EXISTS refund_status VARCHAR CHECK (refund_status IN ('pending', 'processed', 'rejected')),
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL,
ADD COLUMN IF NOT EXISTS refund_date TIMESTAMP;

-- Commentaires pour documentation
COMMENT ON COLUMN bookings.paypal_order_id IS 'ID de la commande PayPal';
COMMENT ON COLUMN bookings.paypal_capture_id IS 'ID de la capture PayPal';
COMMENT ON COLUMN bookings.paypal_refund_id IS 'ID du remboursement PayPal';
COMMENT ON COLUMN bookings.payment_method IS 'Méthode de paiement: virement ou PayPal';
COMMENT ON COLUMN bookings.refund_status IS 'Statut du remboursement';
COMMENT ON COLUMN bookings.refund_amount IS 'Montant remboursé';
COMMENT ON COLUMN bookings.refund_date IS 'Date du remboursement';

-- ============================================
-- INDEX pour performance
-- ============================================

-- Index pour rechercher rapidement les réservations par order PayPal
CREATE INDEX IF NOT EXISTS idx_bookings_paypal_order ON bookings(paypal_order_id);

-- Index pour les captures PayPal
CREATE INDEX IF NOT EXISTS idx_bookings_paypal_capture ON bookings(paypal_capture_id);

-- ============================================
-- Mise à jour du schéma complet (pour référence)
-- ============================================

-- Mettre à jour les valeurs par défaut pour les thérapeutes existants
UPDATE therapists 
SET booking_limit_months = 2 
WHERE booking_limit_months IS NULL;

UPDATE therapists 
SET paypal_enabled = false 
WHERE paypal_enabled IS NULL;

UPDATE therapists 
SET paypal_environment = 'sandbox' 
WHERE paypal_environment IS NULL;

UPDATE bookings 
SET payment_method = 'bank_transfer' 
WHERE payment_method IS NULL;

-- Succès !
SELECT 'Migration Features 1 & 2 completed successfully! 🎉' as status;
