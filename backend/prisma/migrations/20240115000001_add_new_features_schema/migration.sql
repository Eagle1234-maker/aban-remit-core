-- Migration: Add new features schema for wallet lookup, MPESA logging, SMS logging, and receipts
-- Requirements: 31.6, 32.2, 36.1
-- Task: 1. Database schema updates for new features
-- Depends on: 20240217000000_init_base_schema

-- Services schema should already exist from base migration
-- This migration adds specific tables for new features

-- Create MPESA logs table for deposit tracking and idempotency
CREATE TABLE IF NOT EXISTS services.mpesa_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mpesa_receipt VARCHAR(50) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  amount DECIMAL(19, 2) NOT NULL,
  raw_payload JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for MPESA logs
CREATE INDEX IF NOT EXISTS idx_mpesa_logs_receipt ON services.mpesa_logs(mpesa_receipt);
CREATE INDEX IF NOT EXISTS idx_mpesa_logs_phone ON services.mpesa_logs(phone);

-- Create SMS logs table for notification tracking and cost analysis
CREATE TABLE IF NOT EXISTS services.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  cost DECIMAL(10, 4),
  status VARCHAR(20) NOT NULL CHECK (status IN ('SENT', 'FAILED', 'PENDING')),
  provider_message_id VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for SMS logs
CREATE INDEX IF NOT EXISTS idx_sms_logs_recipient ON services.sms_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created ON services.sms_logs(created_at);

-- Add verification_hash column to transactions table for receipt verification
-- The core.transactions table exists from base schema migration
ALTER TABLE core.transactions ADD COLUMN IF NOT EXISTS verification_hash VARCHAR(64);

-- Create index on wallets table for fast wallet number lookups
-- The core.wallets table exists from base schema migration
CREATE INDEX IF NOT EXISTS idx_wallets_number ON core.wallets(id);

-- Add comments for documentation
COMMENT ON TABLE services.mpesa_logs IS 'Stores all MPESA deposit callbacks for audit and idempotency checking';
COMMENT ON COLUMN services.mpesa_logs.mpesa_receipt IS 'Unique MPESA transaction receipt number for idempotency';
COMMENT ON COLUMN services.mpesa_logs.raw_payload IS 'Complete MPESA callback payload for audit trail';

COMMENT ON TABLE services.sms_logs IS 'Tracks all SMS notifications sent by the system for cost analysis and audit';
COMMENT ON COLUMN services.sms_logs.cost IS 'Cost of sending the SMS in local currency';
COMMENT ON COLUMN services.sms_logs.provider_message_id IS 'SMS provider message ID for tracking delivery status';

COMMENT ON COLUMN core.transactions.verification_hash IS 'SHA256 hash for receipt verification (reference + amount + created_at)';