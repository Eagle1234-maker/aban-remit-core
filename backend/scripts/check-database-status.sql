-- Check database status and schemas
\c fkmqtves_aban_remit

-- Check if schemas exist
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('auth', 'core', 'ledger', 'audit', 'services', 'public')
ORDER BY schema_name;

-- Check tables in each schema
SELECT schemaname, COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname IN ('auth', 'core', 'ledger', 'audit', 'services', 'public')
GROUP BY schemaname
ORDER BY schemaname;

-- Check current user and database
SELECT current_user, current_database();

-- Check user privileges
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE grantee = 'fkmqtves'
LIMIT 10;
