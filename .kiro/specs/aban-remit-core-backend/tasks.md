# Implementation Plan: Aban Remit Core Backend

## Overview

This implementation plan builds upon the existing Aban Remit Core Backend to add critical fintech features including wallet lookup, MPESA deposit logging, enhanced SMS notifications, receipt generation, fraud protection, and comprehensive SMS logging. The implementation follows the existing Node.js/TypeScript architecture with PostgreSQL and maintains the double-entry ledger system.

## Tasks

- [x] 1. Database schema updates for new features
  - Create `services.mpesa_logs` table with columns: id, mpesa_receipt (unique), phone, amount, raw_payload, created_at
  - Create `services.sms_logs` table with columns: id, recipient, message, cost, status, provider_message_id, error_message, created_at
  - Add `verification_hash` column to `core.transactions` table (VARCHAR(64))
  - Create indexes: `idx_mpesa_logs_receipt`, `idx_mpesa_logs_phone`, `idx_sms_logs_recipient`, `idx_sms_logs_created`, `idx_wallets_number`
  - _Requirements: 31.6, 32.2, 36.1_

- [ ] 2. Implement Wallet Lookup Engine
  - [x] 2.1 Create WalletLookupEngine interface and implementation
    - Implement `lookupWallet(walletNumber: string)` method
    - Return wallet number, full name, masked phone, status, KYC status
    - Reject lookups for LOCKED or FROZEN wallets
    - _Requirements: 31.1, 31.4, 31.5_
  
  - [x] 2.2 Implement phone masking utility
    - Create `maskPhone(phone: string)` function
    - Mask all but last 4 digits (format: ****1234)
    - _Requirements: 31.2_
  
  - [ ]* 2.3 Write property test for phone masking
    - **Property 2: Phone number masking**
    - **Validates: Requirements 31.2**
  
  - [ ]* 2.4 Write property test for sensitive data exclusion
    - **Property 3: Sensitive data exclusion**
    - **Validates: Requirements 31.3**
  
  - [x] 2.5 Create GET /wallet/lookup/:walletNumber endpoint
    - Add route handler with authentication middleware
    - Call WalletLookupEngine
    - Return 404 for non-existent wallets
    - _Requirements: 31.1, 31.7_

- [ ] 3. Implement MPESA deposit logging and idempotency
  - [x] 3.1 Create MPESALogRepository
    - Implement `createLog(receipt, phone, amount, rawPayload)` method
    - Implement `findByReceipt(receipt)` method for duplicate checking
    - _Requirements: 32.2, 32.4_
  
  - [x] 3.2 Update MPESA callback handler
    - Extract MPESA receipt, sender phone, amount, raw payload from callback
    - Check for duplicate receipt before processing
    - Log all MPESA deposits to mpesa_logs table
    - Return existing transaction if duplicate receipt found
    - _Requirements: 32.1, 32.4, 32.5_
  
  - [ ]* 3.3 Write property test for MPESA idempotency
    - **Property 6: MPESA receipt idempotency**
    - **Validates: Requirements 32.4, 32.5**
  
  - [x] 3.4 Update deposit SMS template
    - Format: "ABAN REMIT: Deposit of KES X received from 2547XXXXXXX. MPESA Ref: XXX New Balance: KES Y."
    - Include amount, masked sender phone, MPESA reference, new balance
    - _Requirements: 32.6_
  
  - [ ]* 3.5 Write property test for deposit SMS format
    - **Property 7: Deposit SMS format**
    - **Validates: Requirements 32.6**

- [x] 4. Checkpoint - Ensure wallet lookup and MPESA logging tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement enhanced withdrawal notifications
  - [x] 5.1 Create withdrawal configuration
    - Add `withdrawal_otp_threshold` to system configuration
    - Default threshold: 10,000 KES
    - _Requirements: 33.2_
  
  - [x] 5.2 Update withdrawal flow with OTP check
    - Check if withdrawal amount exceeds threshold
    - Generate and send OTP if threshold exceeded
    - Verify OTP before processing withdrawal
    - _Requirements: 33.2, 33.3_
  
  - [ ]* 5.3 Write property test for OTP requirement
    - **Property 9: OTP requirement for large withdrawals**
    - **Validates: Requirements 33.2**
  
  - [x] 5.4 Update withdrawal SMS template
    - Format: "ABAN REMIT: You have withdrawn KES X. Fee: KES Y Reference: TXN123 Available Balance: KES Z."
    - Include amount, fee, reference, available balance
    - _Requirements: 33.1, 33.4_
  
  - [ ]* 5.5 Write property test for withdrawal SMS format
    - **Property 8: Withdrawal SMS format**
    - **Validates: Requirements 33.1**

