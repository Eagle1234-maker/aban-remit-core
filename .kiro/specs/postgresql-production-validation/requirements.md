# Requirements Document

## Introduction

This document specifies the requirements for validating and ensuring production-readiness of the PostgreSQL database infrastructure for the Aban Remit Core Backend. The system uses a multi-schema architecture with PostgreSQL 10.23 and requires comprehensive validation of schema structure, connection management, logging infrastructure, and external service integrations (MPESA, Paystack, SMS).

The validation system will ensure that the database is correctly configured for production workloads, with proper connection pooling, audit logging, and integration tracking capabilities.

## Glossary

- **Database_Validator**: The system component that validates database structure and configuration
- **Connection_Pool**: A managed pool of database connections for efficient resource utilization
- **Schema**: A PostgreSQL namespace containing related tables and functions
- **Log_Table**: A table in the services schema that stores integration event logs
- **Integration_Provider**: An external service (MPESA, Paystack, SMS) that requires logging
- **System_Account**: A special wallet used for suspense and revenue tracking
- **Ledger_Entry**: A double-entry accounting record in the ledger schema
- **Webhook**: An HTTP callback from an external provider containing transaction data
- **Idempotency_Key**: A unique identifier preventing duplicate transaction processing
- **Verification_Hash**: A SHA256 hash used to verify receipt authenticity

## Requirements

### Requirement 1: Multi-Schema Architecture Validation

**User Story:** As a database administrator, I want to validate the multi-schema architecture, so that I can ensure proper separation of concerns and data organization.

#### Acceptance Criteria

1. THE Database_Validator SHALL verify that all five schemas exist (auth, core, ledger, audit, services)
2. WHEN validating schema structure, THE Database_Validator SHALL confirm each schema contains its designated tables
3. THE Database_Validator SHALL verify that the auth schema contains user authentication tables (users, otps, devices, token_blacklist)
4. THE Database_Validator SHALL verify that the core schema contains business entity tables (wallets, transactions, fee_configs, commission_configs, exchange_rates)
5. THE Database_Validator SHALL verify that the ledger schema contains the entries table for double-entry accounting
6. THE Database_Validator SHALL verify that the audit schema contains audit_entries, reconciliation_jobs, and reconciliation_discrepancies tables
7. THE Database_Validator SHALL verify that the services schema contains integration log tables (mpesa_logs, paystack_logs, sms_logs)
8. WHEN a required schema is missing, THE Database_Validator SHALL report a critical error with the schema name

### Requirement 2: Connection Pool Configuration

**User Story:** As a backend developer, I want production-ready connection pooling, so that the application can handle concurrent requests efficiently.

#### Acceptance Criteria

1. THE Connection_Pool SHALL support a minimum of 10 concurrent connections
2. THE Connection_Pool SHALL support a maximum of 50 concurrent connections
3. WHEN the connection pool is exhausted, THE Connection_Pool SHALL queue requests with a timeout of 30 seconds
4. THE Connection_Pool SHALL validate connections before returning them from the pool
5. THE Connection_Pool SHALL automatically reconnect when a connection is lost
6. THE Connection_Pool SHALL log connection pool metrics (active, idle, waiting)
7. WHEN a connection remains idle for more than 10 minutes, THE Connection_Pool SHALL close it
8. THE Connection_Pool SHALL support both TCP socket and Unix socket connections

### Requirement 3: Log Table Structure Validation

**User Story:** As a compliance officer, I want to validate log table structures, so that all integration events are properly captured for audit purposes.

#### Acceptance Criteria

1. THE Database_Validator SHALL verify that services.mpesa_logs contains columns (id, mpesa_receipt, phone, amount, raw_payload, created_at)
2. THE Database_Validator SHALL verify that services.paystack_logs contains columns (id, paystack_reference, email, amount, currency, status, gateway_response, raw_payload, created_at)
3. THE Database_Validator SHALL verify that services.sms_logs contains columns (id, recipient, message, cost, status, provider_message_id, error_message, created_at)
4. THE Database_Validator SHALL verify that mpesa_receipt has a UNIQUE constraint in mpesa_logs
5. THE Database_Validator SHALL verify that paystack_reference has a UNIQUE constraint in paystack_logs
6. THE Database_Validator SHALL verify that raw_payload columns use JSONB data type
7. THE Database_Validator SHALL verify that amount columns use DECIMAL(19,2) data type
8. WHEN a log table is missing required columns, THE Database_Validator SHALL report the missing columns

