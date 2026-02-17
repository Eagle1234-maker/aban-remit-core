# Implementation Plan: Live API Integration

## Overview

This implementation plan breaks down the live API integration into discrete, incremental coding tasks. The plan follows a bottom-up approach: first implementing shared utilities and the HTTP client, then building each API engine, followed by callback handlers, and finally integration and testing. Each task builds on previous work, ensuring no orphaned code.

The implementation will use TypeScript (matching the existing codebase) and follow the existing engine pattern established in the codebase.

## Tasks

- [x] 1. Set up environment configuration and validation
  - Update `.env` file with production API credentials
  - Create configuration loader that validates all required environment variables at startup
  - Implement configuration error handling with clear error messages
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 20.5_

- [ ] 2. Implement phone number utilities
  - [x] 2.1 Create phone number normalization functions
    - Implement `normalizeForMPesa()` to convert any format to 254XXXXXXXXX
    - Implement `normalizeForTalkSasa()` to convert to required format
    - Implement `normalizeForInstalipa()` to convert to 254XXXXXXXXX
    - Implement `isValidKenyanPhone()` validation function
    - _Requirements: 2.5, 5.6, 7.4, 18.1, 18.2, 18.3, 18.4_
  
  - [ ]* 2.2 Write property tests for phone normalization
    - **Property 4: Phone Number Normalization for M-Pesa**
    - **Property 5: Phone Number Normalization for TalkSasa**
    - **Property 6: Phone Number Normalization for Instalipa**
    - **Property 7: Phone Number Validation**
    - **Validates: Requirements 2.5, 5.6, 7.4, 18.1, 18.2, 18.3, 18.4**
  
  - [ ]* 2.3 Write unit tests for phone utilities
    - Test edge cases: with/without +, with/without leading 0, invalid formats
    - Test validation: too short, too long, non-Kenyan numbers
    - _Requirements: 18.4_