- [ ] 6. Implement Receipt Generation Engine
  - [x] 6.1 Create ReceiptEngine interface and implementation
    - Implement `generateReceipt(transactionReference: string)` method
    - Return PDF buffer and verification hash
    - _Requirements: 34.1_
  
  - [x] 6.2 Implement verification hash calculation
    - Create `calculateVerificationHash(reference, amount, createdAt)` function
    - Use SHA256(reference + amount + created_at)
    - Store hash in transactions table when transaction is created
    - _Requirements: 34.4, 34.5_
  
  - [ ]* 6.3 Write property test for verification hash
    - **Property 14: Verification hash calculation**
    - **Validates: Requirements 34.4**
  
  - [x] 6.4 Implement PDF generation with all required fields
    - Include: logo, reference, date/time, sender/receiver details, amount, fee, net amount, currency, status, provider reference, exchange rate, commission
    - Format for A4 printing with clean design
    - _Requirements: 34.2, 34.6_
  
  - [x] 6.5 Add QR code generation to receipt
    - Generate QR code containing transaction reference
    - Embed QR code in PDF footer
    - _Requirements: 34.3_
  
  - [ ]* 6.6 Write property test for receipt QR code
    - **Property 13: Receipt QR code content**
    - **Validates: Requirements 34.3**
  
  - [x] 6.7 Create GET /transactions/:reference/receipt endpoint
    - Add route handler with authentication
    - Call ReceiptEngine to generate PDF
    - Return PDF with appropriate headers
    - Return 404 for non-existent transactions
    - _Requirements: 34.1, 34.7_
  
  - [ ]* 6.8 Write property test for receipt availability
    - **Property 26: Receipt availability after completion**
    - **Validates: Requirements 37.8**

- [x] 7. Checkpoint - Ensure withdrawal and receipt generation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement fraud protection enhancements
  - [x] 8.1 Add self-transfer validation
    - Check sender wallet ID != receiver wallet ID in P2P transfers
    - Reject with error if same wallet
    - _Requirements: 35.1, 35.2_
  
  - [ ]* 8.2 Write property test for self-transfer prevention
    - **Property 16: Self-transfer prevention**
    - **Validates: Requirements 35.1**
  
  - [x] 8.3 Add wallet status validation for transfers
    - Verify both sender and receiver wallets are ACTIVE
    - Reject transfers if either wallet is not ACTIVE
    - _Requirements: 35.3_
  
  - [ ]* 8.4 Write property test for active wallet requirement
    - **Property 17: Active wallet requirement for transfers**
    - **Validates: Requirements 35.3**
  
  - [x] 8.5 Implement transaction locking
    - Use SELECT FOR UPDATE when reading wallet records in transactions
    - Apply to all balance-affecting operations
    - _Requirements: 35.4_
  
  - [x] 8.6 Verify balance derivation from ledger
    - Ensure all balance queries sum ledger entries
    - Remove any direct balance field updates
    - _Requirements: 35.7_
  
  - [ ]* 8.7 Write property test for balance derivation
    - **Property 18: Balance derivation from ledger**
    - **Validates: Requirements 35.7**

- [ ] 9. Implement SMS logging and cost tracking
  - [x] 9.1 Create SMSLogRepository
    - Implement `createLog(recipient, message, cost, status, providerMessageId)` method
    - Implement `findByDateRange(startDate, endDate)` method
    - Implement `updateStatus(id, status, errorMessage)` method
    - _Requirements: 36.1, 36.5_
  
  - [x] 9.2 Update SMS Engine to log all messages
    - Log every SMS attempt with recipient, message, cost, status
    - Include provider message ID when available
    - Log failures with error messages
    - _Requirements: 36.1, 36.2, 36.5_
  
  - [ ]* 9.3 Write property test for SMS log completeness
    - **Property 19: SMS log completeness**
    - **Validates: Requirements 36.1, 36.2**
  
  - [x] 9.4 Implement SMS cost reporting
    - Create `generateSMSCostReport(dateRange)` method
    - Calculate total messages, total cost, success rate
    - _Requirements: 36.3, 36.4_
  
  - [ ]* 9.5 Write property test for SMS cost report accuracy
    - **Property 20: SMS cost report accuracy**
    - **Validates: Requirements 36.3**
  
  - [x] 9.6 Create admin endpoint for SMS cost reports
    - Add GET /admin/reports/sms-costs endpoint
    - Support date range filtering
    - Require ADMIN role
    - _Requirements: 36.3, 36.4_

