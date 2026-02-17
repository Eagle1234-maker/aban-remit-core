# Requirements Document: Live API Integration

## Introduction

This document specifies the requirements for integrating live production APIs into the Aban Remit system. The system currently has mock implementations for SMS, M-Pesa, and wallet lookup services. This feature will replace mock implementations with real API integrations for M-Pesa Daraja API, TalkSasa Bulk SMS API, and Instalipa Airtime API, ensuring production-ready functionality with proper security, error handling, and real-time operations.

## Glossary

- **M-Pesa_Daraja_API**: Safaricom's mobile money API for processing payments and transactions
- **TalkSasa_API**: Bulk SMS service provider API for sending SMS messages
- **Instalipa_API**: Airtime distribution API for purchasing and distributing mobile airtime
- **OAuth_Token**: Authentication token obtained through OAuth 2.0 protocol
- **Access_Token**: Time-limited authentication credential for API requests
- **Callback_URL**: HTTP endpoint that receives asynchronous notifications from external APIs
- **STK_Push**: SIM Toolkit Push - M-Pesa feature that prompts users to enter PIN on their phone
- **Passkey**: Security credential used to generate M-Pesa API passwords
- **Short_Code**: Business identifier number used in M-Pesa transactions
- **Sender_ID**: Alphanumeric identifier displayed as SMS sender
- **API_Engine**: Service layer component that encapsulates external API communication
- **Environment_Variable**: Configuration value stored in .env file
- **Idempotency**: Property ensuring duplicate requests produce the same result
- **Rate_Limiting**: Mechanism to control API request frequency
- **Retry_Logic**: Automatic re-attempt mechanism for failed API requests

## Requirements

### Requirement 1: M-Pesa Daraja API Authentication

**User Story:** As a system administrator, I want the system to authenticate with M-Pesa Daraja API using production credentials, so that the system can process real mobile money transactions.

#### Acceptance Criteria

1. WHEN the system starts, THE M-Pesa_Daraja_API engine SHALL load Consumer Key and Consumer Secret from Environment_Variables
2. WHEN authentication is needed, THE M-Pesa_Daraja_API engine SHALL request an Access_Token using OAuth 2.0 client credentials flow
3. WHEN an Access_Token is received, THE M-Pesa_Daraja_API engine SHALL cache the token until expiration
4. WHEN an Access_Token expires, THE M-Pesa_Daraja_API engine SHALL automatically request a new token
5. IF authentication fails, THEN THE M-Pesa_Daraja_API engine SHALL log the error with details and throw an authentication error

### Requirement 2: M-Pesa STK Push Integration

**User Story:** As a user, I want to deposit money using M-Pesa STK Push, so that I can fund my wallet securely through my mobile phone.

#### Acceptance Criteria

1. WHEN a deposit is initiated, THE M-Pesa_Daraja_API engine SHALL generate a password using Base64(Shortcode + Passkey + Timestamp)
2. WHEN initiating STK Push, THE M-Pesa_Daraja_API engine SHALL send request with Short_Code, phone number, amount, Callback_URL, and generated password
3. WHEN STK Push is successful, THE M-Pesa_Daraja_API engine SHALL return the checkout request ID
4. WHEN STK Push request fails, THE M-Pesa_Daraja_API engine SHALL return error details including result code and description
5. THE M-Pesa_Daraja_API engine SHALL validate phone numbers are in format 254XXXXXXXXX before sending requests

### Requirement 3: M-Pesa Callback Handler

**User Story:** As a system, I want to receive and process M-Pesa payment callbacks, so that deposits are credited to user wallets automatically.

#### Acceptance Criteria

1. WHEN a callback is received, THE Callback_Handler SHALL validate the request contains required M-Pesa fields
2. WHEN a callback indicates successful payment, THE Callback_Handler SHALL extract receipt number, phone, amount, and transaction date
3. WHEN processing a callback, THE Callback_Handler SHALL check for duplicate receipt numbers using idempotency
4. WHEN a new successful payment is confirmed, THE Callback_Handler SHALL credit the user wallet and log the transaction
5. IF a callback indicates failed payment, THEN THE Callback_Handler SHALL log the failure without crediting the wallet
6. WHEN callback processing completes, THE Callback_Handler SHALL return HTTP 200 response to M-Pesa