- [ ] 3. Implement HTTP client with retry logic
  - [x] 3.1 Create base HTTP client
    - Implement request method with timeout support
    - Implement request/response logging with correlation IDs
    - Implement sensitive data redaction in logs
    - Add support for custom headers and request bodies
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.4, 20.1, 20.4_
  
  - [x] 3.2 Implement retry logic
    - Implement exponential backoff for network errors and 5xx errors
    - Implement 401 token refresh and retry
    - Implement 429 rate limit handling with retry-after
    - Implement non-retryable 4xx error handling
    - Implement retry exhaustion error handling
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_
  
  - [ ]* 3.3 Write property tests for retry logic
    - **Property 14: Network Error Retry with Exponential Backoff**
    - **Property 15: Non-Retryable Client Errors**
    - **Property 16: Rate Limit Handling**
    - **Property 17: Retry Exhaustion**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7**
  
  - [ ]* 3.4 Write property tests for logging
    - **Property 18: Request Logging**
    - **Property 19: Response Logging**
    - **Property 20: Sensitive Data Redaction**
    - **Property 21: Correlation ID Tracing**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 20.1, 20.4**
  
  - [ ]* 3.5 Write unit tests for HTTP client
    - Test timeout behavior
    - Test different error scenarios
    - Test retry backoff timing
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 4. Checkpoint - Ensure utilities and HTTP client tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement M-Pesa Daraja API engine
  - [x] 5.1 Create M-Pesa engine interface and types
    - Define `MPesaEngine` interface with methods
    - Define `STKPushResult` and `TransactionStatusResult` types
    - Define M-Pesa specific error types
    - _Requirements: 1.1, 2.1_
  
  - [x] 5.2 Implement OAuth authentication
    - Implement `getAccessToken()` method with OAuth 2.0 client credentials flow
    - Implement token caching in memory or database
    - Implement automatic token refresh on expiration
    - Load credentials from environment variables
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 5.3 Write property tests for OAuth authentication
    - **Property 1: OAuth Token Caching**
    - **Property 2: OAuth Token Auto-Refresh**
    - **Validates: Requirements 1.2, 1.3, 1.4, 6.4, 10.2**
  
  - [x] 5.4 Implement STK Push functionality
    - Implement password generation using Base64(Shortcode + Passkey + Timestamp)
    - Implement `initiateSTKPush()` method
    - Validate phone numbers before sending requests
    - Handle success and error responses
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 5.5 Write property test for password generation
    - **Property 3: M-Pesa Password Generation**
    - **Validates: Requirements 2.1**
  
  - [x] 5.6 Implement transaction status query
    - Implement `queryTransactionStatus()` method
    - Parse and return transaction status details
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [ ]* 5.7 Write unit tests for M-Pesa engine
    - Test STK Push with valid inputs
    - Test STK Push with invalid phone numbers
    - Test error handling for API failures
    - Test transaction status query
    - _Requirements: 2.3, 2.4, 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 6. Implement TalkSasa SMS API engine
  - [x] 6.1 Create TalkSasa engine interface and types
    - Define `TalkSasaEngine` interface
    - Define `SMSResult` type (reuse existing if compatible)
    - Define TalkSasa specific error types
    - _Requirements: 4.1_
  
  - [x] 6.2 Implement SMS sending functionality
    - Implement `sendSMS()` method with Bearer token authentication
    - Implement `sendOTP()` method
    - Implement `sendTransactionNotification()` method
    - Validate phone numbers before sending
    - Parse provider response and extract message ID
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.6_
  
  - [x] 6.3 Integrate with SMS log repository
    - Log every SMS attempt with all required fields
    - Store provider message ID for tracking
    - _Requirements: 5.5_
  
  - [ ]* 6.4 Write property test for SMS logging
    - **Property 12: SMS Logging Completeness**
    - **Validates: Requirements 5.5**
  
  - [ ]* 6.5 Write unit tests for TalkSasa engine
    - Test SMS sending with valid inputs
    - Test SMS sending with invalid phone numbers
    - Test error handling for API failures
    - Test OTP and notification methods
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

- [x] 7. Implement Instalipa Airtime API engine
  - [x] 7.1 Create Instalipa engine interface and types
    - Define `InstalipaEngine` interface
    - Define `AirtimePurchaseResult` and `BalanceResult` types
    - Define Instalipa specific error types
    - _Requirements: 6.1_
  
  - [x] 7.2 Implement OAuth authentication
    - Implement `getAccessToken()` method with OAuth 2.0 client credentials flow
    - Implement token caching (reuse M-Pesa caching logic if possible)
    - Implement automatic token refresh
    - Load credentials from environment variables
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 7.3 Implement airtime purchase functionality
    - Implement `purchaseAirtime()` method
    - Validate phone numbers and amounts before sending
    - Parse provider response and extract transaction reference
    - Handle success and error responses
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 7.4 Implement balance query functionality
    - Implement `queryBalance()` method
    - Implement 5-minute caching for balance queries
    - Log warning when balance is below threshold
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [x] 7.5 Create airtime log repository
    - Create `AirtimeLogRepository` interface
    - Implement repository with create and update methods
    - Integrate with airtime engine to log all attempts
    - _Requirements: 7.5_
  
  - [ ]* 7.6 Write property test for airtime logging
    - **Property 13: Airtime Logging Completeness**
    - **Validates: Requirements 7.5**
  
  - [ ]* 7.7 Write unit tests for Instalipa engine
    - Test airtime purchase with valid inputs
    - Test airtime purchase with invalid inputs
    - Test balance query and caching
    - Test error handling
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 15.1, 15.2, 15.3, 15.4_

