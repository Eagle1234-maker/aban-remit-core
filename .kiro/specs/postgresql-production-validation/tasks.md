# Implementation Plan: PostgreSQL Production Validation

## Overview

This implementation plan creates a comprehensive PostgreSQL database validation system that integrates with the existing validation framework. The validator will check database structure, connection pooling, logging infrastructure, and integration tracking to ensure production readiness.

The implementation follows the existing validation architecture pattern, creating a new `PostgreSQLProductionValidator` that registers with the `ValidationOrchestrator` and produces a `PhaseResult`.

## Tasks

- [x] 1. Set up PostgreSQL validation infrastructure
  - Create `src/validation/validators/postgresql-production.ts` with main validator class
  - Create `src/validation/validators/helpers/` directory for helper validators
  - Add PostgreSQL validation types to `src/validation/types.ts`
  - Configure test database connection for validation tests
  - _Requirements: 1.1, 9.1_

- [x] 2. Implement schema architecture validation
  - [x] 2.1 Create SchemaValidator helper class
    - Implement `validateSchemaExists()` to check if schema exists
    - Implement `validateTableExists()` to check if table exists in schema
    - Implement `validateColumnExists()` to check if column exists in table
    - Implement `validateColumnType()` to verify column data type
    - Implement `getSchemaStructure()` to retrieve complete schema metadata
    - _Requirements: 1.1, 1.2_
  
  - [ ]* 2.2 Write property test for schema validation
    - **Property 1: All required schemas exist**
    - **Property 2: Schema tables are complete**
    - **Validates: Requirements 1.1, 1.2**
  
  - [ ]* 2.3 Write unit tests for schema validation
    - Test auth schema contains users, otps, devices, token_blacklist tables
    - Test core schema contains wallets, transactions, fee_configs, commission_configs, exchange_rates tables
    - Test ledger schema contains entries table
    - Test audit schema contains entries, reconciliation_jobs, reconciliation_discrepancies tables
    - Test services schema contains mpesa_logs, paystack_logs, sms_logs tables
    - Test error reporting when schema is missing
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 3. Implement connection pool validation
  - [x] 3.1 Create ConnectionPoolValidator helper class
    - Implement `validatePoolConfiguration()` to check pool settings
    - Implement `testConcurrentConnections()` to test concurrent connection handling
    - Implement `measureConnectionLatency()` to measure connection performance
    - Implement `testConnectionRecovery()` to test automatic reconnection
    - Implement `testIdleConnectionTimeout()` to verify idle timeout behavior
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7_
  
  - [ ]* 3.2 Write property tests for connection pool
    - **Property 3: Connection pool validates connections**
    - **Property 4: Connection pool recovers from failures**
    - **Property 5: Connection pool logs metrics**
    - **Validates: Requirements 2.4, 2.5, 2.6**
  
  - [ ]* 3.3 Write unit tests for connection pool
    - Test minimum 10 concurrent connections
    - Test maximum 50 concurrent connections
    - Test request queuing with 30 second timeout
    - Test TCP socket connections
    - Test Unix socket connections
    - _Requirements: 2.1, 2.2, 2.3, 2.8_

- [x] 4. Implement log table structure validation
  - [x] 4.1 Create LogTableValidator helper class
    - Implement `validateMpesaLogTable()` to check mpesa_logs structure
    - Implement `validatePaystackLogTable()` to check paystack_logs structure
    - Implement `validateSmsLogTable()` to check sms_logs structure
    - Implement `validateLogTableColumns()` to verify required columns
    - Implement `validateUniqueConstraints()` to check unique constraints
    - Implement `validateJsonbColumns()` to verify JSONB data types
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [ ]* 4.2 Write property tests for log table validation
    - **Property 6: Raw payload columns use JSONB**
    - **Property 7: Amount columns use correct precision**
    - **Validates: Requirements 3.6, 3.7**
  
  - [ ]* 4.3 Write unit tests for log table validation
    - Test mpesa_logs has required columns (id, mpesa_receipt, phone, amount, raw_payload, created_at)
    - Test paystack_logs has required columns (id, paystack_reference, email, amount, currency, status, gateway_response, raw_payload, created_at)
    - Test sms_logs has required columns (id, recipient, message, cost, status, provider_message_id, error_message, created_at)
    - Test mpesa_receipt has UNIQUE constraint
    - Test paystack_reference has UNIQUE constraint
    - Test error reporting when columns are missing
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement index validation
  - [ ] 6.1 Add index validation methods to SchemaValidator
    - Implement `validateIndexExists()` to check if index exists
    - Implement `getTableIndexes()` to retrieve all indexes for a table
    - Implement `validateCriticalIndexes()` to check all required indexes
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ]* 6.2 Write unit tests for index validation
    - Test services.mpesa_logs has index on mpesa_receipt
    - Test services.mpesa_logs has index on phone
    - Test services.paystack_logs has index on paystack_reference
    - Test services.sms_logs has index on recipient
    - Test services.sms_logs has index on created_at
    - Test core.transactions has index on idempotency_key
    - Test core.wallets has index on owner_id
    - Test error reporting when index is missing
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [ ] 7. Implement system account validation
  - [ ] 7.1 Add system account validation to PostgreSQLProductionValidator
    - Implement `validateSystemAccounts()` to check all system wallets exist
    - Query core.wallets for MPESA_SUSPENSE, PAYSTACK_SUSPENSE, AIRTIME_SUSPENSE, FEE_REVENUE, COMMISSION_EXPENSE
    - Verify each system wallet has type = SYSTEM and state = ACTIVE
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ]* 7.2 Write property tests for system accounts
    - **Property 8: System wallets have correct type**
    - **Property 9: System wallets are active**
    - **Validates: Requirements 5.6, 5.7**
  
  - [ ]* 7.3 Write unit tests for system accounts
    - Test MPESA_SUSPENSE wallet exists
    - Test PAYSTACK_SUSPENSE wallet exists
    - Test AIRTIME_SUSPENSE wallet exists
    - Test FEE_REVENUE wallet exists
    - Test COMMISSION_EXPENSE wallet exists
    - Test error reporting when system account is missing
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.8_

