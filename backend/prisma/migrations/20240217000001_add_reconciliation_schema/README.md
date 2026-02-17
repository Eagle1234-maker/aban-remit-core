# Migration: Add Reconciliation Schema

**Date**: 2024-02-17  
**Task**: 13. Database schema for Reconciliation Engine  
**Requirements**: 38.8, 41.4, 42.1  
**Depends on**: 20240217000000_init_base_schema, 20240115000001_add_new_features_schema

## Overview

This migration adds comprehensive reconciliation capabilities to the Aban Remit Core Backend. It enables automated reconciliation of external provider transactions (MPESA, Paystack) against internal ledger entries, with sophisticated discrepancy detection and management.

## Reconciliation Engine Architecture

### Core Concepts

1. **Reconciliation Jobs**: Scheduled or on-demand processes that compare external provider records against internal transactions
2. **Discrepancy Detection**: Automated identification of mismatches, missing records, and inconsistencies
3. **Severity Classification**: CRITICAL, HIGH, MEDIUM, LOW based on financial impact and urgency
4. **Resolution Workflow**: Structured process for investigating and resolving discrepancies

### Supported Reconciliation Types

| Type      | Purpose                                    | Data Sources                           |
|-----------|--------------------------------------------|-----------------------------------------|
| MPESA     | Reconcile MPESA deposits against ledger   | services.mpesa_logs ↔ core.transactions |
| PAYSTACK  | Reconcile card payments against ledger    | services.paystack_logs ↔ core.transactions |
| LEDGER    | Verify internal double-entry consistency  | ledger.entries internal validation      |

## Database Objects Created

### Tables

#### 1. audit.reconciliation_jobs

Tracks reconciliation job execution and results.

**Columns**:
- `id` (UUID, PK) - Unique job identifier
- `job_type` (VARCHAR) - MPESA, PAYSTACK, or LEDGER
- `status` (VARCHAR) - PENDING, RUNNING, COMPLETED, or FAILED
- `start_date` (DATE) - Reconciliation period start (inclusive)
- `end_date` (DATE) - Reconciliation period end (inclusive)
- `total_transactions` (INT) - Total transactions processed
- `matched_transactions` (INT) - Successfully matched transactions
- `discrepancies_found` (INT) - Number of discrepancies detected
- `started_at` (TIMESTAMP) - Job execution start time
- `completed_at` (TIMESTAMP) - Job completion time
- `created_by` (UUID) - Admin user who initiated the job
- `error_message` (TEXT) - Error details if job failed
- `created_at` (TIMESTAMP) - Job creation time

**Constraints**:
- `matched_transactions <= total_transactions`
- `discrepancies_found >= 0`
- `end_date >= start_date`

**Indexes**:
- `idx_reconciliation_jobs_type` - Filter by job type
- `idx_reconciliation_jobs_status` - Filter by status
- `idx_reconciliation_jobs_dates` - Date range queries
- `idx_reconciliation_jobs_created` - Chronological ordering

#### 2. audit.reconciliation_discrepancies

Records discrepancies found during reconciliation processes.

**Columns**:
- `id` (UUID, PK) - Unique discrepancy identifier
- `job_id` (UUID, FK) - Associated reconciliation job
- `discrepancy_type` (VARCHAR) - Type of discrepancy detected
- `severity` (VARCHAR) - CRITICAL, HIGH, MEDIUM, or LOW
- `provider` (VARCHAR) - MPESA, PAYSTACK, or INTERNAL
- `provider_reference` (VARCHAR) - External provider transaction reference
- `transaction_id` (UUID, FK) - Associated internal transaction (if exists)
- `expected_amount` (DECIMAL) - Expected transaction amount
- `actual_amount` (DECIMAL) - Actual amount found in records
- `details` (JSONB) - Additional discrepancy details
- `status` (VARCHAR) - PENDING, INVESTIGATING, RESOLVED, or IGNORED
- `resolution_notes` (TEXT) - Admin notes on resolution
- `resolved_by` (UUID, FK) - Admin user who resolved the discrepancy
- `resolved_at` (TIMESTAMP) - Resolution timestamp
- `created_at` (TIMESTAMP) - Discrepancy detection time

