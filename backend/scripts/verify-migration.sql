-- Verification script for migration 20240115000001_add_new_features_schema
-- Run this after applying the migration to verify all changes were applied correctly

\echo '=== Verifying Migration: Add New Features Schema ==='
\echo ''

-- Check if services schema exists
\echo 'Checking services schema...'
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'services')
    THEN '✓ services schema exists'
    ELSE '✗ services schema NOT FOUND'
  END AS status;

\echo ''

-- Check if mpesa_logs table exists
\echo 'Checking services.mpesa_logs table...'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'services' AND table_name = 'mpesa_logs'
    )
    THEN '✓ services.mpesa_logs table exists'
    ELSE '✗ services.mpesa_logs table NOT FOUND'
  END AS status;

-- Check mpesa_logs columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'services' AND table_name = 'mpesa_logs'
ORDER BY ordinal_position;

\echo ''

-- Check if sms_logs table exists
\echo 'Checking services.sms_logs table...'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'services' AND table_name = 'sms_logs'
    )
    THEN '✓ services.sms_logs table exists'
    ELSE '✗ services.sms_logs table NOT FOUND'
  END AS status;

-- Check sms_logs columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'services' AND table_name = 'sms_logs'
ORDER BY ordinal_position;

\echo ''

-- Check if verification_hash column exists in transactions
\echo 'Checking core.transactions.verification_hash column...'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'core' 
      AND table_name = 'transactions' 
      AND column_name = 'verification_hash'
    )
    THEN '✓ verification_hash column exists'
    ELSE '✗ verification_hash column NOT FOUND (core.transactions table may not exist yet)'
  END AS status;

\echo ''

-- Check indexes
\echo 'Checking indexes...'
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname IN ('core', 'services') 
AND indexname IN (
  'idx_mpesa_logs_receipt',
  'idx_mpesa_logs_phone',
  'idx_sms_logs_recipient',
  'idx_sms_logs_created',
  'idx_wallets_number'
)
ORDER BY schemaname, tablename, indexname;

\echo ''

-- Check constraints
\echo 'Checking constraints...'
SELECT 
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'services'
AND tc.table_name IN ('mpesa_logs', 'sms_logs')
ORDER BY tc.table_name, tc.constraint_type;

\echo ''
\echo '=== Verification Complete ==='
