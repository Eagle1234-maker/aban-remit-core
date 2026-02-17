# Migration: Initialize Base Schema

**Date**: 2024-02-17  
**PostgreSQL Version**: 10.23+  
**Database**: fkmqtves_aban_remit  
**Migration Type**: Base Schema Initialization

## Overview

This is the foundational migration that creates the complete database schema for the Aban Remit Core Backend. It establishes a multi-schema architecture with double-entry accounting, comprehensive audit trails, and production-ready security settings.

## Production Environment

**Connection Details**:
- Host: localhost
- Port: 5432
- Database: fkmqtves_aban_remit
- User: fkmqtves
- Socket: /var/run/postgresql (if using Unix socket)
- PostgreSQL Version: 10.23

**Connection String**:
```
postgresql://fkmqtves:PASSWORD@localhost:5432/fkmqtves_aban_remit?schema=public
```

## Architecture

### Multi-Schema Design

The database is organized into 5 logical schemas:

| Schema   | Purpose                                    | Tables                                                      |
|----------|--------------------------------------------|------------------------------------------------------------|
| `auth`   | Authentication & authorization             | users, otps, devices, token_blacklist                      |
| `core`   | Core business entities                     | wallets, transactions, fee_configs, commission_configs, exchange_rates |
| `ledger` | Double-entry accounting                    | entries                                                    |
| `audit`  | Compliance and audit trail                 | entries                                                    |
| `services` | External service integration logs        | (created in subsequent migrations)                         |

### Why Multi-Schema?

1. **Logical Separation**: Clear boundaries between different concerns
2. **Security**: Granular permission control per schema
3. **Maintainability**: Easier to understand and navigate
4. **Performance**: Better query planning and indexing strategies
5. **Compliance**: Audit data isolated from operational data

## Database Objects Created

### Extensions

- `uuid-ossp`: UUID generation functions
- `pgcrypto`: Cryptographic functions (SHA256 for receipt verification)

### Schemas

- `auth`: Authentication and user management
- `core`: Core business logic
- `ledger`: Financial ledger entries
- `audit`: System audit trail
- `services`: External service logs

### Tables

#### Auth Schema (4 tables)

1. **auth.users**
   - Primary user table for customers, agents, and admins
   - Stores bcrypt password hashes (12+ rounds)
   - Links to wallet via wallet_id
   - Columns: id, phone, password_hash, role, wallet_id, created_at, updated_at

2. **auth.otps**
   - One-time passwords for authentication
   - 6-digit codes with 5-minute expiry
   - Columns: id, user_id, code, expires_at, verified, created_at

3. **auth.devices**
   - Multi-device support tracking
   - Device fingerprinting for security
   - Columns: id, user_id, device_fingerprint, ip_address, user_agent, first_seen_at, last_active_at

4. **auth.token_blacklist**
   - Invalidated JWT tokens
   - Auto-cleanup after expiry
   - Columns: id, token_hash, expires_at, created_at

#### Core Schema (7 tables)

1. **core.wallets**
   - Multi-currency digital wallets
   - Supports USER, AGENT, and SYSTEM types
   - States: ACTIVE, LOCKED, FROZEN, SUSPENDED
   - Columns: id, owner_id, type, state, created_at, updated_at

2. **core.wallet_state_history**
   - Audit trail for wallet state changes
   - Records admin actions and reasons
   - Columns: id, wallet_id, old_state, new_state, reason, changed_by, created_at

3. **core.transactions**
   - All financial transactions
   - Idempotency support via idempotency_key
   - Columns: id, type, status, source_wallet_id, destination_wallet_id, currency, amount, fee, commission, exchange_rate, idempotency_key, metadata, created_at, completed_at

4. **core.fee_configs**
   - Configurable transaction fees
   - Supports FIXED, PERCENTAGE, and TIERED fee types
   - Columns: id, transaction_type, fee_type, fixed_amount, percentage, tiers, active, created_by, created_at

5. **core.commission_configs**
   - Agent commission structures
   - Same flexibility as fee configs
   - Columns: id, transaction_type, commission_type, fixed_amount, percentage, tiers, active, created_by, created_at

6. **core.exchange_rates**
   - Current FX rates for currency conversion
   - Supports KES, USD, EUR
   - Columns: id, from_currency, to_currency, rate, updated_by, created_at

7. **core.exchange_rate_history**
   - Historical exchange rates for audit
   - Columns: id, from_currency, to_currency, rate, updated_by, created_at

#### Ledger Schema (1 table)

1. **ledger.entries**
   - Immutable double-entry ledger
   - Every transaction creates paired DEBIT/CREDIT entries
   - Balance = SUM(CREDIT) - SUM(DEBIT)
   - Columns: id, transaction_id, wallet_id, currency, amount, entry_type, description, created_at

#### Audit Schema (1 table)