**Discrepancy Types**:
- `MISSING_LEDGER`: Provider record exists but no internal transaction
- `MISSING_PROVIDER`: Internal transaction exists but no provider record
- `AMOUNT_MISMATCH`: Transaction amounts don't match between systems
- `DUPLICATE`: Duplicate records detected
- `UNBALANCED`: Ledger entries don't balance (DEBIT ≠ CREDIT)
- `BALANCE_MISMATCH`: Calculated wallet balance doesn't match expected

**Severity Levels**:
- `CRITICAL`: Immediate action required (missing funds, unbalanced ledger)
- `HIGH`: Urgent attention needed (amount mismatches, duplicates)
- `MEDIUM`: Review required (minor discrepancies, timing issues)
- `LOW`: Monitor only (informational, resolved automatically)

**Indexes**:
- `idx_discrepancies_job` - Group by reconciliation job
- `idx_discrepancies_status` - Filter by resolution status
- `idx_discrepancies_severity` - Priority-based queries
- `idx_discrepancies_provider` - Filter by external provider
- `idx_discrepancies_created` - Chronological ordering
- `idx_discrepancies_type` - Filter by discrepancy type

#### 3. services.paystack_logs

Stores Paystack payment callbacks for reconciliation (complements existing services.mpesa_logs).

**Columns**:
- `id` (UUID, PK) - Unique log identifier
- `paystack_reference` (VARCHAR, UNIQUE) - Paystack transaction reference
- `email` (VARCHAR) - Customer email address
- `amount` (DECIMAL) - Transaction amount
- `currency` (VARCHAR) - Transaction currency (default: KES)
- `status` (VARCHAR) - Payment status from Paystack
- `gateway_response` (VARCHAR) - Gateway response message
- `raw_payload` (JSONB) - Complete Paystack callback payload
- `created_at` (TIMESTAMP) - Log creation time

**Indexes**:
- `idx_paystack_logs_reference` - Fast reference lookups
- `idx_paystack_logs_email` - Customer queries
- `idx_paystack_logs_created` - Date range queries
- `idx_paystack_logs_status` - Status filtering

### Functions

#### 1. audit.calculate_match_rate(job_id UUID)

Calculates the match rate percentage for a reconciliation job.

**Returns**: DECIMAL(5,2) - Match rate as percentage (0.00 to 100.00)

**Usage**:
```sql
SELECT audit.calculate_match_rate('job-uuid-here');
-- Returns: 95.50 (95.50% match rate)
```

#### 2. audit.get_discrepancy_summary(job_id UUID)

Returns discrepancy count by severity level for a reconciliation job.

**Returns**: TABLE(severity VARCHAR, count BIGINT)

**Usage**:
```sql
SELECT * FROM audit.get_discrepancy_summary('job-uuid-here');
-- Returns:
-- CRITICAL | 2
-- HIGH     | 5
-- MEDIUM   | 12
-- LOW      | 3
```

### Triggers

#### trigger_update_discrepancies_count

Automatically updates the `discrepancies_found` count in `reconciliation_jobs` when discrepancies are added or removed.

**Trigger Events**: INSERT, DELETE on `reconciliation_discrepancies`

**Purpose**: Maintains data consistency without requiring application-level updates

## Reconciliation Workflows

### 1. MPESA Reconciliation

**Process**:
1. Fetch MPESA logs from `services.mpesa_logs` for date range
2. Fetch MPESA deposit transactions from `core.transactions`
3. Match by MPESA receipt number
4. Compare amounts, phone numbers, timestamps
5. Flag discrepancies:
   - `MISSING_LEDGER` (CRITICAL): MPESA log without transaction
   - `MISSING_PROVIDER` (HIGH): Transaction without MPESA log
   - `AMOUNT_MISMATCH` (HIGH): Amount differences