- [ ] 8. Checkpoint - Ensure all API engines tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Create database migrations
  - [ ] 9.1 Create migration for mpesa_logs table updates
    - Add columns: checkout_request_id, merchant_request_id, transaction_date, result_code, result_desc
    - Add indexes on new columns
    - _Requirements: 3.2_
  
  - [ ] 9.2 Create migration for sms_logs table updates
    - Add columns: delivered_at, delivery_status, delivery_error
    - Add index on delivery_status
    - _Requirements: 14.3_
  
  - [ ] 9.3 Create migration for airtime_logs table
    - Create table with all required columns
    - Add indexes for performance
    - Add unique constraint on transaction_reference
    - _Requirements: 7.5, 8.3_
  
  - [ ] 9.4 Create migration for api_token_cache table
    - Create table for caching OAuth tokens
    - Add primary key on provider
    - _Requirements: 1.3, 6.3_

- [ ] 10. Implement M-Pesa callback handler
  - [ ] 10.1 Create callback route and handler
    - Create POST route at `/api/callbacks/mpesa`
    - Implement callback validation (check required fields)
    - Parse callback structure and extract data
    - _Requirements: 3.1, 3.2_
  
  - [ ] 10.2 Implement idempotency checking
    - Check if receipt number exists in mpesa_logs table
    - Return success without processing if duplicate
    - Log duplicate attempts
    - _Requirements: 3.3, 17.1, 17.2, 17.5_
  
  - [ ]* 10.3 Write property tests for callback processing
    - **Property 8: M-Pesa Callback Idempotency**
    - **Property 9: M-Pesa Callback Processing**
    - **Property 10: Failed Payment Handling**
    - **Property 11: Callback HTTP Response**
    - **Property 25: Duplicate Callback Logging**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 17.1, 17.2, 17.3, 17.5**
  
  - [ ] 10.4 Implement wallet crediting logic
    - Create mpesa_log entry
    - Credit user wallet using existing wallet service
    - Send SMS notification using TalkSasa engine
    - Handle failed payments (log only, no credit)
    - _Requirements: 3.4, 3.5_
  
  - [ ]* 10.5 Write integration tests for callback handler
    - Test successful payment callback end-to-end
    - Test failed payment callback
    - Test duplicate callback handling
    - Test invalid callback structure
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 11. Implement Instalipa airtime callback handler
  - [ ] 11.1 Create callback route and handler
    - Create POST route at `/functions/v1/airtime-callback`
    - Implement callback validation (signature if provided)
    - Parse callback structure and extract data
    - _Requirements: 8.1, 8.2_
  
  - [ ] 11.2 Implement status update logic
    - Find airtime transaction by reference ID
    - Update transaction status and completed_at timestamp
    - Store provider response in airtime_logs
    - Send SMS notification for successful purchases
    - _Requirements: 8.3, 8.4_
  
  - [ ]* 11.3 Write property tests for airtime callback
    - **Property 23: Airtime Callback Status Update**
    - **Validates: Requirements 8.3**
  
  - [ ]* 11.4 Write integration tests for airtime callback handler
    - Test successful airtime delivery callback
    - Test failed airtime delivery callback
    - Test callback with invalid reference
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 12. Implement SMS delivery status webhook (optional)
  - [ ] 12.1 Create webhook route and handler
    - Create POST route for TalkSasa delivery status webhooks
    - Parse webhook payload
    - _Requirements: 14.2_
  
  - [ ] 12.2 Update SMS log with delivery status
    - Find SMS log by provider message ID
    - Update delivery_status, delivered_at, and delivery_error
    - _Requirements: 14.3, 14.4_
  
  - [ ]* 12.3 Write unit tests for delivery status webhook
    - Test delivery status updates
    - Test various delivery statuses (DELIVERED, FAILED, EXPIRED)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 13. Update existing SMS engine implementation
  - [ ] 13.1 Replace mock SMS provider with TalkSasa engine
    - Update `SMSEngineImpl` to use `TalkSasaEngine`
    - Remove mock SMS provider code
    - Ensure interface compatibility
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 13.2 Update SMS engine tests
    - Update tests to work with real TalkSasa integration
    - Add tests for production scenarios
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 14. Create API health check endpoints
  - [ ] 14.1 Implement health check for M-Pesa API
    - Create lightweight test request (e.g., token request)
    - Return healthy/unhealthy status with details
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [ ] 14.2 Implement health check for TalkSasa API
    - Create lightweight test request
    - Return healthy/unhealthy status with details
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [ ] 14.3 Implement health check for Instalipa API
    - Create lightweight test request (e.g., balance query)
    - Return healthy/unhealthy status with details
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [ ] 14.4 Create admin health check route
    - Create GET route at `/api/admin/health/external-apis`
    - Call all health checks and aggregate results
    - Return overall health status with per-API details
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
  
  - [ ]* 14.5 Write unit tests for health checks
    - Test healthy API responses
    - Test unhealthy API responses
    - Test health check aggregation
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 15. Implement rate limiting protection
  - [ ] 15.1 Create rate limiter utility
    - Implement request counter per provider per minute
    - Implement request queuing when approaching limits
    - Load rate limit configurations from environment
    - _Requirements: 19.1, 19.2, 19.3, 19.4_
  
  - [ ] 15.2 Integrate rate limiter with API engines
    - Add rate limiting to M-Pesa engine
    - Add rate limiting to TalkSasa engine
    - Add rate limiting to Instalipa engine
    - Log rate limiting events
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_
  
  - [ ]* 15.3 Write unit tests for rate limiter
    - Test request counting
    - Test request queuing
    - Test rate limit enforcement
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 16. Create admin endpoints for monitoring
  - [ ] 16.1 Create endpoint to query airtime balance
    - Create GET route at `/api/admin/airtime/balance`
    - Call Instalipa engine balance query
    - Return balance with currency
    - Require admin authentication
    - _Requirements: 15.5_
  
  - [ ] 16.2 Create endpoint to view API metrics
    - Create GET route at `/api/admin/metrics/apis`
    - Return success rates, error rates, response times per API
    - Aggregate from logs or metrics store
    - _Requirements: 16.5_
  
  - [ ]* 16.3 Write unit tests for admin endpoints
    - Test balance query endpoint
    - Test metrics endpoint
    - Test authentication requirements
    - _Requirements: 15.5, 16.5_