### Requirement 4: TalkSasa SMS API Authentication

**User Story:** As a system administrator, I want the system to authenticate with TalkSasa API using production credentials, so that the system can send SMS messages to users.

#### Acceptance Criteria

1. WHEN the system starts, THE TalkSasa_API engine SHALL load API Token from Environment_Variables
2. WHEN making API requests, THE TalkSasa_API engine SHALL include the API Token in the Authorization header as Bearer token
3. IF the API Token is missing or invalid, THEN THE TalkSasa_API engine SHALL throw a configuration error

### Requirement 5: TalkSasa Bulk SMS Integration

**User Story:** As a user, I want to receive SMS notifications for transactions and OTPs, so that I am informed about account activity.

#### Acceptance Criteria

1. WHEN sending an SMS, THE TalkSasa_API engine SHALL make POST request to https://bulksms.talksasa.com/api/v3/sms/send
2. WHEN sending an SMS, THE TalkSasa_API engine SHALL include Sender_ID "ABAN_COOL", recipient phone, and message content
3. WHEN SMS is sent successfully, THE TalkSasa_API engine SHALL extract and return the provider message ID
4. WHEN SMS sending fails, THE TalkSasa_API engine SHALL return error status with error message from provider
5. THE TalkSasa_API engine SHALL log every SMS attempt with recipient, message, cost, status, and provider response
6. THE TalkSasa_API engine SHALL validate phone numbers are in valid Kenyan format before sending

### Requirement 6: Instalipa Airtime API Authentication

**User Story:** As a system administrator, I want the system to authenticate with Instalipa API using production credentials, so that the system can purchase and distribute airtime.

#### Acceptance Criteria

1. WHEN the system starts, THE Instalipa_API engine SHALL load Consumer Key and Consumer Secret from Environment_Variables
2. WHEN authentication is needed, THE Instalipa_API engine SHALL request an Access_Token using OAuth 2.0 client credentials flow
3. WHEN an Access_Token is received, THE Instalipa_API engine SHALL cache the token until expiration
4. WHEN an Access_Token expires, THE Instalipa_API engine SHALL automatically request a new token
5. IF authentication fails, THEN THE Instalipa_API engine SHALL log the error and throw an authentication error

### Requirement 7: Instalipa Airtime Purchase Integration

**User Story:** As a user, I want to purchase airtime for mobile phones, so that I can top up my phone or send airtime to others.

#### Acceptance Criteria

1. WHEN an airtime purchase is initiated, THE Instalipa_API engine SHALL send request with phone number, amount, and reference ID
2. WHEN airtime purchase is submitted, THE Instalipa_API engine SHALL return a transaction reference for tracking
3. WHEN airtime purchase request fails, THE Instalipa_API engine SHALL return error details including error code and message
4. THE Instalipa_API engine SHALL validate phone numbers and amounts before sending requests
5. THE Instalipa_API engine SHALL log every airtime purchase attempt with phone, amount, status, and provider response

### Requirement 8: Instalipa Airtime Callback Handler

**User Story:** As a system, I want to receive and process Instalipa airtime callbacks, so that airtime purchases are confirmed and logged automatically.

#### Acceptance Criteria

1. WHEN a callback is received at https://abanremit.com/functions/v1/airtime-callback, THE Callback_Handler SHALL validate the request signature
2. WHEN a callback indicates successful airtime delivery, THE Callback_Handler SHALL extract transaction reference, phone, amount, and status
3. WHEN processing a callback, THE Callback_Handler SHALL update the airtime transaction status in the database
4. IF a callback indicates failed airtime delivery, THEN THE Callback_Handler SHALL log the failure and update transaction status
5. WHEN callback processing completes, THE Callback_Handler SHALL return HTTP 200 response to Instalipa

### Requirement 9: Environment Configuration Management

**User Story:** As a system administrator, I want all API credentials stored securely in environment variables, so that sensitive information is not exposed in code.

#### Acceptance Criteria

