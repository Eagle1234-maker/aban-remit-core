-- =====================================================
-- ABAN REMIT - COMPLETE SCHEMA DEPLOYMENT
-- =====================================================
-- This is a single-file deployment script that includes
-- all migrations inline for easier deployment
-- =====================================================

\set ON_ERROR_STOP on

SELECT 
  'Starting deployment to: ' || current_database() as status,
  current_user as user,
  version() as postgresql_version,
  now() as start_time;

\echo ''
\echo '====================================================='
\echo 'MIGRATION 1: BASE SCHEMA'
\echo '====================================================='

-- =====================================================
-- SECTION 1: EXTENSIONS AND SETTINGS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
SET timezone = 'UTC';

-- =====================================================
-- SECTION 2: SCHEMA CREATION
-- =====================================================

CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS ledger;
CREATE SCHEMA IF NOT EXISTS services;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS auth;

COMMENT ON SCHEMA core IS 'Core business entities: users, wallets, transactions';
COMMENT ON SCHEMA ledger IS 'Double-entry accounting ledger entries';
COMMENT ON SCHEMA services IS 'External service integration logs (MPESA, SMS, etc)';
COMMENT ON SCHEMA audit IS 'System audit trail and compliance logs';
COMMENT ON SCHEMA auth IS 'Authentication and authorization data';

