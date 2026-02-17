# Design Document: Live API Integration

## Overview

This design document specifies the implementation of live production API integrations for the Aban Remit system. The system will integrate three external APIs:

1. **M-Pesa Daraja API** - Mobile money deposits and payments
2. **TalkSasa Bulk SMS API** - SMS notifications and OTP delivery
3. **Instalipa Airtime API** - Airtime purchase and distribution

The design follows the existing engine pattern in the codebase, creating dedicated API engines for each provider. Each engine will handle authentication, request/response processing, error handling, retry logic, and logging. The implementation will replace mock implementations with real API calls while maintaining the existing interfaces.

### Key Design Principles

- **Security First**: All credentials stored in environment variables, never logged or exposed
- **Idempotency**: Duplicate requests handled gracefully to prevent double processing
- **Resilience**: Retry logic with exponential backoff for transient failures
- **Observability**: Comprehensive logging for audit trails and troubleshooting
- **Separation of Concerns**: Each API has its own engine with clear responsibilities

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Aban Remit Backend                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Routes     │  │   Services   │  │ Repositories │    │
│  │  (deposits,  │  │  (transfer-  │  │  (mpesa-log, │    │
│  │   wallet,    │  │ orchestrator)│  │   sms-log,   │    │
│  │   airtime)   │  │              │  │ airtime-log) │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                  │             │
│         └─────────────────┼──────────────────┘             │
│                           │                                │
│  ┌────────────────────────┴─────────────────────────────┐ │
│  │              API Engines (New/Updated)               │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │                                                      │ │
│  │  ┌─────────────────┐  ┌─────────────────┐          │ │
│  │  │  MPesaEngine    │  │  TalkSasaEngine │          │ │
│  │  │  - Auth         │  │  - Auth         │          │ │
│  │  │  - STK Push     │  │  - Send SMS     │          │ │
│  │  │  - Status Query │  │  - Track Status │          │ │
│  │  └────────┬────────┘  └────────┬────────┘          │ │
│  │           │                     │                   │ │
│  │  ┌────────┴─────────────────────┴────────┐         │ │
│  │  │       InstalipaEngine                 │         │ │
│  │  │       - Auth                          │         │ │
│  │  │       - Purchase Airtime              │         │ │
│  │  │       - Query Balance                 │         │ │
│  │  └────────┬──────────────────────────────┘         │ │
│  │           │                                        │ │
│  │  ┌────────┴──────────────────────────────────┐    │ │
│  │  │      HTTP Client (with retry logic)       │    │ │
│  │  └───────────────────────────────────────────┘    │ │
│  └──────────────────────────────────────────────────┘ │
│                           │                            │
└───────────────────────────┼────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  M-Pesa Daraja  │ │  TalkSasa API   │ │  Instalipa API  │
│      API        │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                    (Callbacks)
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ M-Pesa Callback │ │ SMS Delivery    │ │Airtime Callback │
│    Handler      │ │   Webhook       │ │    Handler      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Component Interaction Flow

**Deposit Flow (M-Pesa STK Push):**
1. User initiates deposit via `/deposits` route
2. Route calls `MPesaEngine.initiateSTKPush()`
3. Engine authenticates, generates password, sends STK Push request
4. Engine returns checkout request ID to user
5. M-Pesa sends callback to `/callbacks/mpesa`
6. Callback handler validates, checks idempotency, credits wallet
7. System logs transaction in `mpesa_logs` table

**SMS Flow (TalkSasa):**
1. Service needs to send SMS (OTP, notification)
2. Service calls `TalkSasaEngine.sendSMS()`
3. Engine authenticates, sends SMS via TalkSasa API
4. Engine logs attempt in `sms_logs` table
5. TalkSasa sends delivery status webhook (optional)
6. Webhook handler updates SMS log with delivery status

**Airtime Flow (Instalipa):**
1. User initiates airtime purchase via `/airtime` route
2. Route calls `InstalipaEngine.purchaseAirtime()`
3. Engine authenticates, sends purchase request
4. Engine returns transaction reference
5. Instalipa sends callback to `/functions/v1/airtime-callback`
6. Callback handler validates, updates transaction status
7. System logs transaction in `airtime_logs` table

## Components and Interfaces

### 1. MPesaEngine

**Purpose**: Handle all M-Pesa Daraja API interactions including authentication, STK Push, and transaction status queries.

**Interface:**

