# Database Schema Reference

## Overview

The Aban Remit Core Backend uses PostgreSQL with two schemas:
- **core**: Main application tables
- **services**: Service-specific logging and tracking tables

## Services Schema

### services.mpesa_logs

Stores all MPESA deposit callbacks for audit and idempotency.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| mpesa_receipt | VARCHAR(50) | UNIQUE, NOT NULL | MPESA transaction receipt (e.g., "MPE123456") |
| phone | VARCHAR(20) | NOT NULL | Sender phone number (e.g., "+254712345678") |
| amount | DECIMAL(19,2) | NOT NULL | Transaction amount |
| raw_payload | JSONB | NOT NULL | Complete MPESA callback payload |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

**Indexes:**
- `idx_mpesa_logs_receipt` on `mpesa_receipt` - Fast duplicate checking
- `idx_mpesa_logs_phone` on `phone` - Phone number queries

**Purpose:**
- Prevent duplicate MPESA deposits (idempotency via unique receipt)
- Audit trail for reconciliation
- Raw payload storage for debugging

**Example Query:**
```sql
-- Check if MPESA receipt already processed
SELECT id FROM services.mpesa_logs 
WHERE mpesa_receipt = 'MPE123456';

-- Get all deposits for a phone number
SELECT * FROM services.mpesa_logs 
WHERE phone = '+254712345678'
ORDER BY created_at DESC;
```

### services.sms_logs

Tracks all SMS notifications for cost analysis and audit.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| recipient | VARCHAR(20) | NOT NULL | Phone number of recipient |
| message | TEXT | NOT NULL | SMS message content |
| cost | DECIMAL(10,4) | NULL | Cost in local currency |
| status | VARCHAR(20) | NOT NULL, CHECK (status IN ('SENT', 'FAILED', 'PENDING')) | Delivery status |
| provider_message_id | VARCHAR(255) | NULL | SMS provider's message ID |
| error_message | TEXT | NULL | Error details if failed |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

**Indexes:**
- `idx_sms_logs_recipient` on `recipient` - Recipient lookups
- `idx_sms_logs_created` on `created_at` - Date range queries

**Purpose:**
- Cost tracking and expense reporting
- Delivery status monitoring
- Audit trail for compliance
- Debugging failed deliveries

**Example Queries:**
```sql
-- Calculate total SMS cost for a date range
SELECT 
  COUNT(*) as total_messages,
  SUM(cost) as total_cost,
  COUNT(CASE WHEN status = 'SENT' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed
FROM services.sms_logs
WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31';

-- Get failed SMS for investigation
SELECT * FROM services.sms_logs
WHERE status = 'FAILED'
ORDER BY created_at DESC
LIMIT 100;

-- SMS delivery rate by day
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'SENT' THEN 1 END) as sent,
  ROUND(100.0 * COUNT(CASE WHEN status = 'SENT' THEN 1 END) / COUNT(*), 2) as success_rate
FROM services.sms_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Core Schema Modifications

### core.transactions

Added column for receipt verification.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| verification_hash | VARCHAR(64) | NULL | SHA256 hash for receipt verification |

**Hash Calculation:**
```typescript
SHA256(reference + amount + created_at)
```

**Purpose:**
- Receipt authenticity verification
- Tamper detection
- Fraud prevention

**Example:**
```sql
-- Calculate verification hash (PostgreSQL)
UPDATE core.transactions
SET verification_hash = encode(
  digest(
    id::text || amount::text || created_at::text,
    'sha256'
  ),
  'hex'
)
WHERE verification_hash IS NULL;

-- Verify receipt hash
SELECT 
  id,
  verification_hash,
  encode(
    digest(
      id::text || amount::text || created_at::text,
      'sha256'
    ),
    'hex'
  ) as calculated_hash,
  verification_hash = encode(
    digest(
      id::text || amount::text || created_at::text,
      'sha256'
    ),
    'hex'
  ) as is_valid
FROM core.transactions
WHERE id = 'transaction-uuid';
```

### core.wallets

Added index for fast lookups.

**Index:**
- `idx_wallets_number` on `id` - Fast wallet number lookups

**Purpose:**
- Optimize wallet lookup API endpoint
- Improve transfer confirmation performance

**Example:**
```sql
-- Fast wallet lookup (uses index)
SELECT id, owner_id, type, state
FROM core.wallets
WHERE id = 'WLT7770001';

-- Lookup with EXPLAIN to verify index usage
EXPLAIN ANALYZE
SELECT * FROM core.wallets WHERE id = 'WLT7770001';
```

## Data Types

### DECIMAL Precision

- **Amount fields**: DECIMAL(19,2) - Up to 999,999,999,999,999.99
- **Cost fields**: DECIMAL(10,4) - Up to 999,999.9999 (for SMS costs)

### UUID Generation

All tables use PostgreSQL's `gen_random_uuid()` for primary keys:
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

### JSONB Storage

MPESA raw payloads stored as JSONB for:
- Efficient querying
- Indexing support
- Flexible schema

**Example JSONB Query:**
```sql
-- Query specific field in raw_payload
SELECT 
  mpesa_receipt,
  raw_payload->>'TransactionType' as transaction_type,
  raw_payload->>'TransAmount' as amount
FROM services.mpesa_logs
WHERE raw_payload->>'ResultCode' = '0';
```

## Performance Considerations

### Index Usage

All indexes use `IF NOT EXISTS` to allow safe re-runs:
```sql
CREATE INDEX IF NOT EXISTS idx_name ON table(column);
```

### Query Optimization

1. **MPESA Duplicate Check**: O(1) lookup via unique index
2. **SMS Cost Reports**: Optimized via `created_at` index
3. **Wallet Lookups**: Direct index scan on primary key

### Maintenance

```sql
-- Analyze tables for query planner
ANALYZE services.mpesa_logs;
ANALYZE services.sms_logs;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname IN ('core', 'services')
ORDER BY idx_scan DESC;
```

## Backup and Recovery

### Backup Services Schema

```bash
# Backup services schema only
pg_dump -U postgres -d aban_remit -n services -F c -f services_backup.dump

# Restore services schema
pg_restore -U postgres -d aban_remit -n services services_backup.dump
```

### Export Data

```bash
# Export MPESA logs to CSV
psql -U postgres -d aban_remit -c "\COPY services.mpesa_logs TO 'mpesa_logs.csv' CSV HEADER"

# Export SMS logs to CSV
psql -U postgres -d aban_remit -c "\COPY services.sms_logs TO 'sms_logs.csv' CSV HEADER"
```

## Security

### Row-Level Security (Optional)

```sql
-- Enable RLS on sensitive tables
ALTER TABLE services.mpesa_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE services.sms_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (example)
CREATE POLICY mpesa_logs_policy ON services.mpesa_logs
  FOR SELECT
  USING (true); -- Adjust based on your auth system
```

### Audit Logging

All tables include `created_at` for audit trails. Consider adding:
- `updated_at` for modification tracking
- `updated_by` for user tracking
- Trigger-based audit logs

## Migration History

| Version | Date | Description |
|---------|------|-------------|
| 20240115000001 | 2024-01-15 | Add new features schema (MPESA logs, SMS logs, verification hash) |

## Related Documentation

- [Setup Guide](../SETUP.md)
- [Migration README](../prisma/migrations/20240115000001_add_new_features_schema/README.md)
- [Design Document](../../.kiro/specs/aban-remit-core-backend/design.md)
- [Requirements](../../.kiro/specs/aban-remit-core-backend/requirements.md)