- [ ] 8. Implement MPESA integration logging validation
  - [ ] 8.1 Create IntegrationValidator helper class with MPESA logging
    - Implement `testMpesaLogging()` to test MPESA callback logging
    - Extract mpesa_receipt, phone, amount from test payload
    - Store complete raw_payload as JSONB
    - Check for duplicate mpesa_receipt
    - Verify created_at timestamp is stored
    - Return log entry ID
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [ ]* 8.2 Write property test for MPESA logging
    - **Property 10: MPESA callback logging is complete**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7**

- [ ] 9. Implement Paystack integration logging validation
  - [ ] 9.1 Add Paystack logging to IntegrationValidator
    - Implement `testPaystackLogging()` to test Paystack webhook logging
    - Extract paystack_reference, email, amount, currency, status, gateway_response from test payload
    - Store complete raw_payload as JSONB
    - Check for duplicate paystack_reference
    - Default currency to KES if not provided
    - Verify created_at timestamp is stored
    - Return log entry ID
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  
  - [ ]* 9.2 Write property test for Paystack logging
    - **Property 11: Paystack webhook logging is complete**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**

- [ ] 10. Implement SMS logging validation
  - [ ] 10.1 Add SMS logging to IntegrationValidator
    - Implement `testSmsLogging()` to test SMS delivery logging
    - Log recipient phone number and message content
    - Set initial status as PENDING
    - Update status to SENT or FAILED on confirmation
    - Store cost with DECIMAL(10,4) precision if available
    - Store provider_message_id if available
    - Store error_message if failed
    - Verify created_at timestamp is stored
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_
  
  - [ ]* 10.2 Write property test for SMS logging
    - **Property 12: SMS logging is complete**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8**

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement database connection validation
  - [ ] 12.1 Add connection validation to PostgreSQLProductionValidator
    - Implement `validateConnection()` to test database connectivity
    - Connect using DATABASE_URL environment variable
    - Execute simple query (SELECT 1)
    - Verify database name matches fkmqtves_aban_remit
    - Verify user matches fkmqtves
    - Verify PostgreSQL version is 10.23 or higher
    - Measure connection latency and report if exceeds 100ms
    - Verify uuid-ossp and pgcrypto extensions are installed
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.8_
  
  - [ ]* 12.2 Write unit tests for connection validation
    - Test connection using DATABASE_URL
    - Test simple query execution
    - Test database name verification
    - Test user verification
    - Test version verification
    - Test latency measurement
    - Test extension verification
    - Test error reporting with password redaction
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [ ] 13. Implement ledger integrity validation
  - [ ] 13.1 Add ledger validation to PostgreSQLProductionValidator
    - Implement `validateLedgerIntegrity()` to check double-entry accounting
    - Verify every transaction has paired DEBIT and CREDIT entries
    - Verify sum of DEBIT entries equals sum of CREDIT entries for each transaction
    - Verify all ledger entries reference valid transactions
    - Verify all ledger entries reference valid wallets
    - Verify ledger entry amounts are positive
    - Verify foreign key constraints exist
    - Calculate wallet balances from ledger entries
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.8_
  
  - [ ]* 13.2 Write property tests for ledger integrity
    - **Property 13: Ledger entries are balanced**
    - **Property 14: Ledger entries reference valid entities**
    - **Property 15: Ledger entry amounts are positive**
    - **Property 16: Wallet balances are correct**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.8**
  
  - [ ]* 13.3 Write unit tests for ledger integrity
    - Test paired DEBIT/CREDIT entries
    - Test balanced transaction sums
    - Test foreign key constraints
    - Test error reporting for unbalanced transactions
    - _Requirements: 10.6, 10.7_