```typescript
interface MPesaEngine {
  // Initiate STK Push payment request
  initiateSTKPush(phone: string, amount: number, accountReference: string): Promise<STKPushResult>;
  
  // Query transaction status
  queryTransactionStatus(checkoutRequestId: string): Promise<TransactionStatusResult>;
  
  // Get current access token (for internal use)
  getAccessToken(): Promise<string>;
}

interface STKPushResult {
  checkoutRequestId: string;
  merchantRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
}

interface TransactionStatusResult {
  resultCode: string;
  resultDesc: string;
  mpesaReceiptNumber?: string;
  transactionDate?: Date;
  phoneNumber?: string;
  amount?: number;
}
```

**Configuration (from environment):**
- `MPESA_CONSUMER_KEY`: QwzCGC1fTPluVAXeNjxFTTDXsjklVKeL
- `MPESA_CONSUMER_SECRET`: 6Uc2GeVcZBUGWHGT
- `MPESA_SHORTCODE`: 000772
- `MPESA_PASSKEY`: b309881157d87125c7f87ffffde6448ab10f90e3dce7c4d8efab190482896018
- `MPESA_CALLBACK_URL`: https://abanremit.com/api/callbacks/mpesa
- `MPESA_API_URL`: https://api.safaricom.co.ke (production)
- `MPESA_TIMEOUT`: 30000 (30 seconds)

**Key Methods:**

1. **Authentication**
   - Endpoint: `GET /oauth/v1/generate?grant_type=client_credentials`
   - Headers: `Authorization: Basic base64(consumer_key:consumer_secret)`
   - Cache token for 3600 seconds (1 hour)
   - Auto-refresh on 401 errors

2. **STK Push**
   - Endpoint: `POST /mpesa/stkpush/v1/processrequest`
   - Generate password: `base64(shortcode + passkey + timestamp)`
   - Timestamp format: `YYYYMMDDHHmmss`
   - Phone format: `254XXXXXXXXX`

3. **Transaction Status Query**
   - Endpoint: `POST /mpesa/stkpushquery/v1/query`
   - Use same password generation as STK Push
   - Query by checkout request ID

### 2. TalkSasaEngine

**Purpose**: Handle all TalkSasa Bulk SMS API interactions including SMS sending and delivery tracking.

**Interface:**

```typescript
interface TalkSasaEngine {
  // Send SMS message
  sendSMS(recipient: string, message: string): Promise<SMSResult>;
  
  // Send OTP SMS
  sendOTP(recipient: string, code: string): Promise<SMSResult>;
  
  // Send transaction notification
  sendTransactionNotification(recipient: string, message: string): Promise<SMSResult>;
}

interface SMSResult {
  id: string;
  recipient: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  cost: number;
  providerMessageId?: string;
  errorMessage?: string;
  sentAt?: Date;
}
```

**Configuration (from environment):**
- `TALKSASA_API_TOKEN`: 1956|W7r0b7vuSgcT2UqiYvFcKIodUOkSPlabpVtcVh4u7c347b80
- `TALKSASA_SENDER_ID`: ABAN_COOL
- `TALKSASA_API_URL`: https://bulksms.talksasa.com/api/v3
- `TALKSASA_TIMEOUT`: 15000 (15 seconds)

**Key Methods:**

1. **Send SMS**
   - Endpoint: `POST /sms/send`
   - Headers: `Authorization: Bearer {api_token}`
   - Body: `{ sender_id, recipient, message }`
   - Phone format: `254XXXXXXXXX` or `+254XXXXXXXXX`

2. **Delivery Status Webhook** (if supported)
   - Endpoint: `POST /webhooks/sms-delivery`
   - Receive delivery status updates
   - Update SMS log with delivery status

### 3. InstalipaEngine

**Purpose**: Handle all Instalipa Airtime API interactions including authentication, airtime purchase, and balance queries.

**Interface:**

```typescript
interface InstalipaEngine {
  // Purchase airtime
  purchaseAirtime(phone: string, amount: number, reference: string): Promise<AirtimePurchaseResult>;
  
  // Query airtime balance
  queryBalance(): Promise<BalanceResult>;
  
  // Get current access token (for internal use)
  getAccessToken(): Promise<string>;
}

interface AirtimePurchaseResult {
  transactionReference: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  phone: string;
  amount: number;
  message: string;
}

interface BalanceResult {
  balance: number;
  currency: string;
}
```