### 2. Paystack Reconciliation

**Process**:
1. Fetch Paystack logs from `services.paystack_logs` for date range
2. Fetch card deposit transactions from `core.transactions`
3. Match by Paystack reference
4. Compare amounts and timestamps
5. Flag similar discrepancies as MPESA

### 3. Ledger Reconciliation

**Process**:
1. Fetch all ledger entries for date range
2. Group by transaction_id
3. Verify double-entry balance (SUM(DEBIT) = SUM(CREDIT))
4. Calculate wallet balances from ledger entries
5. Flag discrepancies:
   - `UNBALANCED` (CRITICAL): DEBIT ≠ CREDIT for transaction
   - `BALANCE_MISMATCH` (CRITICAL): Wallet balance inconsistency

## Automated Scheduling

### Daily Reconciliation

Recommended cron schedule: **2:00 AM daily**

```javascript
// Node.js cron job example
const cron = require('node-cron');

cron.schedule('0 2 * * *', async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Run all three reconciliation types
  await reconciliationEngine.runReconciliation({
    jobType: 'MPESA',
    startDate: yesterday,
    endDate: yesterday
  });
  
  await reconciliationEngine.runReconciliation({
    jobType: 'PAYSTACK', 
    startDate: yesterday,
    endDate: yesterday
  });
  
  await reconciliationEngine.runReconciliation({
    jobType: 'LEDGER',
    startDate: yesterday, 
    endDate: yesterday
  });
});
```

### On-Demand Reconciliation

Admin users can trigger reconciliation for specific date ranges via API:

```http
POST /admin/reconciliation/run
{
  "jobType": "MPESA",
  "startDate": "2024-02-15",
  "endDate": "2024-02-16"
}
```

## Discrepancy Management

### Severity-Based Alerting

| Severity  | Alert Method                    | Timing      |
|-----------|--------------------------------|-------------|
| CRITICAL  | Email + SMS to finance team    | Immediate   |
| HIGH      | Email to finance team          | Immediate   |
| MEDIUM    | Email summary                  | Daily       |
| LOW       | Email summary                  | Weekly      |

### Resolution Workflow

1. **Detection**: Discrepancy automatically created during reconciliation
2. **Alerting**: Notifications sent based on severity
3. **Investigation**: Finance team reviews discrepancy details
4. **Resolution**: Admin updates status and adds resolution notes
5. **Audit**: All actions logged in audit trail

### API Endpoints

```http
# List discrepancies
GET /admin/reconciliation/discrepancies?severity=CRITICAL&status=PENDING

# Resolve discrepancy
PUT /admin/reconciliation/discrepancies/:id/resolve
{
  "status": "RESOLVED",
  "resolutionNotes": "Manual adjustment applied to correct MPESA timing difference"
}
```

## Performance Considerations

### Batch Processing

- Process reconciliation in batches of 1,000 transactions
- Use database cursors for large result sets
- Implement progress tracking for long-running jobs

### Indexing Strategy

- Composite indexes for common query patterns
- Partial indexes for active/pending records
- Date-based partitioning for large historical data

### Caching

- Cache reconciliation job results for 24 hours
- Cache provider reliability scores for 1 hour
- Invalidate cache when discrepancies are resolved

## Monitoring and Metrics

### Key Performance Indicators

1. **Match Rate**: Percentage of transactions that match between systems
2. **Reconciliation Time**: Average time to complete reconciliation jobs
3. **Resolution Time**: Average time to resolve discrepancies
4. **Provider Reliability**: Historical match rates by provider

### Monitoring Queries