1. **audit.entries**
   - Immutable audit trail
   - Logs all critical system operations
   - Columns: id, entity_type, entity_id, action, actor_id, metadata, ip_address, created_at

### System Accounts

Five special system wallets are created for internal accounting:

| Wallet ID            | Purpose                                    |
|----------------------|--------------------------------------------|
| MPESA_SUSPENSE       | Holds funds in transit from MPESA         |
| PAYSTACK_SUSPENSE    | Holds funds in transit from Paystack      |
| AIRTIME_SUSPENSE     | Holds funds for airtime purchases         |
| FEE_REVENUE          | Accumulates transaction fees collected    |
| COMMISSION_EXPENSE   | Tracks agent commissions paid             |

These accounts are owned by a system user (ID: 00000000-0000-0000-0000-000000000000).

### Sequences

- `core.wallet_user_seq`: Generates user wallet IDs (WLT7770001, WLT7770002, ...)
- `core.wallet_agent_seq`: Generates agent wallet IDs (AGT8880001, AGT8880002, ...)

### Functions

- `core.generate_user_wallet_id()`: Returns next user wallet ID
- `core.generate_agent_wallet_id()`: Returns next agent wallet ID
- `update_updated_at_column()`: Trigger function for updated_at timestamps

### Indexes

**Performance-critical indexes created**:

- User lookups: phone, wallet_id, role
- Wallet queries: owner_id, type, state
- Transaction queries: source/destination wallets, idempotency_key, type, status, created_at
- Ledger queries: transaction_id, wallet_id+currency, created_at
- Audit queries: entity_type+entity_id, actor_id, created_at
- OTP lookups: user_id, expires_at
- Device tracking: user_id, device_fingerprint

## Double-Entry Accounting

### Principles

1. **Every transaction creates exactly 2 ledger entries**: one DEBIT and one CREDIT
2. **Amounts must balance**: DEBIT amount = CREDIT amount (in same currency)
3. **Entries are immutable**: No updates or deletes allowed
4. **Reversals create new entries**: Offsetting entries for corrections
5. **Balances are derived**: Never stored directly, always calculated from ledger

### Balance Calculation

```sql
-- Calculate wallet balance for a currency
SELECT 
  SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END) -
  SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END) AS balance
FROM ledger.entries
WHERE wallet_id = 'WLT7770001' AND currency = 'KES';
```

### Example Transaction Flow

**Deposit 1000 KES to user wallet**:

1. Create transaction record (status: PENDING)
2. Create ledger entries:
   - DEBIT MPESA_SUSPENSE 1000 KES
   - CREDIT WLT7770001 1000 KES
3. Update transaction status to COMPLETED

## Security Features

### Password Security

- bcrypt hashing with minimum 12 rounds
- No plain text passwords stored
- Password hashes never returned in API responses

### Token Management

- JWT tokens with 15-minute expiry
- Token blacklist for logout
- Automatic cleanup of expired tokens

### Multi-Device Support

- Device fingerprinting
- IP address tracking
- Automatic revocation of oldest device after 5 devices

### Audit Trail

- All authentication attempts logged
- All wallet state changes logged
- All admin actions logged
- Immutable audit entries

## Data Types

### Monetary Values

All monetary amounts use `DECIMAL(19, 2)`:
- 19 total digits
- 2 decimal places
- Supports up to 99,999,999,999,999,999.99
- No floating-point precision issues

### Exchange Rates

Exchange rates use `DECIMAL(19, 8)`:
- 8 decimal places for precision
- Supports micro-currency conversions

### Timestamps

All timestamps use PostgreSQL `TIMESTAMP`:
- Timezone set to UTC
- Automatic NOW() defaults
- Immutable for audit tables

## Constraints

### Check Constraints

- User roles: USER, AGENT, ADMIN
- Wallet types: USER, AGENT, SYSTEM
- Wallet states: ACTIVE, LOCKED, FROZEN, SUSPENDED
- Transaction statuses: PENDING, COMPLETED, FAILED, REVERSED
- Currencies: KES, USD, EUR
- Ledger entry types: DEBIT, CREDIT
- Fee/commission types: FIXED, PERCENTAGE, TIERED
- Amounts: Always positive (> 0)

### Foreign Key Constraints

- Cascading deletes for dependent data (OTPs, devices)
- Restrict deletes for financial data (ledger entries, transactions)
- Referential integrity enforced at database level

### Unique Constraints

- User phone numbers
- User wallet IDs
- Transaction idempotency keys
- MPESA receipts (in subsequent migration)
- Exchange rate currency pairs

## Performance Considerations

### Indexing Strategy

- Composite indexes for common query patterns
- Covering indexes for frequently accessed columns
- Partial indexes for filtered queries (active configs)

### Query Optimization

