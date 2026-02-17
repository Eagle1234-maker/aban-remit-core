-- Grant permissions to user fkmqtves on database fkmqtves_aban_remit
-- This version attempts to grant what permissions are available to the current user

-- Connect to the database
\c fkmqtves_aban_remit

-- Try to grant permissions on schemas (if we have them)
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

SELECT 'Attempted to grant permissions to user fkmqtves' AS status;