- [ ] 10. Implement complete transaction flow validation
  - [x] 10.1 Create standardized transfer flow orchestrator
    - Implement 9-step flow: lookup, confirmation, PIN validation, fee calculation, transaction creation, ledger entries, commit, SMS, receipt
    - Apply to all P2P transfers
    - _Requirements: 37.1_
  
  - [ ] 10.2 Add PIN validation to transfer flow
    - Verify sender's PIN matches stored hash
    - Reject transfer if PIN invalid
    - _Requirements: 37.3_
  
  - [ ]* 10.3 Write property test for PIN validation
    - **Property 22: PIN validation correctness**
    - **Validates: Requirements 37.3**
  
  - [ ] 10.4 Ensure fee calculation uses active configuration
    - Fetch active fee config for transaction type
    - Calculate fee based on amount and config
    - _Requirements: 37.4_
  
  - [ ]* 10.5 Write property test for fee calculation
    - **Property 23: Fee calculation consistency**
    - **Validates: Requirements 37.4**
  
  - [ ] 10.6 Ensure ledger entry atomicity
    - Wrap all ledger operations in database transaction
    - Rollback on any failure
    - _Requirements: 37.5_
  
  - [ ]* 10.7 Write property test for ledger atomicity
    - **Property 24: Ledger entry atomicity**
    - **Validates: Requirements 37.5**
  
  - [ ] 10.8 Ensure SMS notifications after commit
    - Send SMS to both sender and receiver after transaction commits
    - Make SMS sending async to not block response
    - _Requirements: 37.6, 37.7_
  
  - [ ]* 10.9 Write property test for SMS notification after commit
    - **Property 25: SMS notification after commit**
    - **Validates: Requirements 37.6**

- [ ] 11. Integration testing for new features
  - [ ]* 11.1 Write integration test for complete deposit flow
    - Test: STK Push → Callback → MPESA log → Transaction → Ledger → SMS
    - Verify idempotency with duplicate receipt
    - _Requirements: 32.3, 32.5_
  
  - [ ]* 11.2 Write integration test for complete withdrawal flow
    - Test: Request → OTP (if needed) → Validation → Ledger → B2C → SMS
    - Verify OTP requirement for large amounts
    - _Requirements: 33.2, 33.3_
  
  - [ ]* 11.3 Write integration test for complete transfer flow
    - Test: Lookup → Confirmation → PIN → Fee → Ledger → SMS (both) → Receipt
    - Verify all 9 steps execute in order
    - _Requirements: 37.1_
  
  - [ ]* 11.4 Write integration test for fraud prevention
    - Test self-transfer rejection
    - Test locked wallet rejection
    - Test MPESA duplicate rejection
    - _Requirements: 35.1, 35.3, 35.6_

- [ ] 12. Final checkpoint - Ensure all tests pass and system is ready
  - Run all unit tests and property tests
  - Run all integration tests
  - Verify database migrations are applied
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Database schema for Reconciliation Engine
  - Create `reconciliation_jobs` table with columns: id, job_type, status, start_date, end_date, total_transactions, matched_transactions, discrepancies_found, started_at, completed_at, created_by, error_message, created_at
  - Create `reconciliation_discrepancies` table with columns: id, job_id, discrepancy_type, severity, provider, provider_reference, transaction_id, expected_amount, actual_amount, details, status, resolution_notes, resolved_by, resolved_at, created_at
  - Create indexes: `idx_reconciliation_jobs_type`, `idx_reconciliation_jobs_status`, `idx_reconciliation_jobs_dates`, `idx_discrepancies_job`, `idx_discrepancies_status`, `idx_discrepancies_severity`, `idx_discrepancies_provider`, `idx_discrepancies_created`
  - Add CHECK constraints for job_type, status, discrepancy_type, severity
  - _Requirements: 38.8, 41.4, 42.1_

