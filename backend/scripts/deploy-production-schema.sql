-- =====================================================
-- ABAN REMIT PRODUCTION SCHEMA DEPLOYMENT SCRIPT
-- =====================================================
-- This script applies all database migrations in the correct order
-- for production deployment to fkmqtves_aban_remit database
-- 
-- PostgreSQL Version: 10.23+
-- Database: fkmqtves_aban_remit
-- User: fkmqtves
-- 
-- Usage:
-- psql -U fkmqtves -d fkmqtves_aban_remit -f deploy-production-schema.sql
-- =====================================================

-- Set error handling
\set ON_ERROR_STOP on

-- Display connection info
SELECT 
  current_database() as database,
  current_user as user,
  version() as postgresql_version,
  now() as deployment_time;

-- =====================================================
-- MIGRATION 1: BASE SCHEMA
-- =====================================================
\echo 'Applying Migration 1: Base Schema (20240217000000_init_base_schema)'

\i ../prisma/migrations/20240217000000_init_base_schema/migration.sql

\echo 'Migration 1 completed successfully'

-- =====================================================
-- MIGRATION 2: NEW FEATURES SCHEMA  
-- =====================================================
\echo 'Applying Migration 2: New Features Schema (20240115000001_add_new_features_schema)'

\i ../prisma/migrations/20240115000001_add_new_features_schema/migration.sql

\echo 'Migration 2 completed successfully'

-- =====================================================
-- MIGRATION 3: RECONCILIATION SCHEMA
-- =====================================================
\echo 'Applying Migration 3: Reconciliation Schema (20240217000001_add_reconciliation_schema)'

\i ../prisma/migrations/20240217000001_add_reconciliation_schema/migration.sql

\echo 'Migration 3 completed successfully'

-- =====================================================
-- VERIFICATION CHECKS
-- =====================================================
\echo 'Running verification checks...'

-- Check schemas exist
SELECT 'Schemas:' as check_type, schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('auth', 'core', 'ledger', 'audit', 'services')
ORDER BY schema_name;

-- Check table counts by schema
SELECT 
  'Table counts:' as check_type,
  schemaname as schema,
  COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname IN ('auth', 'core', 'ledger', 'audit', 'services')
GROUP BY schemaname
ORDER BY schemaname;

-- Check system accounts exist
SELECT 'System accounts:' as check_type, id, type, state 
FROM core.wallets 
WHERE type = 'SYSTEM'
ORDER BY id;

-- Check sequences initialized
SELECT 
  'Sequences:' as check_type,
  sequence_name,
  last_value
FROM information_schema.sequences 
WHERE sequence_schema = 'core'
ORDER BY sequence_name;

-- Check extensions enabled
SELECT 'Extensions:' as check_type, extname as extension_name
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto')
ORDER BY extname;

-- Check functions exist
SELECT 
  'Functions:' as check_type,
  routine_schema as schema,
  routine_name as function_name
FROM information_schema.routines
WHERE routine_schema IN ('core', 'audit')
AND routine_type = 'FUNCTION'
ORDER BY routine_schema, routine_name;

-- Check triggers exist
SELECT 
  'Triggers:' as check_type,
  event_object_schema as schema,
  event_object_table as table_name,
  trigger_name
FROM information_schema.triggers
WHERE event_object_schema IN ('auth', 'core', 'audit')
ORDER BY event_object_schema, event_object_table, trigger_name;

-- =====================================================
-- DEPLOYMENT SUMMARY
-- =====================================================
\echo 'Deployment completed successfully!'
\echo ''
\echo 'Summary:'
\echo '- Base schema with 5 schemas and 13 core tables'
\echo '- New features: MPESA logs, SMS logs, receipt verification'
\echo '- Reconciliation engine: Jobs, discrepancies, Paystack logs'
\echo '- System accounts: 5 suspense and revenue accounts'
\echo '- Wallet ID sequences: WLT7770001+, AGT8880001+'
\echo '- Extensions: uuid-ossp, pgcrypto'
\echo '- Helper functions and triggers installed'
\echo ''
\echo 'Next steps:'
\echo '1. Update .env with production DATABASE_URL'
\echo '2. Run: npm run prisma:generate'
\echo '3. Test database connection'
\echo '4. Initialize default fee/commission configs'
\echo '5. Set up automated backups'
\echo ''
\echo 'Production database ready for Aban Remit Core Backend!'

-- Display final connection info
SELECT 
  'Deployment completed at:' as status,
  now() as timestamp,
  current_database() as database,
  current_user as user;