-- =====================================================
-- SECTION 3: AUTH SCHEMA TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'AGENT', 'ADMIN')),
  wallet_id VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON auth.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_wallet_id ON auth.users(wallet_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON auth.users(role);

CREATE TABLE IF NOT EXISTS auth.otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otps_user_id ON auth.otps(user_id);
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON auth.otps(expires_at);

CREATE TABLE IF NOT EXISTS auth.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON auth.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_fingerprint ON auth.devices(device_fingerprint);

CREATE TABLE IF NOT EXISTS auth.token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON auth.token_blacklist(expires_at);

-- =====================================================
-- SECTION 4: CORE SCHEMA TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS core.wallets (
  id VARCHAR(20) PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  type VARCHAR(10) NOT NULL CHECK (type IN ('USER', 'AGENT', 'SYSTEM')),
  state VARCHAR(20) NOT NULL CHECK (state IN ('ACTIVE', 'LOCKED', 'FROZEN', 'SUSPENDED')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_owner_id ON core.wallets(owner_id);
CREATE INDEX IF NOT EXISTS idx_wallets_type ON core.wallets(type);
CREATE INDEX IF NOT EXISTS idx_wallets_state ON core.wallets(state);

CREATE TABLE IF NOT EXISTS core.wallet_state_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id VARCHAR(20) NOT NULL REFERENCES core.wallets(id) ON DELETE CASCADE,
  old_state VARCHAR(20) NOT NULL,
  new_state VARCHAR(20) NOT NULL,
  reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_state_history_wallet ON core.wallet_state_history(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_state_history_created ON core.wallet_state_history(created_at);

CREATE TABLE IF NOT EXISTS core.transactions (
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

CREATE INDEX IF NOT EXISTS idx_transactions_source_wallet ON core.transactions(source_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_destination_wallet ON core.transactions(destination_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_idempotency ON core.transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON core.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON core.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON core.transactions(created_at);

CREATE TABLE IF NOT EXISTS core.fee_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type VARCHAR(30) NOT NULL,
  fee_type VARCHAR(20) NOT NULL CHECK (fee_type IN ('FIXED', 'PERCENTAGE', 'TIERED')),
  fixed_amount DECIMAL(19, 2) CHECK (fixed_amount >= 0),
  percentage DECIMAL(5, 2) CHECK (percentage >= 0 AND percentage <= 100),
  tiers JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_configs_transaction_type ON core.fee_configs(transaction_type);
CREATE INDEX IF NOT EXISTS idx_fee_configs_active ON core.fee_configs(active);

CREATE TABLE IF NOT EXISTS core.commission_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type VARCHAR(30) NOT NULL,
  commission_type VARCHAR(20) NOT NULL CHECK (commission_type IN ('FIXED', 'PERCENTAGE', 'TIERED')),
  fixed_amount DECIMAL(19, 2) CHECK (fixed_amount >= 0),
  percentage DECIMAL(5, 2) CHECK (percentage >= 0 AND percentage <= 100),
  tiers JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_configs_transaction_type ON core.commission_configs(transaction_type);
CREATE INDEX IF NOT EXISTS idx_commission_configs_active ON core.commission_configs(active);

CREATE TABLE IF NOT EXISTS core.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL CHECK (from_currency IN ('KES', 'USD', 'EUR')),
  to_currency VARCHAR(3) NOT NULL CHECK (to_currency IN ('KES', 'USD', 'EUR')),
  rate DECIMAL(19, 8) NOT NULL CHECK (rate > 0),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair ON core.exchange_rates(from_currency, to_currency);

CREATE TABLE IF NOT EXISTS core.exchange_rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(19, 8) NOT NULL,
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_pair ON core.exchange_rate_history(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_created ON core.exchange_rate_history(created_at);

-- =====================================================
-- SECTION 5: LEDGER SCHEMA
-- =====================================================

CREATE TABLE IF NOT EXISTS ledger.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES core.transactions(id) ON DELETE RESTRICT,
  wallet_id VARCHAR(20) NOT NULL REFERENCES core.wallets(id) ON DELETE RESTRICT,
  currency VARCHAR(3) NOT NULL CHECK (currency IN ('KES', 'USD', 'EUR')),
  amount DECIMAL(19, 2) NOT NULL CHECK (amount > 0),
  entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction ON ledger.entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_wallet_currency ON ledger.entries(wallet_id, currency);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_created ON ledger.entries(created_at);

-- =====================================================
-- SECTION 6: AUDIT SCHEMA
-- =====================================================

CREATE TABLE IF NOT EXISTS audit.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  metadata JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entries_entity ON audit.entries(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_entries_actor ON audit.entries(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entries_created ON audit.entries(created_at);

-- =====================================================
-- SECTION 7: SYSTEM ACCOUNTS
-- =====================================================

INSERT INTO auth.users (id, phone, password_hash, role, wallet_id, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'SYSTEM',
  '$2b$12$SYSTEM_ACCOUNT_NO_LOGIN',
  'ADMIN',
  'SYSTEM',
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO core.wallets (id, owner_id, type, state, created_at) VALUES
  ('MPESA_SUSPENSE', '00000000-0000-0000-0000-000000000000', 'SYSTEM', 'ACTIVE', NOW()),
  ('PAYSTACK_SUSPENSE', '00000000-0000-0000-0000-000000000000', 'SYSTEM', 'ACTIVE', NOW()),
  ('AIRTIME_SUSPENSE', '00000000-0000-0000-0000-000000000000', 'SYSTEM', 'ACTIVE', NOW()),
  ('FEE_REVENUE', '00000000-0000-0000-0000-000000000000', 'SYSTEM', 'ACTIVE', NOW()),
  ('COMMISSION_EXPENSE', '00000000-0000-0000-0000-000000000000', 'SYSTEM', 'ACTIVE', NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SECTION 8: SEQUENCES AND FUNCTIONS
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS core.wallet_user_seq START WITH 7770001;
CREATE SEQUENCE IF NOT EXISTS core.wallet_agent_seq START WITH 8880001;

CREATE OR REPLACE FUNCTION core.generate_user_wallet_id()
RETURNS VARCHAR(20) AS $$
BEGIN
  RETURN 'WLT' || LPAD(nextval('core.wallet_user_seq')::TEXT, 7, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION core.generate_agent_wallet_id()
RETURNS VARCHAR(20) AS $$
BEGIN
  RETURN 'AGT' || LPAD(nextval('core.wallet_agent_seq')::TEXT, 7, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON auth.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallets_updated_at ON core.wallets;
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON core.wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

\echo 'Migration 1 completed: Base schema'

\echo ''
\echo '====================================================='
\echo 'MIGRATION 2: NEW FEATURES SCHEMA'
\echo '====================================================='

-- MPESA logs
CREATE TABLE IF NOT EXISTS services.mpesa_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mpesa_receipt VARCHAR(50) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  amount DECIMAL(19, 2) NOT NULL,
  raw_payload JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mpesa_logs_receipt ON services.mpesa_logs(mpesa_receipt);
CREATE INDEX IF NOT EXISTS idx_mpesa_logs_phone ON services.mpesa_logs(phone);

-- SMS logs
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

CREATE INDEX IF NOT EXISTS idx_sms_logs_recipient ON services.sms_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created ON services.sms_logs(created_at);

-- Add verification hash to transactions
ALTER TABLE core.transactions ADD COLUMN IF NOT EXISTS verification_hash VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_wallets_number ON core.wallets(id);

\echo 'Migration 2 completed: New features schema'

\echo ''
\echo '====================================================='
\echo 'MIGRATION 3: RECONCILIATION SCHEMA'
\echo '====================================================='

-- Reconciliation jobs
CREATE TABLE IF NOT EXISTS audit.reconciliation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('MPESA', 'PAYSTACK', 'LEDGER')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_transactions INT DEFAULT 0 CHECK (total_transactions >= 0),
  matched_transactions INT DEFAULT 0 CHECK (matched_transactions >= 0),
  discrepancies_found INT DEFAULT 0 CHECK (discrepancies_found >= 0),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_jobs_type ON audit.reconciliation_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_reconciliation_jobs_status ON audit.reconciliation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_jobs_dates ON audit.reconciliation_jobs(start_date, end_date);

-- Reconciliation discrepancies
CREATE TABLE IF NOT EXISTS audit.reconciliation_discrepancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES audit.reconciliation_jobs(id) ON DELETE CASCADE,
  discrepancy_type VARCHAR(50) NOT NULL CHECK (discrepancy_type IN (
    'MISSING_LEDGER', 'MISSING_PROVIDER', 'AMOUNT_MISMATCH', 'DUPLICATE', 'UNBALANCED', 'BALANCE_MISMATCH'
  )),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  provider VARCHAR(20) CHECK (provider IN ('MPESA', 'PAYSTACK', 'INTERNAL')),
  provider_reference VARCHAR(100),
  transaction_id UUID REFERENCES core.transactions(id),
  expected_amount DECIMAL(19, 2),
  actual_amount DECIMAL(19, 2),
  details JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'INVESTIGATING', 'RESOLVED', 'IGNORED')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discrepancies_job ON audit.reconciliation_discrepancies(job_id);
CREATE INDEX IF NOT EXISTS idx_discrepancies_status ON audit.reconciliation_discrepancies(status);
CREATE INDEX IF NOT EXISTS idx_discrepancies_severity ON audit.reconciliation_discrepancies(severity);

-- Paystack logs
CREATE TABLE IF NOT EXISTS services.paystack_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paystack_reference VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255),
  amount DECIMAL(19, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'KES',
  status VARCHAR(20) NOT NULL,
  gateway_response VARCHAR(255),
  raw_payload JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paystack_logs_reference ON services.paystack_logs(paystack_reference);

\echo 'Migration 3 completed: Reconciliation schema'

\echo ''
\echo '====================================================='
\echo 'DEPLOYMENT COMPLETE'
\echo '====================================================='

SELECT 
  'Deployment completed successfully!' as status,
  now() as completion_time,
  current_database() as database,
  current_user as user;

-- Verification
SELECT 'Schemas created:' as check_type, COUNT(*) as count
FROM information_schema.schemata 
WHERE schema_name IN ('auth', 'core', 'ledger', 'audit', 'services');

SELECT 'Tables created:' as check_type, COUNT(*) as count
FROM pg_tables 
WHERE schemaname IN ('auth', 'core', 'ledger', 'audit', 'services');

SELECT 'System accounts:' as check_type, COUNT(*) as count
FROM core.wallets 
WHERE type = 'SYSTEM';

\echo ''
\echo 'Production database ready for Aban Remit Core Backend!'