- [ ] 14. Implement Reconciliation Engine core interfaces
  - [ ] 14.1 Create ReconciliationEngine interface and base implementation
    - Implement `runReconciliation(request)` method
    - Implement `getReconciliationJob(jobId)` method
    - Implement `listReconciliationJobs(filters)` method
    - Implement `getDiscrepancies(filters)` method
    - Implement `resolveDiscrepancy(discrepancyId, resolution)` method
    - _Requirements: 41.3, 42.4, 42.5_
  
  - [ ] 14.2 Create ReconciliationJobRepository
    - Implement `createJob(jobType, startDate, endDate, createdBy)` method
    - Implement `updateJobStatus(jobId, status)` method
    - Implement `recordJobResults(jobId, results)` method
    - Implement `findJobById(jobId)` method
    - Implement `findJobs(filters)` method
    - _Requirements: 41.4, 41.5, 41.6, 41.7_
  
  - [ ] 14.3 Create DiscrepancyRepository
    - Implement `createDiscrepancy(discrepancy)` method
    - Implement `updateDiscrepancyStatus(discrepancyId, status, notes, resolvedBy)` method
    - Implement `findDiscrepancies(filters)` method
    - Implement `findDiscrepancyById(discrepancyId)` method
    - _Requirements: 42.1, 42.2, 42.5, 42.6, 42.7_
  
  - [ ]* 14.4 Write property test for date range filtering
    - **Property 27: Date range filtering for reconciliation**
    - **Validates: Requirements 38.1, 38.2, 39.1, 40.1**
  
  - [ ]* 14.5 Write property test for reconciliation job statistics
    - **Property 31: Reconciliation job statistics accuracy**
    - **Validates: Requirements 38.8, 41.8**

- [ ] 15. Implement MPESA Reconciliation
  - [ ] 15.1 Create MPESAReconciliationService
    - Implement `reconcileMPESA(startDate, endDate)` method
    - Fetch MPESA logs from services.mpesa_logs table
    - Fetch MPESA deposit transactions
    - Match logs to transactions by MPESA receipt number
    - Detect missing ledger entries, missing provider records, amount mismatches
    - _Requirements: 38.1, 38.2, 38.3_
  
  - [ ] 15.2 Implement MPESA matching logic
    - Match by MPESA receipt number
    - Compare amount, phone number, timestamp for matched pairs
    - Flag MISSING_LEDGER (CRITICAL) for logs without transactions
    - Flag MISSING_PROVIDER (HIGH) for transactions without logs
    - Flag AMOUNT_MISMATCH (HIGH) for amount differences
    - _Requirements: 38.3, 38.4, 38.5, 38.6, 38.7_
  
  - [ ]* 15.3 Write property test for MPESA receipt matching
    - **Property 28: MPESA receipt matching**
    - **Validates: Requirements 38.3**
  
  - [ ]* 15.4 Write property test for missing record detection
    - **Property 29: Missing record detection**
    - **Validates: Requirements 38.4, 38.5, 39.4, 39.5**
  
  - [ ]* 15.5 Write property test for amount mismatch detection
    - **Property 30: Amount mismatch detection**
    - **Validates: Requirements 38.7, 39.7**

- [ ] 16. Implement Paystack Reconciliation
  - [ ] 16.1 Create PaystackReconciliationService
    - Implement `reconcilePaystack(startDate, endDate)` method
    - Fetch Paystack payment logs (create services.paystack_logs table if needed)
    - Fetch card deposit transactions
    - Match logs to transactions by Paystack reference
    - Detect missing ledger entries, missing provider records, amount mismatches
    - _Requirements: 39.1, 39.2, 39.3_
  
  - [ ] 16.2 Implement Paystack matching logic
    - Match by Paystack reference
    - Compare amount and timestamp for matched pairs
    - Flag MISSING_LEDGER (CRITICAL) for logs without transactions
    - Flag MISSING_PROVIDER (HIGH) for transactions without logs
    - Flag AMOUNT_MISMATCH (HIGH) for amount differences
    - _Requirements: 39.3, 39.4, 39.5, 39.6, 39.7_