```sql
-- Daily match rates by provider
SELECT 
  job_type,
  DATE(created_at) as date,
  AVG(audit.calculate_match_rate(id)) as avg_match_rate
FROM audit.reconciliation_jobs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY job_type, DATE(created_at)
ORDER BY date DESC;

-- Unresolved critical discrepancies
SELECT COUNT(*) as critical_unresolved
FROM audit.reconciliation_discrepancies
WHERE severity = 'CRITICAL' 
AND status IN ('PENDING', 'INVESTIGATING');

-- Average resolution time by severity
SELECT 
  severity,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_hours_to_resolve
FROM audit.reconciliation_discrepancies
WHERE resolved_at IS NOT NULL
GROUP BY severity;
```

## Security and Compliance

### Data Protection

- All reconciliation data stored in `audit` schema
- Immutable audit trail for compliance
- Sensitive data (amounts, references) properly indexed
- Access restricted to admin users only

### Audit Requirements

- All reconciliation jobs logged with timestamps
- All discrepancy resolutions tracked with admin user ID
- Complete audit trail for regulatory compliance
- Data retention policies enforced

## Backup and Recovery

### Critical Data

- `reconciliation_jobs`: Job execution history
- `reconciliation_discrepancies`: Financial discrepancy records
- `paystack_logs`: External provider transaction logs

### Backup Strategy

- Include in daily database backups
- Separate backup for audit schema
- Point-in-time recovery capability
- Cross-region backup replication

## Migration Execution

### Prerequisites

1. Base schema migration applied (20240217000000_init_base_schema)
2. New features migration applied (20240115000001_add_new_features_schema)
3. Admin user exists for job creation
4. Application role configured for permissions

### Apply Migration

```bash
# Using psql
psql -U fkmqtves -d fkmqtves_aban_remit -f migration.sql

# Using Prisma
npx prisma migrate deploy
```

### Verification

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'audit' 
AND table_name LIKE 'reconciliation%';

-- Check functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'audit'
AND routine_name LIKE '%reconciliation%';

-- Check triggers exist
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_schema = 'audit'
AND event_object_table = 'reconciliation_discrepancies';
```

Expected results:
- 2 tables in audit schema (reconciliation_jobs, reconciliation_discrepancies)
- 1 table in services schema (paystack_logs)
- 2 functions (calculate_match_rate, get_discrepancy_summary)
- 1 trigger (update_discrepancies_count)

## Rollback

**WARNING**: Rollback will destroy all reconciliation data.

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_discrepancies_count ON audit.reconciliation_discrepancies;

-- Drop functions
DROP FUNCTION IF EXISTS audit.update_discrepancies_count();
DROP FUNCTION IF EXISTS audit.get_discrepancy_summary(UUID);
DROP FUNCTION IF EXISTS audit.calculate_match_rate(UUID);

-- Drop tables
DROP TABLE IF EXISTS audit.reconciliation_discrepancies;
DROP TABLE IF EXISTS audit.reconciliation_jobs;
DROP TABLE IF EXISTS services.paystack_logs;
```

## Next Steps

After this migration:

1. **Implement Reconciliation Engine**: Create service classes and business logic
2. **Set up Cron Jobs**: Configure automated daily reconciliation
3. **Create Admin APIs**: Build endpoints for discrepancy management
4. **Configure Alerting**: Set up email/SMS notifications for critical discrepancies
5. **Build Reporting**: Create dashboards for reconciliation metrics
6. **Test Scenarios**: Verify reconciliation logic with test data

## Related Tasks

This migration supports the following implementation tasks:
- Task 14: Implement Reconciliation Engine core interfaces
- Task 15: Implement MPESA Reconciliation
- Task 16: Implement Paystack Reconciliation
- Task 17: Implement Internal Ledger Reconciliation
- Task 19: Implement Automated Reconciliation Scheduling
- Task 20: Implement Discrepancy Management
- Task 21: Implement Reconciliation Reports
- Task 22: Implement Reconciliation Metrics
- Task 23: Implement Reconciliation Notifications

## Support

For issues or questions:
1. Review migration logs for errors
2. Check PostgreSQL version compatibility (10.23+)
3. Verify all dependencies are applied
4. Consult design document for reconciliation architecture
5. Test with sample data before production use