**Configuration (from environment):**
- `INSTALIPA_CONSUMER_KEY`: mxbn7EPCk_wMfr1_mlVQagmZoSS2RVJSkZ3YyuF8iWs
- `INSTALIPA_CONSUMER_SECRET`: lIVlbDRXcIrxu6Oq0pA_UnowcsPujP5jvxQdEn1Th2hyoexpkypvZU0VPrc1QXHEqNVV_yRqiKACmaTvtKk5qw
- `INSTALIPA_CALLBACK_URL`: https://abanremit.com/functions/v1/airtime-callback
- `INSTALIPA_API_URL`: https://api.instalipa.com (assumed production URL)
- `INSTALIPA_TIMEOUT`: 30000 (30 seconds)

**Key Methods:**

1. **Authentication**
   - OAuth 2.0 client credentials flow
   - Cache token until expiration
   - Auto-refresh on 401 errors

2. **Purchase Airtime**
   - Endpoint: `POST /airtime/purchase`
   - Body: `{ phone, amount, reference, callback_url }`
   - Phone format: `254XXXXXXXXX`

3. **Query Balance**
   - Endpoint: `GET /airtime/balance`
   - Cache for 5 minutes
   - Log warning if below threshold

### 4. HTTP Client with Retry Logic

**Purpose**: Provide a reusable HTTP client with built-in retry logic, timeout handling, and logging.

**Interface:**

```typescript
interface HTTPClient {
  request<T>(config: RequestConfig): Promise<HTTPResponse<T>>;
}

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retryConfig?: RetryConfig;
}

interface RetryConfig {
  maxRetries: number;
  retryableStatusCodes: number[];
  backoffMultiplier: number;
  initialDelayMs: number;
}

interface HTTPResponse<T> {
  status: number;
  headers: Record<string, string>;
  data: T;
  duration: number;
}
```

**Retry Logic:**
- Network errors: Retry up to 3 times with exponential backoff (1s, 2s, 4s)
- 401 Unauthorized: Refresh token and retry once
- 429 Rate Limit: Wait for retry-after header, then retry
- 5xx Server Errors: Retry up to 3 times with exponential backoff
- 4xx Client Errors (except 401, 429): No retry, fail immediately

**Logging:**
- Log request: method, URL, headers (redacted), body (redacted), correlation ID
- Log response: status, headers, body (redacted), duration
- Log retries: attempt number, error, wait time
- Redact sensitive fields: Authorization, password, token, secret

### 5. Callback Handlers

#### M-Pesa Callback Handler

**Route**: `POST /api/callbacks/mpesa`

**Process:**
1. Validate callback structure
2. Extract result code, receipt number, phone, amount, transaction date
3. Check idempotency using `mpesa_logs.mpesa_receipt` unique constraint
4. If duplicate, return 200 OK without processing
5. If new and successful (result code 0):
   - Create mpesa_log entry
   - Credit user wallet
   - Send SMS notification
6. If failed, log failure
7. Return 200 OK to M-Pesa