- Indexes on foreign keys for join performance
- Indexes on timestamp columns for date range queries
- Indexes on status/state columns for filtering

### Connection Pooling

Recommended settings for Node.js application:
```javascript
{
  max: 10,                    // Max connections
  idleTimeoutMillis: 30000,   // 30 seconds
  connectionTimeoutMillis: 2000 // 2 seconds
}
```

## Backup Strategy

### Recommended Approach

1. **Daily logical backups**:
   ```bash
   pg_dump fkmqtves_aban_remit > backup_$(date +%Y%m%d).sql
   ```

2. **Off-server storage**: S3 or external backup service

3. **Retention policy**: 30 days minimum

4. **Test restores**: Monthly verification

## Migration Execution

### Prerequisites

1. PostgreSQL 10.23+ installed
2. Database `fkmqtves_aban_remit` created
3. User `fkmqtves` has CREATE privileges
4. Extensions `uuid-ossp` and `pgcrypto` available

### Apply Migration

```bash
# Using psql
psql -U fkmqtves -d fkmqtves_aban_remit -f migration.sql

# Using Prisma
npx prisma migrate deploy
```

### Verification

```sql
-- Check schemas exist
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name IN ('auth', 'core', 'ledger', 'audit', 'services');

-- Check table count
SELECT schemaname, COUNT(*) 
FROM pg_tables 
WHERE schemaname IN ('auth', 'core', 'ledger', 'audit')
GROUP BY schemaname;

-- Check system accounts exist
SELECT id, type, state FROM core.wallets WHERE type = 'SYSTEM';

-- Check sequences initialized
SELECT last_value FROM core.wallet_user_seq;
SELECT last_value FROM core.wallet_agent_seq;
```

Expected results:
- 5 schemas created
- 13 tables created (4 auth, 7 core, 1 ledger, 1 audit)
- 5 system wallets
- Sequences starting at 7770001 and 8880001

## Rollback

**WARNING**: Rollback will destroy all data. Only use in development/testing.

```sql
-- Drop all schemas (cascades to all tables)
DROP SCHEMA IF EXISTS audit CASCADE;
DROP SCHEMA IF EXISTS services CASCADE;
DROP SCHEMA IF EXISTS ledger CASCADE;
DROP SCHEMA IF EXISTS core CASCADE;
DROP SCHEMA IF EXISTS auth CASCADE;

-- Drop extensions
DROP EXTENSION IF EXISTS pgcrypto;
DROP EXTENSION IF EXISTS uuid-ossp;
```

## Next Steps

After this migration:

1. Apply subsequent migrations:
   - `20240115000001_add_new_features_schema` (MPESA logs, SMS logs, receipts)
   - `20240217000001_add_reconciliation_schema` (Reconciliation engine)

2. Initialize default data:
   - Default fee configurations
   - Default commission structures
   - Initial exchange rates

3. Create application database user:
   ```sql
   CREATE ROLE aban_app_user WITH LOGIN PASSWORD 'strong_password';
   GRANT USAGE ON SCHEMA core, ledger, services, audit, auth TO aban_app_user;
   GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA core, ledger, services, audit, auth TO aban_app_user;
   ```

4. Configure connection pooling in application

5. Set up automated backups

## Troubleshooting

### Extension Not Available

If `uuid-ossp` or `pgcrypto` extensions fail:
```sql
-- Check available extensions
SELECT * FROM pg_available_extensions WHERE name IN ('uuid-ossp', 'pgcrypto');

-- Install from package manager (as superuser)
-- Ubuntu/Debian: apt-get install postgresql-contrib
-- CentOS/RHEL: yum install postgresql-contrib
```

### Permission Denied

If migration fails with permission errors:
```sql
-- Grant CREATE on database
GRANT CREATE ON DATABASE fkmqtves_aban_remit TO fkmqtves;

-- Or run as superuser
psql -U postgres -d fkmqtves_aban_remit -f migration.sql
```

### Sequence Already Exists

If sequences already exist with different values:
```sql
-- Reset sequences
ALTER SEQUENCE core.wallet_user_seq RESTART WITH 7770001;
ALTER SEQUENCE core.wallet_agent_seq RESTART WITH 8880001;
```

## Support

For issues or questions:
1. Check PostgreSQL logs: `/var/log/postgresql/`
2. Verify connection: `psql -U fkmqtves -d fkmqtves_aban_remit -c "SELECT version();"`
3. Review migration output for errors
4. Consult design document: `.kiro/specs/aban-remit-core-backend/design.md`

## References

- Design Document: `.kiro/specs/aban-remit-core-backend/design.md`
- Requirements: `.kiro/specs/aban-remit-core-backend/requirements.md`
- PostgreSQL 10 Documentation: https://www.postgresql.org/docs/10/
- Double-Entry Accounting: https://en.wikipedia.org/wiki/Double-entry_bookkeeping
