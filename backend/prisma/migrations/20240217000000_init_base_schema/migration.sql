-- =====================================================
-- ABAN REMIT CORE BACKEND - BASE SCHEMA MIGRATION
-- =====================================================
-- Migration: Initialize base database schema
-- Date: 2024-02-17
-- PostgreSQL Version: 10.23+
-- Database: fkmqtves_aban_remit
-- 
-- This migration creates the complete base schema for the
-- Aban Remit Core Backend including all core tables,
-- multi-schema architecture, and production-ready settings.
-- =====================================================

-- =====================================================
-- SECTION 1: EXTENSIONS AND SETTINGS
-- =====================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone to UTC for all timestamps
SET timezone = 'UTC';

-- =====================================================
-- SECTION 2: SCHEMA CREATION
-- =====================================================

-- Create schemas for organized table structure
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS ledger;
CREATE SCHEMA IF NOT EXISTS services;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS auth;

-- Schema comments for documentation
COMMENT ON SCHEMA core IS 'Core business entities: users, wallets, transactions';
COMMENT ON SCHEMA ledger IS 'Double-entry accounting ledger entries';
COMMENT ON SCHEMA services IS 'External service integration logs (MPESA, SMS, etc)';
COMMENT ON SCHEMA audit IS 'System audit trail and compliance logs';
COMMENT ON SCHEMA auth IS 'Authentication and authorization data';

-- =====================================================
-- SECTION 3: AUTH SCHEMA - Users and Authentication
-- =====================================================

-- Users table
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'AGENT', 'ADMIN')),
  wallet_id VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON auth.users(phone);
CREATE INDEX idx_users_wallet_id ON auth.users(wallet_id);
CREATE INDEX idx_users_role ON auth.users(role);

COMMENT ON TABLE auth.users IS 'System users including customers, agents, and admins';
COMMENT ON COLUMN auth.users.password_hash IS 'bcrypt hashed password (min 12 rounds)';
COMMENT ON COLUMN auth.users.wallet_id IS 'Associated wallet ID (WLT7770001 or AGT8880001 format)';

-- OTPs table
CREATE TABLE auth.otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_otps_user_id ON auth.otps(user_id);
CREATE INDEX idx_otps_expires_at ON auth.otps(expires_at);

COMMENT ON TABLE auth.otps IS 'One-time passwords for authentication (5-minute expiry)';
COMMENT ON COLUMN auth.otps.code IS '6-digit numeric code';

-- Devices table
CREATE TABLE auth.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_devices_user_id ON auth.devices(user_id);
CREATE INDEX idx_devices_fingerprint ON auth.devices(device_fingerprint);

COMMENT ON TABLE auth.devices IS 'Registered devices for multi-device support';

-- Token blacklist table
CREATE TABLE auth.token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_token_blacklist_expires ON auth.token_blacklist(expires_at);

COMMENT ON TABLE auth.token_blacklist IS 'Invalidated JWT tokens (cleaned up after expiry)';

-- =====================================================
-- SECTION 4: CORE SCHEMA - Wallets
-- =====================================================