- [ ] 17. Implement Internal Ledger Reconciliation
  - [ ] 17.1 Create LedgerReconciliationService
    - Implement `reconcileLedger(startDate, endDate)` method
    - Fetch all ledger entries for date range
    - Group entries by transaction_id
    - Verify double-entry balance for each transaction
    - Check wallet balance consistency
    - _Requirements: 40.1, 40.2, 40.5_
  
  - [ ] 17.2 Implement double-entry verification
    - Sum all DEBIT entries per transaction
    - Sum all CREDIT entries per transaction
    - Flag UNBALANCED (CRITICAL) if debits != credits
    - _Requirements: 40.3, 40.4_
  
  - [ ]* 17.3 Write property test for ledger entry grouping
    - **Property 32: Ledger entry grouping by transaction**
    - **Validates: Requirements 40.2**
  
  - [ ]* 17.4 Write property test for double-entry balance
    - **Property 33: Double-entry balance verification**
    - **Validates: Requirements 40.3, 40.4**
  
  - [ ] 17.5 Implement wallet balance verification
    - Calculate balance from ledger entries for each wallet
    - Compare with expected balance
    - Flag BALANCE_MISMATCH (CRITICAL) if mismatch detected
    - _Requirements: 40.5, 40.6, 40.7_
  
  - [ ]* 17.6 Write property test for wallet balance calculation
    - **Property 34: Wallet balance calculation from ledger**
    - **Validates: Requirements 40.5**
  
  - [ ]* 17.7 Write property test for balance mismatch detection
    - **Property 35: Balance mismatch detection**
    - **Validates: Requirements 40.6, 40.7**

- [ ] 18. Checkpoint - Ensure reconciliation core logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Implement Automated Reconciliation Scheduling
  - [ ] 19.1 Create reconciliation cron job
    - Use node-cron to schedule daily job at 2:00 AM
    - Execute MPESA, Paystack, and Ledger reconciliation for previous day
    - Handle job failures with error logging
    - _Requirements: 41.1, 41.2_
  
  - [ ] 19.2 Implement job status management
    - Create job with status PENDING when triggered
    - Update to RUNNING when execution starts
    - Update to COMPLETED with timestamp when finished
    - Update to FAILED with error message on failure
    - _Requirements: 41.4, 41.5, 41.6, 41.7_
  
  - [ ]* 19.3 Write property test for job status transitions
    - **Property 37: Reconciliation job status transitions**
    - **Validates: Requirements 41.4, 41.5, 41.6, 41.7**
  
  - [ ] 19.4 Implement on-demand reconciliation
    - Create POST /admin/reconciliation/run endpoint
    - Accept jobType, startDate, endDate parameters
    - Trigger reconciliation for specified date range
    - Require ADMIN role
    - _Requirements: 41.3_
  
  - [ ]* 19.5 Write property test for on-demand execution
    - **Property 36: On-demand reconciliation execution**
    - **Validates: Requirements 41.3**

- [ ] 20. Implement Discrepancy Management
  - [ ] 20.1 Implement discrepancy creation logic
    - Create discrepancy records with all required fields
    - Set initial status to PENDING
    - Assign severity based on discrepancy type and amount
    - _Requirements: 42.1, 42.2_
  
  - [ ]* 20.2 Write property test for discrepancy record completeness
    - **Property 38: Discrepancy record completeness**
    - **Validates: Requirements 42.1**
  
  - [ ]* 20.3 Write property test for discrepancy initial status
    - **Property 39: Discrepancy initial status**
    - **Validates: Requirements 42.2**
  
  - [ ] 20.4 Implement discrepancy alerting
    - Send immediate email and SMS for CRITICAL severity
    - Send immediate email for HIGH severity
    - Queue MEDIUM/LOW for weekly summary
    - _Requirements: 42.3, 45.1, 45.2, 45.3_
  
  - [ ]* 20.5 Write property test for critical discrepancy alerting
    - **Property 40: Critical discrepancy alerting**
    - **Validates: Requirements 42.3, 45.1**
  
  - [ ] 20.6 Create GET /admin/reconciliation/discrepancies endpoint
    - Support filtering by status, severity, provider, date range
    - Return paginated results
    - Require ADMIN role
    - _Requirements: 42.4_
  
  - [ ]* 20.7 Write property test for discrepancy filtering
    - **Property 41: Discrepancy filtering**
    - **Validates: Requirements 42.4**
  
  - [ ] 20.8 Create PUT /admin/reconciliation/discrepancies/:id/resolve endpoint
    - Accept status (RESOLVED/IGNORED) and resolution notes
    - Update discrepancy status
    - Record admin user ID and timestamp
    - Require ADMIN role
    - _Requirements: 42.5, 42.6, 42.7_
  
  - [ ]* 20.9 Write property test for discrepancy resolution
    - **Property 42: Discrepancy resolution workflow**
    - **Validates: Requirements 42.5, 42.6, 42.7**