- [ ] 17. Checkpoint - Ensure all integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Update environment configuration file
  - [ ] 18.1 Update .env file with production credentials
    - Add all M-Pesa configuration variables
    - Add all TalkSasa configuration variables
    - Add all Instalipa configuration variables
    - Add timeout configurations
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_
  
  - [ ] 18.2 Create .env.example file
    - Document all required environment variables
    - Provide example values (not real credentials)
    - Add comments explaining each variable
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

- [ ] 19. Create integration documentation
  - [ ] 19.1 Document M-Pesa integration
    - Document STK Push flow
    - Document callback handling
    - Document error codes and handling
    - Provide example requests and responses
    - _Requirements: 1.1, 2.1, 3.1_
  
  - [ ] 19.2 Document TalkSasa integration
    - Document SMS sending flow
    - Document delivery status tracking
    - Document error codes and handling
    - Provide example requests and responses
    - _Requirements: 4.1, 5.1_
  
  - [ ] 19.3 Document Instalipa integration
    - Document airtime purchase flow
    - Document callback handling
    - Document balance query
    - Document error codes and handling
    - Provide example requests and responses
    - _Requirements: 6.1, 7.1, 8.1_

- [ ] 20. Final checkpoint - Run all tests and verify integrations
  - Run all unit tests, property tests, and integration tests
  - Verify all API engines work with production credentials (in test mode if available)
  - Verify callback handlers process test callbacks correctly
  - Verify health checks return correct status
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests validate end-to-end flows with database operations
- All API credentials are loaded from environment variables for security
- The implementation follows the existing engine pattern in the codebase
- Database migrations must be run before deploying callback handlers
- Health check endpoints enable monitoring of external API status
- Rate limiting protects against exceeding provider limits