1. THE system SHALL load M-Pesa Consumer Key from MPESA_CONSUMER_KEY Environment_Variable
2. THE system SHALL load M-Pesa Consumer Secret from MPESA_CONSUMER_SECRET Environment_Variable
3. THE system SHALL load M-Pesa Short_Code from MPESA_SHORTCODE Environment_Variable
4. THE system SHALL load M-Pesa Passkey from MPESA_PASSKEY Environment_Variable
5. THE system SHALL load TalkSasa API Token from TALKSASA_API_TOKEN Environment_Variable
6. THE system SHALL load TalkSasa Sender_ID from TALKSASA_SENDER_ID Environment_Variable
7. THE system SHALL load Instalipa Consumer Key from INSTALIPA_CONSUMER_KEY Environment_Variable
8. THE system SHALL load Instalipa Consumer Secret from INSTALIPA_CONSUMER_SECRET Environment_Variable
9. THE system SHALL load Instalipa Callback_URL from INSTALIPA_CALLBACK_URL Environment_Variable
10. IF any required Environment_Variable is missing, THEN THE system SHALL throw a configuration error at startup

### Requirement 10: API Error Handling and Retry Logic

**User Story:** As a system, I want to handle API failures gracefully with retry logic, so that temporary network issues do not cause permanent transaction failures.

#### Acceptance Criteria

1. WHEN an API request fails with network error, THE API_Engine SHALL retry up to 3 times with exponential backoff
2. WHEN an API request fails with 401 Unauthorized, THE API_Engine SHALL refresh the Access_Token and retry once
3. WHEN an API request fails with 429 Rate Limit, THE API_Engine SHALL wait for the specified retry-after period and retry
4. WHEN an API request fails with 5xx server error, THE API_Engine SHALL retry up to 3 times with exponential backoff
5. WHEN an API request fails with 4xx client error (except 401 and 429), THE API_Engine SHALL not retry and return error immediately
6. WHEN all retry attempts are exhausted, THE API_Engine SHALL log the final error and throw an exception
7. THE API_Engine SHALL log each retry attempt with attempt number, error, and wait time

### Requirement 11: API Request and Response Logging

**User Story:** As a system administrator, I want all API requests and responses logged, so that I can audit transactions and troubleshoot issues.

#### Acceptance Criteria

1. WHEN an API request is made, THE API_Engine SHALL log the request method, URL, headers (excluding sensitive tokens), and body
2. WHEN an API response is received, THE API_Engine SHALL log the response status code, headers, and body
3. WHEN logging API data, THE API_Engine SHALL redact sensitive information including passwords, tokens, and full card numbers
4. THE API_Engine SHALL include correlation IDs in logs to trace requests across systems
5. THE API_Engine SHALL log request duration in milliseconds for performance monitoring

### Requirement 12: API Timeout Configuration

**User Story:** As a system, I want API requests to timeout after a reasonable period, so that the system does not hang indefinitely waiting for responses.

#### Acceptance Criteria

1. WHEN making M-Pesa API requests, THE M-Pesa_Daraja_API engine SHALL set timeout to 30 seconds
2. WHEN making TalkSasa API requests, THE TalkSasa_API engine SHALL set timeout to 15 seconds
3. WHEN making Instalipa API requests, THE Instalipa_API engine SHALL set timeout to 30 seconds
4. WHEN a request times out, THE API_Engine SHALL log the timeout and include it in retry logic
5. THE system SHALL load timeout values from Environment_Variables with defaults if not specified

### Requirement 13: M-Pesa Transaction Status Query

**User Story:** As a system, I want to query M-Pesa transaction status, so that I can verify payment status when callbacks are delayed or missed.

#### Acceptance Criteria

1. WHEN querying transaction status, THE M-Pesa_Daraja_API engine SHALL send request with checkout request ID
2. WHEN status query is successful, THE M-Pesa_Daraja_API engine SHALL return transaction status, receipt number, and amount
3. WHEN status query indicates completed transaction, THE M-Pesa_Daraja_API engine SHALL return success with transaction details
4. WHEN status query indicates pending transaction, THE M-Pesa_Daraja_API engine SHALL return pending status
5. WHEN status query indicates failed transaction, THE M-Pesa_Daraja_API engine SHALL return failure with error details

### Requirement 14: SMS Delivery Status Tracking

**User Story:** As a system administrator, I want to track SMS delivery status, so that I can monitor SMS delivery rates and troubleshoot delivery issues.

