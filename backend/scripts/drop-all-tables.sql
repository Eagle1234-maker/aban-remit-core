-- =====================================================
-- DROP ALL TABLES AND SCHEMAS
-- =====================================================
-- WARNING: This will delete ALL data!
-- Only run this if you want to start fresh
-- =====================================================

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS audit.system_events CASCADE;
DROP TABLE IF EXISTS services.sms_logs CASCADE;
DROP TABLE IF EXISTS services.paystack_logs CASCADE;
DROP TABLE IF EXISTS services.mpesa_logs CASCADE;
DROP TABLE IF EXISTS ledger.entries CASCADE;
DROP TABLE IF EXISTS core.transactions CASCADE;
DROP TABLE IF EXISTS core.wallets CASCADE;
DROP TABLE IF EXISTS auth.users CASCADE;

-- Drop schemas
DROP SCHEMA IF EXISTS audit CASCADE;
DROP SCHEMA IF EXISTS services CASCADE;
DROP SCHEMA IF EXISTS ledger CASCADE;
DROP SCHEMA IF EXISTS core CASCADE;
DROP SCHEMA IF EXISTS auth CASCADE;

SELECT 'All tables and schemas dropped successfully' as status;