**Callback Structure:**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "string",
      "CheckoutRequestID": "string",
      "ResultCode": 0,
      "ResultDesc": "string",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 100 },
          { "Name": "MpesaReceiptNumber", "Value": "ABC123" },
          { "Name": "TransactionDate", "Value": 20240101120000 },
          { "Name": "PhoneNumber", "Value": 254712345678 }
        ]
      }
    }
  }
}
```

#### Instalipa Airtime Callback Handler

**Route**: `POST /functions/v1/airtime-callback`

**Process:**
1. Validate callback signature (if provided)
2. Extract transaction reference, status, phone, amount
3. Find airtime transaction by reference
4. Update transaction status
5. If successful, send SMS notification
6. Return 200 OK to Instalipa

**Callback Structure** (assumed):
```json
{
  "transaction_reference": "string",
  "status": "SUCCESS" | "FAILED",
  "phone": "254712345678",
  "amount": 100,
  "message": "string",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 6. Phone Number Utilities

**Purpose**: Normalize and validate phone numbers for different API providers.

**Interface:**

```typescript
interface PhoneUtils {
  // Normalize phone number to format required by provider
  normalizeForMPesa(phone: string): string;
  normalizeForTalkSasa(phone: string): string;
  normalizeForInstalipa(phone: string): string;
  
  // Validate phone number format
  isValidKenyanPhone(phone: string): boolean;
}
```

**Normalization Rules:**
- M-Pesa: `254XXXXXXXXX` (remove +, remove leading 0)
- TalkSasa: `254XXXXXXXXX` or `+254XXXXXXXXX` (check API docs)
- Instalipa: `254XXXXXXXXX` (remove +, remove leading 0)
- Validation: Must start with 254, total length 12 digits

## Data Models

### M-Pesa Log (Existing - Update)

**Table**: `services.mpesa_logs`

```sql
CREATE TABLE services.mpesa_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mpesa_receipt VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  raw_payload JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- New fields for enhanced tracking
  checkout_request_id VARCHAR(255),
  merchant_request_id VARCHAR(255),
  transaction_date TIMESTAMP,
  result_code VARCHAR(10),
  result_desc TEXT
);

CREATE INDEX idx_mpesa_logs_receipt ON services.mpesa_logs(mpesa_receipt);
CREATE INDEX idx_mpesa_logs_checkout_request ON services.mpesa_logs(checkout_request_id);
CREATE INDEX idx_mpesa_logs_phone ON services.mpesa_logs(phone);
CREATE INDEX idx_mpesa_logs_created_at ON services.mpesa_logs(created_at);
```

### SMS Log (Existing - Update)

**Table**: `services.sms_logs`

```sql
CREATE TABLE services.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL, -- PENDING, SENT, DELIVERED, FAILED, EXPIRED
  provider_message_id VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- New fields for delivery tracking
  delivered_at TIMESTAMP,
  delivery_status VARCHAR(20),
  delivery_error TEXT
);

CREATE INDEX idx_sms_logs_recipient ON services.sms_logs(recipient);
CREATE INDEX idx_sms_logs_status ON services.sms_logs(status);
CREATE INDEX idx_sms_logs_provider_message_id ON services.sms_logs(provider_message_id);
CREATE INDEX idx_sms_logs_created_at ON services.sms_logs(created_at);
```

### Airtime Log (New)

**Table**: `services.airtime_logs`

```sql
CREATE TABLE services.airtime_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_reference VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL, -- PENDING, SUCCESS, FAILED
  provider_response JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_airtime_logs_reference ON services.airtime_logs(transaction_reference);
CREATE INDEX idx_airtime_logs_phone ON services.airtime_logs(phone);
CREATE INDEX idx_airtime_logs_status ON services.airtime_logs(status);
CREATE INDEX idx_airtime_logs_created_at ON services.airtime_logs(created_at);
```

### API Token Cache (New)

**Table**: `services.api_token_cache`

```sql
CREATE TABLE services.api_token_cache (
  provider VARCHAR(50) PRIMARY KEY, -- 'mpesa', 'instalipa'
  access_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Cache OAuth tokens to avoid excessive authentication requests. Tokens are stored with expiration time and automatically refreshed when expired.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified several areas where properties can be consolidated:

**OAuth Authentication (Requirements 1.2-1.5, 6.2-6.5):**
- M-Pesa and Instalipa use identical OAuth flows
- Can create a single comprehensive OAuth property that applies to both engines
- Consolidate token caching and refresh properties

**Request Structure Validation (Requirements 2.2, 5.2, 7.1):**
- All engines validate request structure
- Can create a general property about required fields being present
- Keep specific properties for unique validation rules

**Error Handling (Requirements 2.4, 5.4, 7.3):**
- All engines handle errors similarly
- Can consolidate into properties about error response structure

**Callback Processing (Requirements 3.1-3.6, 8.1-8.5):**
- Both M-Pesa and Instalipa callbacks follow similar patterns
- Keep separate due to different data structures and business logic

**Logging (Requirements 5.5, 7.5, 11.1-11.5):**
- All engines log similarly
- Consolidate into general logging properties

**Retry Logic (Requirements 10.1-10.7):**
- All engines use same retry logic
- Keep as comprehensive properties for the HTTP client

**Phone Normalization (Requirements 2.5, 5.6, 7.4, 18.1-18.5):**
- All engines normalize phone numbers
- Create properties for each provider's specific format

### Correctness Properties

#### Property 1: OAuth Token Caching
*For any* OAuth-based API engine (M-Pesa, Instalipa), when an access token is obtained, subsequent API requests within the token's validity period should use the cached token without requesting a new one.

**Validates: Requirements 1.3, 6.3**

#### Property 2: OAuth Token Auto-Refresh
*For any* OAuth-based API engine (M-Pesa, Instalipa), when a cached token expires or an API request returns 401 Unauthorized, the engine should automatically request a new token and retry the original request.

**Validates: Requirements 1.4, 6.4, 10.2**

#### Property 3: M-Pesa Password Generation
*For any* valid timestamp, the M-Pesa password should be correctly generated as Base64(Shortcode + Passkey + Timestamp) where timestamp is in format YYYYMMDDHHmmss.

**Validates: Requirements 2.1**

#### Property 4: Phone Number Normalization for M-Pesa
*For any* valid Kenyan phone number input (with or without +, with or without leading 0), the M-Pesa engine should normalize it to format 254XXXXXXXXX before making API requests.

**Validates: Requirements 2.5, 18.1**

#### Property 5: Phone Number Normalization for TalkSasa
*For any* valid Kenyan phone number input, the TalkSasa engine should normalize it to the format required by the TalkSasa API (254XXXXXXXXX or +254XXXXXXXXX).

**Validates: Requirements 5.6, 18.2**

#### Property 6: Phone Number Normalization for Instalipa
*For any* valid Kenyan phone number input, the Instalipa engine should normalize it to format 254XXXXXXXXX before making API requests.

**Validates: Requirements 7.4, 18.3**

#### Property 7: Phone Number Validation
*For any* phone number input, if it does not represent a valid Kenyan phone number (starting with 254 and having correct length), the system should reject it with a validation error before making any API requests.

**Validates: Requirements 18.4**

#### Property 8: M-Pesa Callback Idempotency
*For any* M-Pesa callback with a receipt number, if that receipt number already exists in the mpesa_logs table, the system should return success without processing the deposit again or crediting the wallet.

**Validates: Requirements 3.3, 17.1, 17.2**

#### Property 9: M-Pesa Callback Processing
*For any* valid M-Pesa callback indicating successful payment (result code 0), the system should extract the receipt number, phone, amount, and transaction date, create a log entry, and credit the user's wallet.

**Validates: Requirements 3.2, 3.4, 17.3**

#### Property 10: Failed Payment Handling
*For any* M-Pesa callback indicating failed payment (result code != 0), the system should log the failure without crediting any wallet.

**Validates: Requirements 3.5**

#### Property 11: Callback HTTP Response
*For any* callback request (M-Pesa or Instalipa), regardless of processing outcome, the system should return HTTP 200 status to acknowledge receipt.

**Validates: Requirements 3.6, 8.5**

#### Property 12: SMS Logging Completeness
*For any* SMS sending attempt, the system should create a log entry containing recipient, message, cost, status, provider message ID (if available), and timestamp.

**Validates: Requirements 5.5**

#### Property 13: Airtime Logging Completeness
*For any* airtime purchase attempt, the system should create a log entry containing phone, amount, status, transaction reference, provider response, and timestamp.

**Validates: Requirements 7.5**

#### Property 14: Network Error Retry with Exponential Backoff
*For any* API request that fails with a network error or 5xx server error, the HTTP client should retry up to 3 times with exponential backoff (initial delay, 2x delay, 4x delay).

**Validates: Requirements 10.1, 10.4**

#### Property 15: Non-Retryable Client Errors
*For any* API request that fails with a 4xx client error (except 401 and 429), the HTTP client should not retry and should immediately return the error.

**Validates: Requirements 10.5**

#### Property 16: Rate Limit Handling
*For any* API request that fails with 429 Rate Limit status, the HTTP client should wait for the retry-after period specified in the response headers before retrying.

**Validates: Requirements 10.3**

#### Property 17: Retry Exhaustion
*For any* API request where all retry attempts are exhausted, the HTTP client should log the final error with all attempt details and throw an exception.

**Validates: Requirements 10.6**

#### Property 18: Request Logging
*For any* API request made by any engine, the system should log the request method, URL, headers (with sensitive data redacted), body (with sensitive data redacted), and correlation ID.

**Validates: Requirements 11.1**

#### Property 19: Response Logging
*For any* API response received by any engine, the system should log the response status code, headers, body (with sensitive data redacted), and request duration in milliseconds.

**Validates: Requirements 11.2, 11.5**

#### Property 20: Sensitive Data Redaction
*For any* log entry containing API request or response data, the system should redact sensitive information including Authorization headers, passwords, tokens, secrets, and API keys, showing only masked values (e.g., first and last 4 characters).

**Validates: Requirements 11.3, 20.1, 20.4**

#### Property 21: Correlation ID Tracing
*For any* API request, the system should generate or propagate a correlation ID and include it in both request headers and log entries to enable request tracing across systems.

**Validates: Requirements 11.4**

#### Property 22: Request Timeout
*For any* API request, if the request does not complete within the configured timeout period (30s for M-Pesa/Instalipa, 15s for TalkSasa), the HTTP client should abort the request and treat it as a timeout error eligible for retry.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4**

#### Property 23: Airtime Callback Status Update
*For any* Instalipa airtime callback, the system should find the transaction by reference ID and update its status, completed_at timestamp, and provider response in the airtime_logs table.

**Validates: Requirements 8.3**

#### Property 24: Configuration Validation at Startup
*For any* required environment variable (API credentials, URLs, timeouts), if the variable is missing or empty at system startup, the system should throw a configuration error with a clear message indicating which variable is missing.

**Validates: Requirements 9.10, 20.5**

#### Property 25: Duplicate Callback Logging
*For any* duplicate M-Pesa callback (same receipt number), the system should log the duplicate attempt with the receipt number, timestamp, and indication that it was a duplicate.

**Validates: Requirements 17.5**

## Error Handling

### Error Categories

**1. Configuration Errors**
- Missing or invalid environment variables
- Invalid credential format
- Thrown at startup, prevent system from starting
- Example: `ConfigurationError: MPESA_CONSUMER_KEY is required`

**2. Validation Errors**
- Invalid phone number format
- Invalid amount (negative, zero, exceeds limits)
- Invalid request parameters
- Thrown before making API requests
- Example: `ValidationError: Phone number must be in format 254XXXXXXXXX`

**3. Authentication Errors**
- OAuth token request failed
- Invalid credentials
- Token refresh failed
- Thrown when authentication fails
- Example: `AuthenticationError: Failed to obtain M-Pesa access token: Invalid credentials`

**4. API Errors**
- API request failed after retries
- API returned error response
- Includes provider error code and message
- Example: `MPesaAPIError: STK Push failed [code: 1032, message: Request cancelled by user]`

**5. Network Errors**
- Connection timeout
- Connection refused
- DNS resolution failed
- Eligible for retry with exponential backoff
- Example: `NetworkError: Connection timeout after 30000ms`

**6. Callback Validation Errors**
- Missing required fields in callback
- Invalid callback signature
- Malformed callback data
- Return 400 Bad Request to provider
- Example: `CallbackValidationError: Missing required field: MpesaReceiptNumber`

### Error Response Format

All API engines should return errors in a consistent format:

```typescript
interface APIError extends Error {
  code: string;           // Error code (e.g., 'MPESA_AUTH_FAILED')
  message: string;        // Human-readable error message
  provider?: string;      // API provider name (e.g., 'mpesa', 'talksasa')
  statusCode?: number;    // HTTP status code from provider
  providerError?: {       // Original error from provider
    code: string;
    message: string;
    details?: any;
  };
  retryable: boolean;     // Whether error is retryable
  timestamp: Date;        // When error occurred
  correlationId: string;  // Request correlation ID
}
```

### Retry Strategy

**Retryable Errors:**
- Network errors (ECONNREFUSED, ETIMEDOUT, ENOTFOUND)
- 401 Unauthorized (refresh token and retry once)
- 429 Rate Limit (wait and retry)
- 500, 502, 503, 504 Server Errors (retry with backoff)

**Non-Retryable Errors:**
- 400 Bad Request
- 403 Forbidden
- 404 Not Found
- 422 Unprocessable Entity
- Configuration errors
- Validation errors

**Retry Configuration:**
```typescript
const retryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  retryableStatusCodes: [401, 429, 500, 502, 503, 504],
  retryableNetworkErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND']
};
```

### Error Logging

All errors should be logged with:
- Error type and code
- Error message
- Stack trace (for unexpected errors)
- Correlation ID
- Request details (method, URL, redacted headers)
- Response details (status code, redacted body)
- Retry attempt number (if applicable)
- Timestamp

Example log entry:
```json
{
  "level": "error",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "correlationId": "req-abc123",
  "errorType": "MPesaAPIError",
  "errorCode": "MPESA_STK_PUSH_FAILED",
  "message": "STK Push request failed",
  "provider": "mpesa",
  "statusCode": 400,
  "providerError": {
    "code": "1032",
    "message": "Request cancelled by user"
  },
  "request": {
    "method": "POST",
    "url": "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    "headers": {
      "Authorization": "Bearer ****...****"
    }
  },
  "retryAttempt": 0,
  "retryable": false
}
```

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests:**
- Specific examples demonstrating correct behavior
- Edge cases (empty inputs, boundary values, special characters)
- Error conditions (missing credentials, invalid formats, API failures)
- Integration points between components
- Callback handling with specific payloads
- Mock external API responses

**Property-Based Tests:**
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `Feature: live-api-integration, Property {number}: {property_text}`

### Property-Based Testing Configuration

**Testing Library:** Use `fast-check` for TypeScript/JavaScript property-based testing

**Configuration:**
```typescript
import fc from 'fast-check';