- [ ] 21. Implement Reconciliation Reports
  - [ ] 21.1 Create daily reconciliation summary report
    - Implement `generateDailySummary(date)` method
    - Return total transactions, matched, unmatched, discrepancies
    - Include breakdown by provider (MPESA, Paystack, Ledger)
    - _Requirements: 43.1_
  
  - [ ]* 21.2 Write property test for daily summary accuracy
    - **Property 43: Daily reconciliation summary accuracy**
    - **Validates: Requirements 43.1**
  
  - [ ] 21.3 Create detailed discrepancy report
    - Implement `generateDetailedDiscrepancyReport(startDate, endDate)` method
    - Return all discrepancies with transaction details
    - Include provider references and amounts
    - _Requirements: 43.2_
  
  - [ ]* 21.4 Write property test for detailed report completeness
    - **Property 44: Detailed discrepancy report completeness**
    - **Validates: Requirements 43.2**
  
  - [ ] 21.5 Create trend analysis report
    - Implement `generateTrendAnalysis(startDate, endDate)` method
    - Calculate discrepancy rates over time
    - Include match rate trends and provider comparison
    - _Requirements: 43.3_
  
  - [ ]* 21.6 Write property test for trend analysis calculation
    - **Property 45: Trend analysis calculation**
    - **Validates: Requirements 43.3**
  
  - [ ] 21.7 Implement report export functionality
    - Support CSV export with all fields and headers
    - Support PDF export with A4 formatting
    - Create GET /admin/reconciliation/reports/export endpoint
    - _Requirements: 43.4, 43.5, 43.6_
  
  - [ ]* 21.8 Write property test for CSV report structure
    - **Property 46: CSV report structure**
    - **Validates: Requirements 43.5**
  
  - [ ] 21.9 Create report API endpoints
    - GET /admin/reconciliation/reports/daily?date=YYYY-MM-DD
    - GET /admin/reconciliation/reports/trends?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
    - All endpoints require ADMIN role
    - _Requirements: 43.1, 43.2, 43.3_

- [ ] 22. Implement Reconciliation Metrics
  - [ ] 22.1 Create ReconciliationMetricsService
    - Implement `calculateMatchRate(matched, total)` method
    - Implement `calculateAverageReconciliationTime(dateRange)` method
    - Implement `calculateAverageResolutionTime(dateRange)` method
    - Implement `calculateProviderReliabilityScore(provider, dateRange)` method
    - _Requirements: 44.1, 44.2, 44.3, 44.4, 44.5_
  
  - [ ]* 22.2 Write property test for match rate calculation
    - **Property 47: Match rate calculation**
    - **Validates: Requirements 44.1**
  
  - [ ]* 22.3 Write property test for average reconciliation time
    - **Property 48: Average reconciliation time calculation**
    - **Validates: Requirements 44.2**
  
  - [ ]* 22.4 Write property test for average resolution time
    - **Property 49: Average discrepancy resolution time calculation**
    - **Validates: Requirements 44.3**
  
  - [ ]* 22.5 Write property test for reliability score calculation
    - **Property 50: Provider reliability score calculation**
    - **Validates: Requirements 44.4, 44.5**
  
  - [ ] 22.6 Create GET /admin/reconciliation/metrics endpoint
    - Accept optional days parameter (default: 30)
    - Return match rate, average times, reliability scores, trend data
    - Require ADMIN role
    - _Requirements: 44.1, 44.2, 44.3, 44.4, 44.6_

