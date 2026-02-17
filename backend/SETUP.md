# Aban Remit Core Backend - Setup Guide

## Quick Start

### 1. Prerequisites

Ensure you have the following installed:
- **PostgreSQL 15+** - Database server
- **Node.js 18+** - Runtime environment
- **npm** or **yarn** - Package manager

### 2. Database Setup

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE aban_remit;

# Create core schema (for main application tables)
\c aban_remit
CREATE SCHEMA IF NOT EXISTS core;

# Exit psql
\q
```

#### Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and set your database URL
# Example: DATABASE_URL="postgresql://postgres:password@localhost:5432/aban_remit?schema=core"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Migrations

```bash
# Run all pending migrations
npm run prisma:migrate

# Or deploy migrations (production)
npm run prisma:deploy
```

### 5. Verify Migration

```bash
# Connect to database
psql -U postgres -d aban_remit

# Run verification script
\i scripts/verify-migration.sql
```

Expected output should show:
- ✓ services schema exists
- ✓ services.mpesa_logs table exists
- ✓ services.sms_logs table exists
- ✓ verification_hash column exists (if core.transactions exists)
- All required indexes created

### 6. Generate Prisma Client

```bash
npm run prisma:generate
```

## Migration Details

### Migration: 20240115000001_add_new_features_schema

This migration adds support for:

1. **MPESA Deposit Logging** (`services.mpesa_logs`)
   - Tracks all MPESA deposits
   - Prevents duplicate processing via unique receipt numbers
   - Stores raw callback payloads for audit

2. **SMS Notification Logging** (`services.sms_logs`)
   - Logs all SMS messages sent
   - Tracks delivery status and costs
   - Enables cost reporting and audit

3. **Receipt Verification** (`core.transactions.verification_hash`)
   - Adds SHA256 hash for receipt authenticity
   - Prevents receipt tampering

4. **Performance Indexes**
   - Fast wallet lookups
   - Efficient MPESA receipt queries
   - SMS cost report optimization

## Database Schema Overview

```
aban_remit (database)
├── core (schema)
│   ├── users
│   ├── wallets
│   ├── transactions (+ verification_hash)
│   ├── ledger_entries
│   └── ... (other core tables)
└── services (schema)
    ├── mpesa_logs
    └── sms_logs
```

## Troubleshooting

### Migration Fails: "schema core does not exist"

The migration assumes `core` schema exists. Create it first:

```sql
CREATE SCHEMA IF NOT EXISTS core;
```

### Migration Fails: "table core.transactions does not exist"

This is expected if you haven't run the base schema migration yet. The migration uses `IF NOT EXISTS` checks, so it will:
- Create the services tables successfully
- Skip the `verification_hash` column addition (will be added when transactions table exists)

You can re-run the migration after creating the base schema.

### Verify Tables Exist

```sql
-- List all tables in services schema
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'services';

-- Check mpesa_logs structure
\d services.mpesa_logs

-- Check sms_logs structure
\d services.sms_logs
```

### Check Indexes

```sql
-- List all indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname IN ('core', 'services')
ORDER BY schemaname, tablename;
```

## Next Steps

After successful migration:

1. **Implement Wallet Lookup Engine** (Task 2)
   - Use `idx_wallets_number` index for fast lookups
   - Implement phone masking utility

2. **Implement MPESA Logging** (Task 3)
   - Use `services.mpesa_logs` for idempotency
   - Check `mpesa_receipt` before processing deposits

3. **Implement SMS Logging** (Task 9)
   - Log all SMS to `services.sms_logs`
   - Track costs for reporting

4. **Implement Receipt Generation** (Task 6)
   - Calculate and store `verification_hash`
   - Generate PDF receipts with QR codes

## Development Workflow

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# View database in Prisma Studio
npm run prisma:studio
```

## Production Deployment

```bash
# Build application
npm run build

# Deploy migrations (non-interactive)
npm run prisma:deploy

# Start production server
npm start
```

## Support

For issues or questions:
1. Check the migration README: `prisma/migrations/20240115000001_add_new_features_schema/README.md`
2. Review the design document: `.kiro/specs/aban-remit-core-backend/design.md`
3. Check requirements: `.kiro/specs/aban-remit-core-backend/requirements.md`