// Minimum 100 iterations per property test
const propertyTestConfig = {
  numRuns: 100,
  verbose: true
};

// Example property test
describe('Property 4: Phone Number Normalization for M-Pesa', () => {
  it('should normalize any valid Kenyan phone to 254XXXXXXXXX format', () => {
    // Feature: live-api-integration, Property 4: Phone Number Normalization for M-Pesa
    fc.assert(
      fc.property(
        fc.oneof(
          fc.tuple(fc.constant('254'), fc.stringOf(fc.integer(0, 9), { minLength: 9, maxLength: 9 })),
          fc.tuple(fc.constant('+254'), fc.stringOf(fc.integer(0, 9), { minLength: 9, maxLength: 9 })),
          fc.tuple(fc.constant('0'), fc.stringOf(fc.integer(0, 9), { minLength: 9, maxLength: 9 }))
        ).map(([prefix, digits]) => prefix + digits),
        (phone) => {
          const normalized = normalizeForMPesa(phone);
          return normalized.startsWith('254') && 
                 normalized.length === 12 && 
                 /^\d+$/.test(normalized);
        }
      ),
      propertyTestConfig
    );
  });
});
```

### Test Coverage Requirements

**Unit Test Coverage:**
- Configuration loading and validation
- Phone number normalization for each provider
- Password generation for M-Pesa
- Request structure validation
- Response parsing (success and error cases)
- Callback validation and processing
- Idempotency checking
- Error handling and retry logic
- Logging and redaction

**Property Test Coverage:**
- OAuth token caching and refresh (Properties 1, 2)
- M-Pesa password generation (Property 3)
- Phone number normalization (Properties 4, 5, 6, 7)
- Callback idempotency (Property 8)
- Callback processing (Properties 9, 10, 11)
- Logging completeness (Properties 12, 13)
- Retry logic (Properties 14, 15, 16, 17)
- Request/response logging (Properties 18, 19)
- Sensitive data redaction (Property 20)
- Correlation ID tracing (Property 21)
- Request timeout (Property 22)
- Configuration validation (Property 24)

### Integration Testing

**External API Mocking:**
- Use `nock` or similar library to mock HTTP requests
- Create mock responses for each API endpoint
- Test both success and failure scenarios
- Simulate network errors, timeouts, rate limits

**Database Testing:**
- Use test database or in-memory database
- Test idempotency with actual database constraints
- Test transaction logging and updates
- Test callback processing with database operations

**End-to-End Testing:**
- Test complete flows: deposit initiation → callback → wallet credit
- Test complete flows: SMS sending → delivery status update
- Test complete flows: airtime purchase → callback → status update
- Use test credentials in sandbox environment (if available)

### Test Organization

```
backend/src/
├── engines/
│   ├── mpesa/
│   │   ├── implementation.ts
│   │   ├── implementation.test.ts          # Unit tests
│   │   ├── implementation.property.test.ts # Property tests
│   │   └── interface.ts
│   ├── talksasa/
│   │   ├── implementation.ts
│   │   ├── implementation.test.ts
│   │   ├── implementation.property.test.ts
│   │   └── interface.ts
│   └── instalipa/
│       ├── implementation.ts
│       ├── implementation.test.ts
│       ├── implementation.property.test.ts
│       └── interface.ts
├── utils/
│   ├── http-client.ts
│   ├── http-client.test.ts
│   ├── http-client.property.test.ts
│   ├── phone-utils.ts
│   ├── phone-utils.test.ts
│   └── phone-utils.property.test.ts
└── routes/
    ├── callbacks.ts
    ├── callbacks.test.ts
    └── callbacks.integration.test.ts