- [ ] 23. Implement Reconciliation Notifications
  - [ ] 23.1 Create notification templates
    - Email template for CRITICAL discrepancies
    - Email template for daily HIGH severity summary
    - Email template for weekly MEDIUM/LOW summary
    - SMS template for CRITICAL discrepancies
    - _Requirements: 45.1, 45.2, 45.3_
  
  - [ ] 23.2 Implement notification sending logic
    - Send immediate email and SMS for CRITICAL severity
    - Queue HIGH severity for daily summary
    - Queue MEDIUM/LOW for weekly summary
    - Include discrepancy type, severity, provider, amount, reference
    - Include link to admin panel in emails
    - _Requirements: 45.1, 45.2, 45.3, 45.4, 45.5_
  
  - [ ]* 23.3 Write property test for notification content
    - **Property 51: Notification content completeness**
    - **Validates: Requirements 45.4**
  
  - [ ]* 23.4 Write property test for email link inclusion
    - **Property 52: Notification email link inclusion**
    - **Validates: Requirements 45.5**
  
  - [ ] 23.5 Implement notification batching
    - Create daily summary job for HIGH severity discrepancies
    - Create weekly summary job for MEDIUM/LOW severity discrepancies
    - Schedule using cron jobs
    - _Requirements: 45.2, 45.3_

- [ ] 24. Implement remaining reconciliation API endpoints
  - [ ] 24.1 Create GET /admin/reconciliation/jobs endpoint
    - Support filtering by jobType, status
    - Return paginated list of jobs
    - Require ADMIN role
    - _Requirements: 41.3_
  
  - [ ] 24.2 Create GET /admin/reconciliation/jobs/:id endpoint
    - Return job details including statistics
    - Require ADMIN role
    - _Requirements: 41.3_

- [ ] 25. Integration testing for Reconciliation Engine
  - [ ]* 25.1 Write integration test for complete MPESA reconciliation flow
    - Test: Create MPESA logs and transactions → Run reconciliation → Verify discrepancies detected
    - Test missing ledger, missing provider, amount mismatch scenarios
    - _Requirements: 38.1, 38.2, 38.3, 38.4, 38.5, 38.7_
  
  - [ ]* 25.2 Write integration test for complete Paystack reconciliation flow
    - Test: Create Paystack logs and transactions → Run reconciliation → Verify discrepancies detected
    - _Requirements: 39.1, 39.2, 39.3, 39.4, 39.5, 39.7_
  
  - [ ]* 25.3 Write integration test for ledger reconciliation flow
    - Test: Create unbalanced ledger entries → Run reconciliation → Verify UNBALANCED flagged
    - Test: Create wallet with balance mismatch → Run reconciliation → Verify BALANCE_MISMATCH flagged
    - _Requirements: 40.1, 40.2, 40.3, 40.4, 40.5, 40.6, 40.7_
  
  - [ ]* 25.4 Write integration test for automated daily reconciliation
    - Test: Trigger scheduled job → Verify all three reconciliation types execute
    - _Requirements: 41.1, 41.2_
  
  - [ ]* 25.5 Write integration test for discrepancy resolution workflow
    - Test: Create discrepancy → Resolve → Verify status updated and audit trail
    - _Requirements: 42.5, 42.6, 42.7_
  
  - [ ]* 25.6 Write integration test for critical discrepancy alerting
    - Test: Create CRITICAL discrepancy → Verify email and SMS sent
    - _Requirements: 42.3, 45.1_

- [ ] 26. Performance optimization for Reconciliation Engine
  - [ ] 26.1 Implement batch processing for large datasets
    - Process reconciliation in batches of 1,000 transactions
    - Use database cursors for large result sets
    - Implement progress tracking for long-running jobs
    - _Requirements: 38.1, 39.1, 40.1_
  
  - [ ] 26.2 Add caching for reconciliation results
    - Cache reconciliation job results for 24 hours
    - Cache provider reliability scores for 1 hour
    - Invalidate cache when discrepancies are resolved
    - _Requirements: 44.4_
  
  - [ ] 26.3 Verify performance targets
    - Test processing 10,000 transactions in < 5 minutes
    - Test daily report generation in < 10 seconds
    - Test API response times < 500ms for list endpoints
    - _Requirements: 38.8, 43.1_

- [ ] 27. Final checkpoint - Ensure all reconciliation tests pass
  - Run all unit tests and property tests for reconciliation
  - Run all integration tests for reconciliation
  - Verify cron jobs are configured correctly
  - Verify all API endpoints are secured with ADMIN role
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows
- All financial operations must maintain double-entry ledger integrity
- All SMS must be logged for audit and cost tracking
- All transactions must support idempotency
- Reconciliation jobs should be monitored for failures and performance
- Critical discrepancies require immediate attention from finance team
