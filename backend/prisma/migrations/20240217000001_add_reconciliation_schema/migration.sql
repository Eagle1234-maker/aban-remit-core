-- =====================================================
-- ABAN REMIT CORE BACKEND - RECONCILIATION SCHEMA
-- =====================================================
-- Migration: Add reconciliation engine schema
-- Date: 2024-02-17
-- Task: 13. Database schema for Reconciliation Engine
-- Requirements: 38.8, 41.4, 42.1
-- Depends on: 20240217000000_init_base_schema, 20240115000001_add_new_features_schema
-- =====================================================

-- =====================================================
-- SECTION 1: RECONCILIATION JOBS TABLE
-- =====================================================

-- Reconciliation jobs table for tracking reconciliation processes
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

-- Indexes for reconciliation jobs
CREATE INDEX IF NOT EXISTS idx_reconciliation_jobs_type ON audit.reconciliation_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_reconciliation_jobs_status ON audit.reconciliation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_jobs_dates ON audit.reconciliation_jobs(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reconciliation_jobs_created ON audit.reconciliation_jobs(created_at);

-- Table comments
COMMENT ON TABLE audit.reconciliation_jobs IS 'Tracks reconciliation job execution and results';
COMMENT ON COLUMN audit.reconciliation_jobs.job_type IS 'Type of reconciliation: MPESA, PAYSTACK, or LEDGER';
COMMENT ON COLUMN audit.reconciliation_jobs.status IS 'Current job status: PENDING, RUNNING, COMPLETED, or FAILED';
COMMENT ON COLUMN audit.reconciliation_jobs.start_date IS 'Start date of reconciliation period (inclusive)';
COMMENT ON COLUMN audit.reconciliation_jobs.end_date IS 'End date of reconciliation period (inclusive)';
COMMENT ON COLUMN audit.reconciliation_jobs.total_transactions IS 'Total number of transactions processed';
COMMENT ON COLUMN audit.reconciliation_jobs.matched_transactions IS 'Number of successfully matched transactions';
COMMENT ON COLUMN audit.reconciliation_jobs.discrepancies_found IS 'Number of discrepancies detected';

-- =====================================================
-- SECTION 2: RECONCILIATION DISCREPANCIES TABLE
-- =====================================================

-- Reconciliation discrepancies table for tracking mismatches and issues
CREATE TABLE IF NOT EXISTS audit.reconciliation_discrepancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES audit.reconciliation_jobs(id) ON DELETE CASCADE,
  discrepancy_type VARCHAR(50) NOT NULL CHECK (discrepancy_type IN (
    'MISSING_LEDGER', 
    'MISSING_PROVIDER', 
    'AMOUNT_MISMATCH', 
    'DUPLICATE', 
    'UNBALANCED', 
    'BALANCE_MISMATCH'
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

-- Indexes for reconciliation discrepancies
CREATE INDEX IF NOT EXISTS idx_discrepancies_job ON audit.reconciliation_discrepancies(job_id);
CREATE INDEX IF NOT EXISTS idx_discrepancies_status ON audit.reconciliation_discrepancies(status);
CREATE INDEX IF NOT EXISTS idx_discrepancies_severity ON audit.reconciliation_discrepancies(severity);
CREATE INDEX IF NOT EXISTS idx_discrepancies_provider ON audit.reconciliation_discrepancies(provider);
CREATE INDEX IF NOT EXISTS idx_discrepancies_created ON audit.reconciliation_discrepancies(created_at);
CREATE INDEX IF NOT EXISTS idx_discrepancies_type ON audit.reconciliation_discrepancies(discrepancy_type);

-- Table comments
COMMENT ON TABLE audit.reconciliation_discrepancies IS 'Records discrepancies found during reconciliation processes';
COMMENT ON COLUMN audit.reconciliation_discrepancies.discrepancy_type IS 'Type of discrepancy detected';
COMMENT ON COLUMN audit.reconciliation_discrepancies.severity IS 'Impact level: CRITICAL (immediate action), HIGH (urgent), MEDIUM (review), LOW (monitor)';
COMMENT ON COLUMN audit.reconciliation_discrepancies.provider IS 'External provider involved in the discrepancy';
COMMENT ON COLUMN audit.reconciliation_discrepancies.provider_reference IS 'External provider transaction reference';
COMMENT ON COLUMN audit.reconciliation_discrepancies.expected_amount IS 'Expected transaction amount';
COMMENT ON COLUMN audit.reconciliation_discrepancies.actual_amount IS 'Actual amount found in records';
COMMENT ON COLUMN audit.reconciliation_discrepancies.details IS 'Additional discrepancy details in JSON format';
COMMENT ON COLUMN audit.reconciliation_discrepancies.status IS 'Resolution status of the discrepancy';

-- =====================================================
-- SECTION 3: PAYSTACK LOGS TABLE (for reconciliation)
-- =====================================================

-- Create Paystack logs table for card payment reconciliation
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

-- Indexes for Paystack logs
CREATE INDEX IF NOT EXISTS idx_paystack_logs_reference ON services.paystack_logs(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_paystack_logs_email ON services.paystack_logs(email);
CREATE INDEX IF NOT EXISTS idx_paystack_logs_created ON services.paystack_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_paystack_logs_status ON services.paystack_logs(status);

-- Table comments
COMMENT ON TABLE services.paystack_logs IS 'Stores all Paystack payment callbacks for reconciliation';
COMMENT ON COLUMN services.paystack_logs.paystack_reference IS 'Unique Paystack transaction reference';
COMMENT ON COLUMN services.paystack_logs.raw_payload IS 'Complete Paystack callback payload for audit trail';

-- =====================================================
-- SECTION 4: CONSTRAINTS AND VALIDATIONS
-- =====================================================

-- Add constraint to ensure matched_transactions <= total_transactions
ALTER TABLE audit.reconciliation_jobs 
ADD CONSTRAINT chk_matched_transactions_valid 
CHECK (matched_transactions <= total_transactions);

-- Add constraint to ensure discrepancies_found >= 0
ALTER TABLE audit.reconciliation_jobs 
ADD CONSTRAINT chk_discrepancies_non_negative 
CHECK (discrepancies_found >= 0);

-- Add constraint to ensure end_date >= start_date
ALTER TABLE audit.reconciliation_jobs 
ADD CONSTRAINT chk_date_range_valid 
CHECK (end_date >= start_date);

-- Add constraint to ensure completed_at is set when status is COMPLETED
-- This is enforced at application level due to PostgreSQL limitations

-- =====================================================
-- SECTION 5: HELPER FUNCTIONS
-- =====================================================

-- Function to calculate match rate for a reconciliation job
CREATE OR REPLACE FUNCTION audit.calculate_match_rate(job_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_txns INT;
  matched_txns INT;
BEGIN
  SELECT total_transactions, matched_transactions 
  INTO total_txns, matched_txns
  FROM audit.reconciliation_jobs 
  WHERE id = job_id;
  
  IF total_txns = 0 THEN
    RETURN 0.00;
  END IF;
  
  RETURN ROUND((matched_txns::DECIMAL / total_txns::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION audit.calculate_match_rate(UUID) IS 'Calculates match rate percentage for a reconciliation job';

-- Function to get discrepancy summary for a job
CREATE OR REPLACE FUNCTION audit.get_discrepancy_summary(job_id UUID)
RETURNS TABLE(
  severity VARCHAR(20),
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.severity,
    COUNT(*) as count
  FROM audit.reconciliation_discrepancies d
  WHERE d.job_id = get_discrepancy_summary.job_id
  GROUP BY d.severity
  ORDER BY 
    CASE d.severity
      WHEN 'CRITICAL' THEN 1
      WHEN 'HIGH' THEN 2
      WHEN 'MEDIUM' THEN 3
      WHEN 'LOW' THEN 4
    END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION audit.get_discrepancy_summary(UUID) IS 'Returns discrepancy count by severity for a reconciliation job';

-- =====================================================
-- SECTION 6: TRIGGERS
-- =====================================================

-- Trigger to automatically update discrepancies_found count
CREATE OR REPLACE FUNCTION audit.update_discrepancies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE audit.reconciliation_jobs 
    SET discrepancies_found = discrepancies_found + 1
    WHERE id = NEW.job_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE audit.reconciliation_jobs 
    SET discrepancies_found = discrepancies_found - 1
    WHERE id = OLD.job_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_discrepancies_count
  AFTER INSERT OR DELETE ON audit.reconciliation_discrepancies
  FOR EACH ROW
  EXECUTE FUNCTION audit.update_discrepancies_count();

COMMENT ON TRIGGER trigger_update_discrepancies_count ON audit.reconciliation_discrepancies IS 'Automatically updates discrepancy count in reconciliation jobs';

-- =====================================================
-- SECTION 7: INITIAL DATA
-- =====================================================

-- Insert initial reconciliation job types configuration (if needed)
-- This can be used for default settings or system configuration

-- =====================================================
-- SECTION 8: PERMISSIONS
-- =====================================================

-- Grant permissions to application role (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aban_app_user') THEN
    -- Grant table permissions
    GRANT SELECT, INSERT, UPDATE ON audit.reconciliation_jobs TO aban_app_user;
    GRANT SELECT, INSERT, UPDATE ON audit.reconciliation_discrepancies TO aban_app_user;
    GRANT SELECT, INSERT, UPDATE ON services.paystack_logs TO aban_app_user;
    
    -- Grant function permissions
    GRANT EXECUTE ON FUNCTION audit.calculate_match_rate(UUID) TO aban_app_user;
    GRANT EXECUTE ON FUNCTION audit.get_discrepancy_summary(UUID) TO aban_app_user;
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Reconciliation schema migration completed successfully';
  RAISE NOTICE 'Tables created: reconciliation_jobs, reconciliation_discrepancies, paystack_logs';
  RAISE NOTICE 'Functions created: calculate_match_rate, get_discrepancy_summary';
  RAISE NOTICE 'Triggers created: update_discrepancies_count';
END $$;