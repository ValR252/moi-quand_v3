-- Migration: Add cancellation and transfer fields to bookings table
-- Date: 2026-01-06
-- Description: Track cancellations, transfers, and refunds for appointments

-- Add cancellation tracking columns
ALTER TABLE bookings
ADD COLUMN cancelled_at TIMESTAMP NULL,
ADD COLUMN cancelled_by VARCHAR(20) NULL,
  -- 'patient' or 'therapist'
ADD COLUMN cancellation_reason TEXT NULL,
ADD COLUMN cancellation_type VARCHAR(20) NULL,
  -- 'cancel' or 'transfer'
ADD COLUMN cancellation_token VARCHAR(64) UNIQUE NULL;
  -- Secure token for patient cancellation link

-- Add refund tracking columns
ALTER TABLE bookings
ADD COLUMN refund_status VARCHAR(20) NULL,
  -- 'pending', 'processed', 'rejected'
ADD COLUMN refund_amount DECIMAL(10,2) NULL,
ADD COLUMN refund_date TIMESTAMP NULL;

-- Add transfer tracking columns
ALTER TABLE bookings
ADD COLUMN original_booking_id UUID NULL,
  -- If this is a transferred appointment, reference to original
ADD COLUMN transferred_to_booking_id UUID NULL;
  -- If this appointment was transferred, reference to new appointment

-- Add foreign key constraints for transfer relationships
ALTER TABLE bookings
ADD CONSTRAINT fk_original_booking
  FOREIGN KEY (original_booking_id)
  REFERENCES bookings(id)
  ON DELETE SET NULL;

ALTER TABLE bookings
ADD CONSTRAINT fk_transferred_to_booking
  FOREIGN KEY (transferred_to_booking_id)
  REFERENCES bookings(id)
  ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX idx_bookings_cancellation_token ON bookings(cancellation_token) WHERE cancellation_token IS NOT NULL;
CREATE INDEX idx_bookings_cancelled_at ON bookings(cancelled_at) WHERE cancelled_at IS NOT NULL;
CREATE INDEX idx_bookings_refund_status ON bookings(refund_status) WHERE refund_status IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN bookings.cancelled_at IS 'Timestamp when appointment was cancelled';
COMMENT ON COLUMN bookings.cancelled_by IS 'Who cancelled: patient or therapist';
COMMENT ON COLUMN bookings.cancellation_reason IS 'Optional reason for cancellation';
COMMENT ON COLUMN bookings.cancellation_type IS 'Type of cancellation: cancel or transfer';
COMMENT ON COLUMN bookings.cancellation_token IS 'Unique secure token for patient cancellation link';
COMMENT ON COLUMN bookings.refund_status IS 'Status of refund: pending, processed, or rejected';
COMMENT ON COLUMN bookings.refund_amount IS 'Amount to be refunded';
COMMENT ON COLUMN bookings.refund_date IS 'Date when refund was processed';
COMMENT ON COLUMN bookings.original_booking_id IS 'Reference to original appointment if this is a transfer';
COMMENT ON COLUMN bookings.transferred_to_booking_id IS 'Reference to new appointment if this was transferred';
