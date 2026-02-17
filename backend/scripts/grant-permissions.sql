-- Grant permissions to user fkmqtves on database fkmqtves_aban_remit
-- Run this as postgres superuser

-- Connect to the database
\c fkmqtves_aban_remit

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE fkmqtves_aban_remit TO fkmqtves;

-- Grant usage on all schemas
GRANT USAGE ON SCHEMA public TO fkmqtves;
GRANT USAGE ON SCHEMA auth TO fkmqtves;
GRANT USAGE ON SCHEMA core TO fkmqtves;
GRANT USAGE ON SCHEMA ledger TO fkmqtves;
GRANT USAGE ON SCHEMA audit TO fkmqtves;
GRANT USAGE ON SCHEMA services TO fkmqtves;

-- Grant all privileges on all tables in schemas
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fkmqtves;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO fkmqtves;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA core TO fkmqtves;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ledger TO fkmqtves;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO fkmqtves;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA services TO fkmqtves;

-- Grant all privileges on all sequences in schemas
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fkmqtves;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO fkmqtves;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA core TO fkmqtves;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ledger TO fkmqtves;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO fkmqtves;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA services TO fkmqtves;

-- Grant default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO fkmqtves;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO fkmqtves;
ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT ALL ON TABLES TO fkmqtves;
ALTER DEFAULT PRIVILEGES IN SCHEMA ledger GRANT ALL ON TABLES TO fkmqtves;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT ALL ON TABLES TO fkmqtves;
ALTER DEFAULT PRIVILEGES IN SCHEMA services GRANT ALL ON TABLES TO fkmqtves;

-- Grant default privileges for future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO fkmqtves;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON SEQUENCES TO fkmqtves;
ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT ALL ON SEQUENCES TO fkmqtves;
ALTER DEFAULT PRIVILEGES IN SCHEMA ledger GRANT ALL ON SEQUENCES TO fkmqtves;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT ALL ON SEQUENCES TO fkmqtves;
ALTER DEFAULT PRIVILEGES IN SCHEMA services GRANT ALL ON SEQUENCES TO fkmqtves;

-- Grant create privilege on schemas
GRANT CREATE ON SCHEMA public TO fkmqtves;
GRANT CREATE ON SCHEMA auth TO fkmqtves;
GRANT CREATE ON SCHEMA core TO fkmqtves;
GRANT CREATE ON SCHEMA ledger TO fkmqtves;
GRANT CREATE ON SCHEMA audit TO fkmqtves;
GRANT CREATE ON SCHEMA services TO fkmqtves;

SELECT 'Permissions granted successfully to user fkmqtves' AS status;