### Requirement 4: Index Validation for Performance

**User Story:** As a database administrator, I want to validate critical indexes, so that query performance meets production requirements.

#### Acceptance Criteria

1. THE Database_Validator SHALL verify that services.mpesa_logs has an index on mpesa_receipt
2. THE Database_Validator SHALL verify that services.mpesa_logs has an index on phone
3. THE Database_Validator SHALL verify that services.paystack_logs has an index on paystack_reference
4. THE Database_Validator SHALL verify that services.sms_logs has an index on recipient
5. THE Database_Validator SHALL verify that services.sms_logs has an index on created_at
6. THE Database_Validator SHALL verify that core.transactions has an index on idempotency_key
7. THE Database_Validator SHALL verify that core.wallets has an index on owner_id
8. WHEN a critical index is missing, THE Database_Validator SHALL report the table and column name

### Requirement 5: System Account Initialization

**User Story:** As a financial controller, I want to validate system accounts, so that suspense and revenue tracking functions correctly.

#### Acceptance Criteria

1. THE Database_Validator SHALL verify that a MPESA_SUSPENSE system wallet exists
2. THE Database_Validator SHALL verify that a PAYSTACK_SUSPENSE system wallet exists
3. THE Database_Validator SHALL verify that an AIRTIME_SUSPENSE system wallet exists
4. THE Database_Validator SHALL verify that a FEE_REVENUE system wallet exists
5. THE Database_Validator SHALL verify that a COMMISSION_EXPENSE system wallet exists
6. THE Database_Validator SHALL verify that all system wallets have type equal to SYSTEM
7. THE Database_Validator SHALL verify that all system wallets have state equal to ACTIVE
8. WHEN a required system account is missing, THE Database_Validator SHALL report the account name

### Requirement 6: MPESA Integration Logging

**User Story:** As an integration engineer, I want to log all MPESA callbacks, so that I can track deposits and prevent duplicate processing.

#### Acceptance Criteria

1. WHEN a MPESA C2B callback is received, THE System SHALL extract the mpesa_receipt from the payload
2. WHEN a MPESA callback is received, THE System SHALL check if the mpesa_receipt already exists in mpesa_logs
3. IF the mpesa_receipt already exists, THEN THE System SHALL reject the callback as a duplicate
4. WHEN storing a new MPESA callback, THE System SHALL store the complete raw_payload as JSONB
5. THE System SHALL extract phone, amount, and mpesa_receipt from the callback payload
6. THE System SHALL store the created_at timestamp automatically
7. WHEN a MPESA callback is successfully logged, THE System SHALL return the log entry ID
8. THE System SHALL ensure mpesa_receipt uniqueness through database constraints

### Requirement 7: Paystack Integration Logging

**User Story:** As an integration engineer, I want to log all Paystack webhooks, so that I can track card deposits and reconcile transactions.

#### Acceptance Criteria

1. WHEN a Paystack webhook is received, THE System SHALL extract the paystack_reference from the payload
2. WHEN a Paystack webhook is received, THE System SHALL check if the paystack_reference already exists in paystack_logs
3. IF the paystack_reference already exists, THEN THE System SHALL reject the webhook as a duplicate
4. WHEN storing a new Paystack webhook, THE System SHALL store the complete raw_payload as JSONB
5. THE System SHALL extract email, amount, currency, status, and gateway_response from the webhook payload
6. THE System SHALL default currency to KES if not provided
7. WHEN a Paystack webhook is successfully logged, THE System SHALL return the log entry ID
8. THE System SHALL ensure paystack_reference uniqueness through database constraints

### Requirement 8: SMS Delivery Logging

**User Story:** As a cost analyst, I want to log all SMS deliveries, so that I can track costs and monitor delivery success rates.

#### Acceptance Criteria

1. WHEN an SMS is sent, THE System SHALL log the recipient phone number
2. WHEN an SMS is sent, THE System SHALL log the complete message content
3. WHEN an SMS is sent, THE System SHALL log the initial status as PENDING
4. WHEN an SMS delivery confirmation is received, THE System SHALL update the status to SENT or FAILED
5. WHEN an SMS cost is available, THE System SHALL store it with DECIMAL(10,4) precision
6. WHEN an SMS provider returns a message ID, THE System SHALL store it in provider_message_id
7. IF an SMS fails, THEN THE System SHALL store the error_message
8. THE System SHALL store the created_at timestamp automatically