```

### Continuous Testing

- Run unit tests on every commit
- Run property tests on every commit
- Run integration tests on pull requests
- Monitor test execution time
- Track test coverage metrics
- Alert on test failures

## Security Considerations

### Credential Management

1. **Environment Variables Only**: All credentials stored in `.env` file, never in code
2. **No Hardcoding**: No credentials in source code, configuration files, or version control
3. **Access Control**: Limit access to `.env` file to authorized personnel only
4. **Rotation**: Implement credential rotation policy (every 90 days recommended)
5. **Audit**: Log all credential access and usage

### Data Protection

1. **Encryption in Transit**: All API requests use HTTPS/TLS
2. **Encryption at Rest**: Database encryption for sensitive data
3. **PII Protection**: Phone numbers, amounts, and transaction details protected
4. **Log Redaction**: Sensitive data redacted in all logs
5. **Secure Callbacks**: Validate callback signatures to prevent spoofing

### API Security

1. **Token Management**: OAuth tokens cached securely, never logged
2. **Request Signing**: Sign requests where required by provider
3. **Callback Validation**: Validate callback source and signature
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **IP Whitelisting**: Whitelist callback IPs where possible

### Monitoring and Alerting

1. **Failed Authentication**: Alert on repeated authentication failures
2. **Unusual Activity**: Alert on unusual transaction patterns
3. **API Errors**: Alert on high error rates
4. **Callback Failures**: Alert on callback processing failures
5. **Balance Monitoring**: Alert when airtime balance is low

## Deployment Considerations

### Environment Configuration

**Production `.env` file:**
```bash
# M-Pesa Daraja API
MPESA_CONSUMER_KEY=QwzCGC1fTPluVAXeNjxFTTDXsjklVKeL
MPESA_CONSUMER_SECRET=6Uc2GeVcZBUGWHGT
MPESA_SHORTCODE=000772
MPESA_PASSKEY=b309881157d87125c7f87ffffde6448ab10f90e3dce7c4d8efab190482896018
MPESA_CALLBACK_URL=https://abanremit.com/api/callbacks/mpesa
MPESA_API_URL=https://api.safaricom.co.ke
MPESA_TIMEOUT=30000

