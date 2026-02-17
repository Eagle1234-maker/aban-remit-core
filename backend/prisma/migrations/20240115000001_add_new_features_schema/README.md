# Migration: Add New Features Schema

**Date**: 2024-01-15  
**Task**: 1. Database schema updates for new features  
**Requirements**: 31.6, 32.2, 36.1

## Overview

This migration adds database schema support for:
1. Wallet lookup functionality
2. MPESA deposit logging and idempotency
3. SMS notification logging and cost tracking
4. Receipt generation with verification hashes

## Changes

### New Tables

#### services.mpesa_logs
Stores all MPESA deposit callbacks for audit trail and duplicate detection.

**Columns**:
- `id` (UUID, PK) - Unique identifier
- `mpesa_receipt` (VARCHAR(50), UNIQUE) - MPESA transaction receipt number
- `phone` (VARCHAR(20)) - Sender phone number
- `amount` (DECIMAL(19,2)) - Transaction amount
- `raw_payload` (JSONB) - Complete MPESA callback payload
- `created_at` (TIMESTAMP) - Record creation timestamp

**Indexes**:
- `idx_mpesa_logs_receipt` - Fast receipt lookups for idempotency checks
- `idx_mpesa_logs_phone` - Phone number queries for reconciliation

**Purpose**: 
- Prevent duplicate MPESA deposits (idempotency)
- Audit trail for all MPESA transactions
- Reconciliation with MPESA statements

#### services.sms_logs
Tracks all SMS notifications sent by the system.

**Columns**:
- `id` (UUID, PK) - Unique identifier
- `recipient` (VARCHAR(20)) - Phone number of recipient
- `message` (TEXT) - SMS message content
- `cost` (DECIMAL(10,4)) - Cost in local currency
- `status` (VARCHAR(20)) - SENT, FAILED, or PENDING
- `provider_message_id` (VARCHAR(255)) - SMS provider's message ID
- `error_message` (TEXT) - Error details if failed
- `created_at` (TIMESTAMP) - Record creation timestamp

**Indexes**:
- `idx_sms_logs_recipient` - Recipient lookups
- `idx_sms_logs_created` - Date range queries for cost reports

**Purpose**:
- Cost tracking and expense reporting
- Delivery status monitoring
- Audit trail for all notifications
- Debugging failed SMS deliveries

### Schema Modifications

#### core.transactions
Added `verification_hash` column for receipt verification.

**Column**:
- `verification_hash` (VARCHAR(64)) - SHA256 hash for receipt authenticity

**Purpose**:
- Receipt verification
- Fraud prevention
- Tamper detection

**Hash Calculation**:
```
SHA256(reference + amount + created_at)
```

### New Indexes

#### idx_wallets_number
Index on `core.wallets(id)` for fast wallet number lookups.

**Purpose**:
- Optimize wallet lookup API endpoint
- Improve transfer confirmation performance

## Prerequisites

This migration assumes the following tables exist in the `core` schema:
- `core.transactions`
- `core.wallets`

These tables should have been created by the base schema migration.

## Rollback

To rollback this migration:

```sql
-- Drop indexes
DROP INDEX IF EXISTS services.idx_mpesa_logs_receipt;
DROP INDEX IF EXISTS services.idx_mpesa_logs_phone;
DROP INDEX IF EXISTS services.idx_sms_logs_recipient;
DROP INDEX IF EXISTS services.idx_sms_logs_created;
DROP INDEX IF EXISTS core.idx_wallets_number;

-- Drop tables
DROP TABLE IF EXISTS services.sms_logs;
DROP TABLE IF EXISTS services.mpesa_logs;

-- Remove column
ALTER TABLE core.transactions DROP COLUMN IF EXISTS verification_hash;

-- Drop schema if empty
DROP SCHEMA IF EXISTS services CASCADE;
```

## Verification

After applying the migration, verify:

1. Tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'services' 
AND table_name IN ('mpesa_logs', 'sms_logs');
```

2. Indexes exist:
```sql
SELECT indexname FROM pg_indexes 
WHERE schemaname IN ('core', 'services') 
AND indexname LIKE 'idx_%';
```

3. Column added:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'core' 
AND table_name = 'transactions' 
AND column_name = 'verification_hash';
```

## Performance Impact

- **Minimal**: All indexes are created with `IF NOT EXISTS` to avoid errors on re-run
- **Index creation**: May take a few seconds on large existing datasets
- **No data migration**: This is a pure schema change with no data transformation

## Related Tasks

This migration supports the following implementation tasks:
- Task 2: Implement Wallet Lookup Engine
- Task 3: Implement MPESA deposit logging and idempotency
- Task 6: Implement Receipt Generation Engine
- Task 9: Implement SMS logging and cost tracking