### Requirement 9: Database Connection Validation

**User Story:** As a DevOps engineer, I want to validate database connectivity, so that I can ensure the application can connect in production.

#### Acceptance Criteria

1. THE Database_Validator SHALL attempt to connect using the DATABASE_URL environment variable
2. WHEN testing connection, THE Database_Validator SHALL execute a simple query (SELECT 1)
3. THE Database_Validator SHALL verify the connected database name matches fkmqtves_aban_remit
4. THE Database_Validator SHALL verify the connected user matches fkmqtves
5. THE Database_Validator SHALL verify the PostgreSQL version is 10.23 or higher
6. THE Database_Validator SHALL measure connection latency and report if it exceeds 100ms
7. WHEN connection fails, THE Database_Validator SHALL report the error message and connection string (with password redacted)
8. THE Database_Validator SHALL verify that required PostgreSQL extensions (uuid-ossp, pgcrypto) are installed

### Requirement 10: Ledger Integrity Validation

**User Story:** As a financial auditor, I want to validate ledger integrity, so that I can ensure double-entry accounting rules are enforced.

#### Acceptance Criteria

1. THE Database_Validator SHALL verify that every transaction has paired DEBIT and CREDIT entries in ledger.entries
2. THE Database_Validator SHALL verify that the sum of DEBIT entries equals the sum of CREDIT entries for each transaction
3. THE Database_Validator SHALL verify that all ledger entries reference valid transactions
4. THE Database_Validator SHALL verify that all ledger entries reference valid wallets
5. THE Database_Validator SHALL verify that ledger entry amounts are positive
6. THE Database_Validator SHALL verify that ledger entries have proper foreign key constraints
7. WHEN ledger integrity violations are found, THE Database_Validator SHALL report the transaction IDs
8. THE Database_Validator SHALL calculate wallet balances from ledger entries and verify they match expected values

### Requirement 11: Webhook Idempotency Validation

**User Story:** As a backend developer, I want to validate idempotency mechanisms, so that duplicate webhooks do not create duplicate transactions.

#### Acceptance Criteria

1. THE Database_Validator SHALL verify that core.transactions has a unique constraint on idempotency_key
2. THE Database_Validator SHALL verify that services.mpesa_logs has a unique constraint on mpesa_receipt
3. THE Database_Validator SHALL verify that services.paystack_logs has a unique constraint on paystack_reference
4. WHEN testing idempotency, THE System SHALL reject duplicate webhook processing attempts
5. THE System SHALL return a 200 OK response for duplicate webhooks with the original transaction ID
6. THE System SHALL log duplicate webhook attempts for monitoring
7. THE Database_Validator SHALL verify that idempotency keys are properly indexed
8. THE Database_Validator SHALL verify that no duplicate idempotency keys exist in the database

### Requirement 12: Security and Permissions Validation

**User Story:** As a security engineer, I want to validate database security settings, so that unauthorized access is prevented.

#### Acceptance Criteria

1. THE Database_Validator SHALL verify that the database user has SELECT, INSERT, UPDATE, DELETE permissions on all application schemas
2. THE Database_Validator SHALL verify that the database user does NOT have DROP or TRUNCATE permissions on production tables
3. THE Database_Validator SHALL verify that sensitive columns (password_hash) are properly hashed
4. THE Database_Validator SHALL verify that connection strings use SSL/TLS in production
5. THE Database_Validator SHALL verify that the database is not accessible from public IP addresses
6. THE Database_Validator SHALL verify that row-level security policies are configured where required
7. WHEN security violations are detected, THE Database_Validator SHALL report them as critical errors
8. THE Database_Validator SHALL verify that audit logging is enabled for schema changes

### Requirement 13: Production Readiness Checklist

**User Story:** As a project manager, I want a production readiness checklist, so that I can verify all database requirements are met before launch.

#### Acceptance Criteria

1. THE Database_Validator SHALL generate a comprehensive validation report
2. THE validation report SHALL include pass/fail status for each requirement
3. THE validation report SHALL include detailed error messages for failures
4. THE validation report SHALL include performance metrics (connection latency, query times)
5. THE validation report SHALL include a summary of critical, warning, and info-level issues
6. THE validation report SHALL include recommendations for fixing identified issues
7. WHEN all validations pass, THE Database_Validator SHALL output "PRODUCTION READY"
8. WHEN any critical validation fails, THE Database_Validator SHALL output "NOT PRODUCTION READY" and block deployment