# TalkSasa Bulk SMS API
TALKSASA_API_TOKEN=1956|W7r0b7vuSgcT2UqiYvFcKIodUOkSPlabpVtcVh4u7c347b80
TALKSASA_SENDER_ID=ABAN_COOL
TALKSASA_API_URL=https://bulksms.talksasa.com/api/v3
TALKSASA_TIMEOUT=15000

# Instalipa Airtime API
INSTALIPA_CONSUMER_KEY=mxbn7EPCk_wMfr1_mlVQagmZoSS2RVJSkZ3YyuF8iWs
INSTALIPA_CONSUMER_SECRET=lIVlbDRXcIrxu6Oq0pA_UnowcsPujP5jvxQdEn1Th2hyoexpkypvZU0VPrc1QXHEqNVV_yRqiKACmaTvtKk5qw
INSTALIPA_CALLBACK_URL=https://abanremit.com/functions/v1/airtime-callback
INSTALIPA_API_URL=https://api.instalipa.com
INSTALIPA_TIMEOUT=30000
```

### Database Migrations

1. Add new columns to `services.mpesa_logs` table
2. Add new columns to `services.sms_logs` table
3. Create new `services.airtime_logs` table
4. Create new `services.api_token_cache` table
5. Add indexes for performance

### Rollout Strategy

1. **Phase 1**: Deploy code with feature flags disabled
2. **Phase 2**: Enable M-Pesa integration, monitor for 24 hours
3. **Phase 3**: Enable TalkSasa integration, monitor for 24 hours
4. **Phase 4**: Enable Instalipa integration, monitor for 24 hours
5. **Phase 5**: Full production rollout

### Monitoring

1. **API Success Rates**: Track success/failure rates for each API
2. **Response Times**: Monitor API response times
3. **Error Rates**: Track error rates by type
4. **Transaction Volume**: Monitor transaction volumes
5. **Callback Processing**: Monitor callback processing times

### Rollback Plan

1. **Feature Flags**: Ability to disable each integration independently
2. **Database Rollback**: Ability to rollback database migrations
3. **Code Rollback**: Ability to rollback to previous version
4. **Monitoring**: Continuous monitoring during and after deployment
5. **Communication**: Clear communication plan for issues

## Performance Considerations

### Caching Strategy

1. **OAuth Tokens**: Cache for token lifetime (typically 1 hour)
2. **Airtime Balance**: Cache for 5 minutes
3. **Phone Validation**: Cache validation results for 1 hour
4. **Configuration**: Load once at startup

### Database Optimization

1. **Indexes**: Ensure indexes on frequently queried columns
2. **Connection Pooling**: Use connection pooling for database
3. **Query Optimization**: Optimize queries for callback processing
4. **Batch Operations**: Batch log inserts where possible

### API Rate Limiting

1. **M-Pesa**: Respect rate limits (check API documentation)
2. **TalkSasa**: Respect rate limits (check API documentation)
3. **Instalipa**: Respect rate limits (check API documentation)
4. **Queue Management**: Queue requests if approaching rate limits
5. **Backpressure**: Implement backpressure for high-volume scenarios

### Scalability

1. **Horizontal Scaling**: Design for horizontal scaling
2. **Stateless Design**: Keep engines stateless (except token cache)
3. **Load Balancing**: Use load balancer for multiple instances
4. **Database Scaling**: Plan for database scaling
5. **Monitoring**: Monitor resource usage and scale proactively