-- Wallets table
CREATE TABLE core.wallets (
  id VARCHAR(20) PRIMARY KEY, -- WLT7770001 or AGT8880001
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  type VARCHAR(10) NOT NULL CHECK (type IN ('USER', 'AGENT', 'SYSTEM')),
  state VARCHAR(20) NOT NULL CHECK (state IN ('ACTIVE', 'LOCKED', 'FROZEN', 'SUSPENDED')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallets_owner_id ON core.wallets(owner_id);
CREATE INDEX idx_wallets_type ON core.wallets(type);
CREATE INDEX idx_wallets_state ON core.wallets(state);

COMMENT ON TABLE core.wallets IS 'Multi-currency digital wallets';
COMMENT ON COLUMN core.wallets.id IS 'Wallet identifier: WLT7770001 (user) or AGT8880001 (agent)';
COMMENT ON COLUMN core.wallets.state IS 'ACTIVE=all ops, LOCKED=no ops, FROZEN=deposits only, SUSPENDED=admin only';

-- Wallet state history table
CREATE TABLE core.wallet_state_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id VARCHAR(20) NOT NULL REFERENCES core.wallets(id) ON DELETE CASCADE,
  old_state VARCHAR(20) NOT NULL,
  new_state VARCHAR(20) NOT NULL,
  reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallet_state_history_wallet ON core.wallet_state_history(wallet_id);
CREATE INDEX idx_wallet_state_history_created ON core.wallet_state_history(created_at);

COMMENT ON TABLE core.wallet_state_history IS 'Audit trail of wallet state changes';

-- =====================================================
-- SECTION 5: CORE SCHEMA - Transactions
-- =====================================================

-- Transactions table
CREATE TABLE core.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')),
  source_wallet_id VARCHAR(20) REFERENCES core.wallets(id),
  destination_wallet_id VARCHAR(20) REFERENCES core.wallets(id),
  currency VARCHAR(3) NOT NULL CHECK (currency IN ('KES', 'USD', 'EUR')),
  amount DECIMAL(19, 2) NOT NULL CHECK (amount > 0),
  fee DECIMAL(19, 2) DEFAULT 0 CHECK (fee >= 0),
  commission DECIMAL(19, 2) CHECK (commission >= 0),
  exchange_rate DECIMAL(19, 8),
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_transactions_source_wallet ON core.transactions(source_wallet_id);
CREATE INDEX idx_transactions_destination_wallet ON core.transactions(destination_wallet_id);
CREATE INDEX idx_transactions_idempotency ON core.transactions(idempotency_key);
CREATE INDEX idx_transactions_type ON core.transactions(type);
CREATE INDEX idx_transactions_status ON core.transactions(status);
CREATE INDEX idx_transactions_created ON core.transactions(created_at);

COMMENT ON TABLE core.transactions IS 'All financial transactions in the system';
COMMENT ON COLUMN core.transactions.idempotency_key IS 'Prevents duplicate transactions (24-hour uniqueness)';
COMMENT ON COLUMN core.transactions.amount IS 'Transaction amount in specified currency (always positive)';

-- =====================================================
-- SECTION 6: LEDGER SCHEMA - Double-Entry Accounting
-- =====================================================

-- Ledger entries table
CREATE TABLE ledger.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES core.transactions(id) ON DELETE RESTRICT,
  wallet_id VARCHAR(20) NOT NULL REFERENCES core.wallets(id) ON DELETE RESTRICT,
  currency VARCHAR(3) NOT NULL CHECK (currency IN ('KES', 'USD', 'EUR')),
  amount DECIMAL(19, 2) NOT NULL CHECK (amount > 0),
  entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ledger_entries_transaction ON ledger.entries(transaction_id);
CREATE INDEX idx_ledger_entries_wallet_currency ON ledger.entries(wallet_id, currency);
CREATE INDEX idx_ledger_entries_created ON ledger.entries(created_at);

COMMENT ON TABLE ledger.entries IS 'Immutable double-entry ledger entries';
COMMENT ON COLUMN ledger.entries.entry_type IS 'DEBIT decreases balance, CREDIT increases balance';
COMMENT ON COLUMN ledger.entries.amount IS 'Always positive; entry_type determines direction';

-- =====================================================
-- SECTION 7: CORE SCHEMA - Fee Configurations
-- =====================================================

-- Fee configurations table
CREATE TABLE core.fee_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type VARCHAR(30) NOT NULL,
  fee_type VARCHAR(20) NOT NULL CHECK (fee_type IN ('FIXED', 'PERCENTAGE', 'TIERED')),
  fixed_amount DECIMAL(19, 2) CHECK (fixed_amount >= 0),
  percentage DECIMAL(5, 2) CHECK (percentage >= 0 AND percentage <= 100),
  tiers JSONB, -- Array of {minAmount, maxAmount, feeAmount}
  active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fee_configs_transaction_type ON core.fee_configs(transaction_type);
CREATE INDEX idx_fee_configs_active ON core.fee_configs(active);

COMMENT ON TABLE core.fee_configs IS 'Configurable transaction fee structures';
COMMENT ON COLUMN core.fee_configs.tiers IS 'JSON array for tiered fees: [{minAmount, maxAmount, feeAmount}]';

-- =====================================================
-- SECTION 8: CORE SCHEMA - Commission Configurations
-- =====================================================

-- Commission configurations table
CREATE TABLE core.commission_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type VARCHAR(30) NOT NULL,
  commission_type VARCHAR(20) NOT NULL CHECK (commission_type IN ('FIXED', 'PERCENTAGE', 'TIERED')),
  fixed_amount DECIMAL(19, 2) CHECK (fixed_amount >= 0),
  percentage DECIMAL(5, 2) CHECK (percentage >= 0 AND percentage <= 100),
  tiers JSONB, -- Array of {minAmount, maxAmount, commissionAmount}
  active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_commission_configs_transaction_type ON core.commission_configs(transaction_type);
CREATE INDEX idx_commission_configs_active ON core.commission_configs(active);

COMMENT ON TABLE core.commission_configs IS 'Agent commission structures';

-- =====================================================
-- SECTION 9: CORE SCHEMA - Exchange Rates
-- =====================================================

-- Exchange rates table
CREATE TABLE core.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL CHECK (from_currency IN ('KES', 'USD', 'EUR')),
  to_currency VARCHAR(3) NOT NULL CHECK (to_currency IN ('KES', 'USD', 'EUR')),
  rate DECIMAL(19, 8) NOT NULL CHECK (rate > 0),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

CREATE INDEX idx_exchange_rates_pair ON core.exchange_rates(from_currency, to_currency);

COMMENT ON TABLE core.exchange_rates IS 'Current exchange rates for currency conversion';
COMMENT ON COLUMN core.exchange_rates.rate IS 'How many to_currency units per 1 from_currency unit';

-- Exchange rate history table
CREATE TABLE core.exchange_rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(19, 8) NOT NULL,
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exchange_rate_history_pair ON core.exchange_rate_history(from_currency, to_currency);
CREATE INDEX idx_exchange_rate_history_created ON core.exchange_rate_history(created_at);

COMMENT ON TABLE core.exchange_rate_history IS 'Historical exchange rates for audit';

-- =====================================================
-- SECTION 10: AUDIT SCHEMA - Audit Trail
-- =====================================================

-- Audit entries table
CREATE TABLE audit.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  metadata JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_entries_entity ON audit.entries(entity_type, entity_id);
CREATE INDEX idx_audit_entries_actor ON audit.entries(actor_id);
CREATE INDEX idx_audit_entries_created ON audit.entries(created_at);

COMMENT ON TABLE audit.entries IS 'Immutable audit trail for compliance';
COMMENT ON COLUMN audit.entries.entity_type IS 'Type of entity: AUTH, WALLET, CONFIG, TRANSACTION, etc.';

-- =====================================================
-- SECTION 11: SYSTEM ACCOUNTS INITIALIZATION
-- =====================================================

-- Create system user for system accounts
INSERT INTO auth.users (id, phone, password_hash, role, wallet_id, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'SYSTEM',
  '$2b$12$SYSTEM_ACCOUNT_NO_LOGIN',
  'ADMIN',
  'SYSTEM',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create system wallets for suspense and revenue tracking
INSERT INTO core.wallets (id, owner_id, type, state, created_at) VALUES
  ('MPESA_SUSPENSE', '00000000-0000-0000-0000-000000000000', 'SYSTEM', 'ACTIVE', NOW()),
  ('PAYSTACK_SUSPENSE', '00000000-0000-0000-0000-000000000000', 'SYSTEM', 'ACTIVE', NOW()),
  ('AIRTIME_SUSPENSE', '00000000-0000-0000-0000-000000000000', 'SYSTEM', 'ACTIVE', NOW()),
  ('FEE_REVENUE', '00000000-0000-0000-0000-000000000000', 'SYSTEM', 'ACTIVE', NOW()),
  ('COMMISSION_EXPENSE', '00000000-0000-0000-0000-000000000000', 'SYSTEM', 'ACTIVE', NOW())
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE core.wallets IS 'System accounts: MPESA_SUSPENSE, PAYSTACK_SUSPENSE, AIRTIME_SUSPENSE, FEE_REVENUE, COMMISSION_EXPENSE';

-- =====================================================
-- SECTION 12: SEQUENCES FOR WALLET ID GENERATION
-- =====================================================

-- Sequence for user wallet IDs (WLT7770001, WLT7770002, ...)
CREATE SEQUENCE IF NOT EXISTS core.wallet_user_seq START WITH 7770001;

-- Sequence for agent wallet IDs (AGT8880001, AGT8880002, ...)
CREATE SEQUENCE IF NOT EXISTS core.wallet_agent_seq START WITH 8880001;

COMMENT ON SEQUENCE core.wallet_user_seq IS 'Generates sequential numbers for user wallet IDs (WLT prefix)';
COMMENT ON SEQUENCE core.wallet_agent_seq IS 'Generates sequential numbers for agent wallet IDs (AGT prefix)';

-- =====================================================
-- SECTION 13: HELPER FUNCTIONS
-- =====================================================

-- Function to generate next user wallet ID
CREATE OR REPLACE FUNCTION core.generate_user_wallet_id()
RETURNS VARCHAR(20) AS $$
BEGIN
  RETURN 'WLT' || LPAD(nextval('core.wallet_user_seq')::TEXT, 7, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate next agent wallet ID
CREATE OR REPLACE FUNCTION core.generate_agent_wallet_id()
RETURNS VARCHAR(20) AS $$
BEGIN
  RETURN 'AGT' || LPAD(nextval('core.wallet_agent_seq')::TEXT, 7, '0');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION core.generate_user_wallet_id() IS 'Generates next user wallet ID (WLT7770001 format)';
COMMENT ON FUNCTION core.generate_agent_wallet_id() IS 'Generates next agent wallet ID (AGT8880001 format)';

-- =====================================================
-- SECTION 14: TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON core.wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECTION 15: GRANTS AND PERMISSIONS
-- =====================================================

-- Grant usage on schemas to application role (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aban_app_user') THEN
    GRANT USAGE ON SCHEMA core, ledger, services, audit, auth TO aban_app_user;
    GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA core, ledger, services, audit, auth TO aban_app_user;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA core TO aban_app_user;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA core TO aban_app_user;
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Base schema migration completed successfully';
  RAISE NOTICE 'Schemas created: core, ledger, services, audit, auth';
  RAISE NOTICE 'System accounts initialized: MPESA_SUSPENSE, PAYSTACK_SUSPENSE, AIRTIME_SUSPENSE, FEE_REVENUE, COMMISSION_EXPENSE';
  RAISE NOTICE 'Wallet ID sequences initialized: WLT7770001+, AGT8880001+';
END $$;
