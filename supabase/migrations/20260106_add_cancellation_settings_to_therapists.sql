-- Migration: Add cancellation policy settings to therapists table
-- Date: 2026-01-06
-- Description: Allows therapists to configure their cancellation and transfer policies

-- Add cancellation policy columns
ALTER TABLE therapists
ADD COLUMN cancellation_enabled BOOLEAN DEFAULT true,
ADD COLUMN cancellation_policy VARCHAR(20) DEFAULT 'both',
  -- Options: 'refund', 'transfer', 'both'
ADD COLUMN cancellation_deadline_hours INTEGER DEFAULT 24,
  -- Minimum hours before appointment to cancel/transfer
ADD COLUMN refund_automatic BOOLEAN DEFAULT false;
  -- true = automatic refund via payment provider, false = manual

-- Add comments for documentation
COMMENT ON COLUMN therapists.cancellation_enabled IS 'Whether patients can cancel/transfer appointments';
COMMENT ON COLUMN therapists.cancellation_policy IS 'Allowed cancellation actions: refund, transfer, or both';
COMMENT ON COLUMN therapists.cancellation_deadline_hours IS 'Minimum hours before appointment to cancel/transfer';
COMMENT ON COLUMN therapists.refund_automatic IS 'Whether refunds are processed automatically';

-- Set default values for existing therapists
UPDATE therapists
SET
  cancellation_enabled = true,
  cancellation_policy = 'both',
  cancellation_deadline_hours = 24,
  refund_automatic = false
WHERE cancellation_enabled IS NULL;
