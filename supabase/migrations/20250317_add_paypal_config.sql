-- Migration: Ajouter la configuration PayPal
-- Feature 2: Paiement PayPal

-- Ajouter les colonnes de configuration PayPal à la table therapists
ALTER TABLE therapists 
ADD COLUMN IF NOT EXISTS paypal_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS paypal_client_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_client_secret TEXT,
ADD COLUMN IF NOT EXISTS paypal_webhook_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_environment VARCHAR(10) DEFAULT 'sandbox' CHECK (paypal_environment IN ('sandbox', 'production'));

-- Ajouter les colonnes de suivi des paiements PayPal à la table bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS paypal_order_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_refund_id TEXT;

-- Mettre à jour les valeurs par défaut
UPDATE therapists 
SET paypal_enabled = false, 
    paypal_environment = 'sandbox' 
WHERE paypal_enabled IS NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN therapists.paypal_enabled IS 'Activer/désactiver les paiements PayPal';
COMMENT ON COLUMN therapists.paypal_client_id IS 'Client ID PayPal (API credentials)';
COMMENT ON COLUMN therapists.paypal_client_secret IS 'Client Secret PayPal (API credentials)';
COMMENT ON COLUMN therapists.paypal_webhook_id IS 'Webhook ID PayPal pour les notifications';
COMMENT ON COLUMN therapists.paypal_environment IS 'Environnement PayPal: sandbox ou production';
COMMENT ON COLUMN bookings.paypal_order_id IS 'ID de la commande PayPal';
COMMENT ON COLUMN bookings.paypal_capture_id IS 'ID de la capture PayPal';
COMMENT ON COLUMN bookings.paypal_refund_id IS 'ID du remboursement PayPal';

SELECT 'Migration PayPal config completed successfully! ✅' as status;