- [ ] 14. Implement idempotency validation
  - [ ] 14.1 Add idempotency validation to PostgreSQLProductionValidator
    - Implement `validateIdempotency()` to check idempotency mechanisms
    - Verify core.transactions has unique constraint on idempotency_key
    - Test duplicate webhook rejection
    - Verify 200 OK response for duplicates with original transaction ID
    - Verify duplicate webhook attempts are logged
    - Verify no duplicate idempotency keys exist in database
    - _Requirements: 11.1, 11.4, 11.5, 11.6, 11.8_
  
  - [ ]* 14.2 Write property tests for idempotency
    - **Property 17: Duplicate webhooks are rejected**
    - **Property 18: Duplicate webhooks return original transaction**
    - **Property 19: Duplicate webhooks are logged**
    - **Property 20: Idempotency keys are unique**
    - **Validates: Requirements 11.4, 11.5, 11.6, 11.8**
  
  - [ ]* 14.3 Write unit tests for idempotency
    - Test unique constraint on idempotency_key
    - Test duplicate rejection behavior
    - Test 200 OK response for duplicates
    - Test duplicate logging
    - _Requirements: 11.1, 11.4, 11.5, 11.6_

- [ ] 15. Implement security validation
  - [ ] 15.1 Add security validation to PostgreSQLProductionValidator
    - Implement `validateSecurity()` to check security settings
    - Verify database user has SELECT, INSERT, UPDATE, DELETE permissions on all application schemas
    - Verify database user does NOT have DROP or TRUNCATE permissions
    - Verify password_hash values are properly hashed (bcrypt format)
    - Verify connection strings use SSL/TLS in production
    - Verify database is not accessible from public IP addresses
    - Verify row-level security policies are configured where required
    - Verify audit logging is enabled for schema changes
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.8_
  
  - [ ]* 15.2 Write property tests for security
    - **Property 21: Database user has correct permissions**
    - **Property 22: Database user lacks dangerous permissions**
    - **Property 23: Password hashes are properly hashed**
    - **Property 24: Row-level security is configured**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.6**
  
  - [ ]* 15.3 Write unit tests for security
    - Test user permissions on each schema
    - Test lack of DROP/TRUNCATE permissions
    - Test SSL/TLS configuration
    - Test network accessibility
    - Test audit logging configuration
    - Test error reporting for security violations
    - _Requirements: 12.4, 12.5, 12.7, 12.8_

- [ ] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Implement production readiness report generation
  - [ ] 17.1 Add report generation to PostgreSQLProductionValidator
    - Implement `generateProductionReadinessReport()` to create comprehensive report
    - Include pass/fail status for each requirement
    - Include detailed error messages for failures
    - Include performance metrics (connection latency, query times)
    - Include summary of critical, warning, and info-level issues
    - Include recommendations for fixing identified issues
    - Output "PRODUCTION READY" when all validations pass
    - Output "NOT PRODUCTION READY" when any critical validation fails
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_
  
  - [ ]* 17.2 Write property tests for report generation
    - **Property 25: Validation report includes all requirement statuses**
    - **Property 26: Validation report includes error details**
    - **Property 27: Validation report includes recommendations**
    - **Validates: Requirements 13.2, 13.3, 13.6**
  
  - [ ]* 17.3 Write unit tests for report generation
    - Test report includes all requirement statuses
    - Test report includes performance metrics
    - Test report includes issue summary
    - Test "PRODUCTION READY" output
    - Test "NOT PRODUCTION READY" output
    - _Requirements: 13.1, 13.4, 13.5, 13.7, 13.8_

- [ ] 18. Integrate with validation orchestrator
  - [ ] 18.1 Register PostgreSQL validator with orchestrator
    - Update `src/validation/orchestrator.ts` to register PostgreSQLProductionValidator
    - Add `postgresqlProduction` phase to ValidationReport type
    - Update CLI to support `--phase=postgresqlProduction` option
    - Add PostgreSQL configuration to ValidationConfig type
    - _Requirements: 1.1_
  
  - [ ]* 18.2 Write integration tests
    - Test end-to-end validation flow
    - Test orchestrator integration
    - Test CLI integration
    - Test report generation with actual validation results

- [ ] 19. Add documentation and examples
  - [ ] 19.1 Create documentation
    - Write README for PostgreSQL validation
    - Document configuration options
    - Provide usage examples
    - Document error codes and troubleshooting
    - Create production deployment checklist
  
  - [ ] 19.2 Add example configurations
    - Create example DATABASE_URL configurations
    - Create example validation config
    - Create example CI/CD integration

- [ ] 20. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The validator integrates with the existing validation framework
- All database queries use parameterized statements to prevent SQL injection
- All error messages redact passwords for security
- The validator uses connection pooling for efficient resource utilization
