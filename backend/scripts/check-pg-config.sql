-- =====================================================
-- CHECK POSTGRESQL CONFIGURATION
-- =====================================================
-- Run this in your database tool to find config files
-- and check current authentication settings
-- =====================================================

-- 1. Find configuration file locations
SELECT 'Configuration file locations:' as info;
SHOW config_file;
SHOW hba_file;
SHOW data_directory;

-- 2. Check current authentication settings
SELECT 'Current HBA rules:' as info;
SELECT line_number, type, database, user_name, address, auth_method 
FROM pg_hba_file_rules 
ORDER BY line_number;

-- 3. Check if PostgreSQL is listening on TCP
SELECT 'Network settings:' as info;
SHOW listen_addresses;
SHOW port;

-- 4. Check current user and database
SELECT 'Current connection info:' as info;
SELECT current_user, current_database(), inet_server_addr(), inet_server_port();

-- 5. Verify fkmqtves user exists and can authenticate
SELECT 'User information:' as info;
SELECT usename, usecreatedb, usesuper, userepl 
FROM pg_user 
WHERE usename = 'fkmqtves';

-- =====================================================
-- INSTRUCTIONS:
-- =====================================================
-- After running this script, you'll see:
-- 1. The path to pg_hba.conf file
-- 2. Current authentication rules
-- 3. Whether PostgreSQL accepts TCP connections
--
-- You need to:
-- 1. Access the server where PostgreSQL is running
-- 2. Edit the pg_hba.conf file shown above
-- 3. Add the line:
--    host    fkmqtves_aban_remit    fkmqtves    127.0.0.1/32    md5
-- 4. Reload PostgreSQL configuration
-- =====================================================
