-- =====================================================
-- ABAN REMIT - COMPLETE SCHEMA DEPLOYMENT (PostgreSQL 10 Compatible)
-- =====================================================
-- Compatible with PostgreSQL 10.23 (no gen_random_uuid)
-- Safe to run in phpPgAdmin or other SQL tools
-- =====================================================

-- Show deployment info
SELECT 
  'Starting deployment to: ' || current_database() as status,
  current_user as "user",
  version() as postgresql_version,
  now() as start_time;

-- =====================================================
-- SECTION 1: UUID GENERATION FUNCTION
-- =====================================================
-- PostgreSQL 10 doesn't have gen_random_uuid() built-in
-- We'll use md5-based UUID generation as fallback

CREATE OR REPLACE FUNCTION generate_uuid() RETURNS UUID AS $$
  SELECT md5(random()::text || clock_timestamp()::text)::uuid;
$$ LANGUAGE SQL;

SELECT 'UUID generation function created' as status;

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

SELECT 'Schemas created' as status;

-- =====================================================
-- SECTION 3: AUTH SCHEMA TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT generate_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON auth.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON auth.users(role);

SELECT 'Auth tables created' as status;

-- =====================================================
-- SECTION 4: CORE SCHEMA TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS core.wallets (
  id UUID PRIMARY KEY DEFAULT generate_uuid(),
  user_id UUID,
  wallet_number VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('USER', 'SYSTEM')),
  state VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (state IN ('ACTIVE', 'SUSPENDED', 'CLOSED')),
  balance NUMERIC(18,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'KES',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON core.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_wallet_number ON core.wallets(wallet_number);
CREATE INDEX IF NOT EXISTS idx_wallets_type ON core.wallets(type);

CREATE TABLE IF NOT EXISTS core.transactions (
  id UUID PRIMARY KEY DEFAULT generate_uuid(),
  idempotency_key VARCHAR(255) UNIQUE,
  from_wallet_id UUID,
  to_wallet_id UUID,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'KES',
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (from_wallet_id) REFERENCES core.wallets(id) ON DELETE SET NULL,
  FOREIGN KEY (to_wallet_id) REFERENCES core.wallets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_from_wallet ON core.transactions(from_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_wallet ON core.transactions(to_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON core.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_idempotency ON core.transactions(idempotency_key);

SELECT 'Core tables created' as status;

-- =====================================================
-- SECTION 5: LEDGER SCHEMA TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS ledger.entries (
  id UUID PRIMARY KEY DEFAULT generate_uuid(),
  transaction_id UUID,
  wallet_id UUID,
  entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  balance_after NUMERIC(18,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'KES',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (transaction_id) REFERENCES core.transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (wallet_id) REFERENCES core.wallets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ledger_transaction ON ledger.entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_wallet ON ledger.entries(wallet_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON ledger.entries(created_at);

SELECT 'Ledger tables created' as status;

-- =====================================================
-- SECTION 6: SERVICES SCHEMA TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS services.mpesa_logs (
  id UUID PRIMARY KEY DEFAULT generate_uuid(),
  transaction_id UUID,
  mpesa_receipt VARCHAR(50) UNIQUE,
  phone_number VARCHAR(20),
  amount NUMERIC(18,2),
  status VARCHAR(50),
  raw_payload JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (transaction_id) REFERENCES core.transactions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_mpesa_transaction ON services.mpesa_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_receipt ON services.mpesa_logs(mpesa_receipt);

CREATE TABLE IF NOT EXISTS services.paystack_logs (
  id UUID PRIMARY KEY DEFAULT generate_uuid(),
  transaction_id UUID,
  paystack_reference VARCHAR(100) UNIQUE,
  email VARCHAR(150),
  amount NUMERIC(18,2),
  status VARCHAR(50),
  gateway_response TEXT,
  raw_payload JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (transaction_id) REFERENCES core.transactions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_paystack_transaction ON services.paystack_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_paystack_reference ON services.paystack_logs(paystack_reference);

CREATE TABLE IF NOT EXISTS services.sms_logs (
  id UUID PRIMARY KEY DEFAULT generate_uuid(),
  phone_number VARCHAR(20),
  message TEXT,
  provider_response TEXT,
  status VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_phone ON services.sms_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_created_at ON services.sms_logs(created_at);

SELECT 'Services tables created' as status;

-- =====================================================
-- SECTION 7: AUDIT SCHEMA TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS audit.system_events (
  id UUID PRIMARY KEY DEFAULT generate_uuid(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit.system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit.system_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit.system_events(created_at);

SELECT 'Audit tables created' as status;

-- =====================================================
-- SECTION 8: SYSTEM WALLETS (REQUIRED)
-- =====================================================

-- Insert system wallets if they don't exist
INSERT INTO core.wallets (wallet_number, type, state, balance, currency)
VALUES 
  ('SYS_MPESA_SUSPENSE', 'SYSTEM', 'ACTIVE', 0.00, 'KES'),
  ('SYS_PAYSTACK_SUSPENSE', 'SYSTEM', 'ACTIVE', 0.00, 'KES'),
  ('SYS_AIRTIME_SUSPENSE', 'SYSTEM', 'ACTIVE', 0.00, 'KES'),
  ('SYS_FEE_REVENUE', 'SYSTEM', 'ACTIVE', 0.00, 'KES'),
  ('SYS_COMMISSION_EXPENSE', 'SYSTEM', 'ACTIVE', 0.00, 'KES')
ON CONFLICT (wallet_number) DO NOTHING;

SELECT 'System wallets created' as status;

-- =====================================================
-- DEPLOYMENT COMPLETE
-- =====================================================

SELECT 
  'Deployment completed successfully!' as status,
  current_database() as database,
  current_user as "user",
  now() as completion_time;

-- Verify deployment
SELECT 
  schema_name,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = schema_name) as table_count
FROM information_schema.schemata 
WHERE schema_name IN ('auth', 'core', 'ledger', 'audit', 'services')
ORDER BY schema_name;
