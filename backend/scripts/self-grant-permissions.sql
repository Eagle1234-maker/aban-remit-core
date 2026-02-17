-- Self-grant permissions for user fkmqtves
-- Run this while logged in as fkmqtves (if you have the necessary privileges)
-- Or run as a superuser to grant permissions to fkmqtves

-- First, let's check what we have access to
SELECT current_user, current_database();

-- Check existing schemas
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name IN ('public', 'auth', 'core', 'ledger', 'audit', 'services')
ORDER BY schema_name;

-- If you're a superuser or have GRANT privileges, run these:
-- (If these fail, you'll need to run them as postgres superuser)

-- Grant usage on public schema
GRANT USAGE, CREATE ON SCHEMA public TO fkmqtves;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fkmqtves;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fkmqtves;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO fkmqtves;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO fkmqtves;

-- If other schemas exist, grant on them too
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        GRANT USAGE, CREATE ON SCHEMA auth TO fkmqtves;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO fkmqtves;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO fkmqtves;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'core') THEN
        GRANT USAGE, CREATE ON SCHEMA core TO fkmqtves;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA core TO fkmqtves;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA core TO fkmqtves;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'ledger') THEN
        GRANT USAGE, CREATE ON SCHEMA ledger TO fkmqtves;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ledger TO fkmqtves;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ledger TO fkmqtves;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'audit') THEN
        GRANT USAGE, CREATE ON SCHEMA audit TO fkmqtves;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO fkmqtves;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO fkmqtves;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'services') THEN
        GRANT USAGE, CREATE ON SCHEMA services TO fkmqtves;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA services TO fkmqtves;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA services TO fkmqtves;
    END IF;
END $$;

SELECT 'Permissions granted successfully!' AS status;