#### Acceptance Criteria

1. WHEN an SMS is sent, THE TalkSasa_API engine SHALL store the provider message ID for tracking
2. WHERE TalkSasa provides delivery status webhooks, THE system SHALL implement a webhook handler to receive delivery status updates
3. WHEN a delivery status update is received, THE system SHALL update the SMS log with delivery status and timestamp
4. THE system SHALL support delivery statuses: SENT, DELIVERED, FAILED, EXPIRED
5. THE system SHALL log delivery status updates with message ID, status, and timestamp

### Requirement 15: Airtime Balance Query

**User Story:** As a system administrator, I want to query the airtime provider balance, so that I can monitor available airtime credit and prevent service disruptions.

#### Acceptance Criteria

1. THE Instalipa_API engine SHALL provide a method to query current airtime balance
2. WHEN querying balance, THE Instalipa_API engine SHALL return available balance amount and currency
3. WHEN balance is below a threshold, THE Instalipa_API engine SHALL log a warning
4. THE system SHALL cache balance queries for 5 minutes to avoid excessive API calls
5. THE system SHALL expose balance information through an admin API endpoint

### Requirement 16: API Health Monitoring

**User Story:** As a system administrator, I want to monitor API health status, so that I can detect and respond to API outages quickly.

#### Acceptance Criteria

1. THE system SHALL implement health check endpoints for each external API integration
2. WHEN a health check is performed, THE system SHALL make a lightweight test request to each API
3. WHEN an API responds successfully, THE health check SHALL return healthy status
4. WHEN an API fails to respond or returns errors, THE health check SHALL return unhealthy status with error details
5. THE system SHALL track API success rates and response times for monitoring dashboards

### Requirement 17: Idempotency for M-Pesa Deposits

**User Story:** As a system, I want to ensure M-Pesa deposits are processed exactly once, so that duplicate callbacks do not result in double crediting.

#### Acceptance Criteria

1. WHEN processing a M-Pesa callback, THE system SHALL check if the receipt number already exists in mpesa_logs table
2. IF the receipt number exists, THEN THE system SHALL return success without processing the deposit again
3. IF the receipt number is new, THEN THE system SHALL process the deposit and store the receipt number
4. THE system SHALL use database unique constraints on receipt numbers to enforce idempotency
5. THE system SHALL log duplicate callback attempts with receipt number and timestamp

### Requirement 18: Phone Number Normalization

**User Story:** As a system, I want phone numbers normalized to a consistent format, so that API requests are formatted correctly for each provider.

#### Acceptance Criteria

1. WHEN processing phone numbers for M-Pesa, THE system SHALL normalize to format 254XXXXXXXXX (remove + and leading zeros)
2. WHEN processing phone numbers for TalkSasa, THE system SHALL normalize to format +254XXXXXXXXX or 254XXXXXXXXX based on provider requirements
3. WHEN processing phone numbers for Instalipa, THE system SHALL normalize to format 254XXXXXXXXX
4. THE system SHALL validate phone numbers are valid Kenyan numbers (start with 254 and have correct length)
5. IF a phone number is invalid, THEN THE system SHALL return validation error before making API requests

### Requirement 19: API Rate Limiting Protection

**User Story:** As a system, I want to implement rate limiting for API requests, so that the system does not exceed provider rate limits and incur penalties.

#### Acceptance Criteria

1. THE system SHALL track API request counts per minute for each provider
2. WHEN approaching rate limits, THE system SHALL queue requests and process them within rate limits
3. WHEN rate limit is exceeded, THE system SHALL wait before sending additional requests
4. THE system SHALL load rate limit configurations from Environment_Variables
5. THE system SHALL log rate limiting events for monitoring

### Requirement 20: Secure Credential Storage

**User Story:** As a system administrator, I want API credentials encrypted at rest, so that credentials are protected even if configuration files are compromised.

#### Acceptance Criteria

1. THE system SHALL never log API credentials in plain text
2. THE system SHALL never expose API credentials in error messages or API responses
3. THE system SHALL validate Environment_Variables are loaded correctly at startup
4. THE system SHALL mask credentials in logs showing only first and last 4 characters
5. IF credentials are invalid, THEN THE system SHALL fail fast at startup with clear error message
