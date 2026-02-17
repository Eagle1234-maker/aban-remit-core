# Requirements Document: Aban Remit Core Backend

## Introduction

The Aban Remit Core Backend is a comprehensive multi-currency digital wallet and agent banking platform designed to facilitate secure financial transactions across multiple channels including MPESA, card payments, foreign exchange, airtime purchases, and agent-based services. The system implements a modular monolith architecture with double-entry accounting principles to ensure financial integrity and auditability.

## Glossary

- **System**: The Aban Remit Core Backend platform
- **User**: An end customer with a digital wallet (WLT7770001 format)
- **Agent**: A registered agent who facilitates customer transactions (AGT8880001 format)
- **Admin**: A system administrator with elevated privileges
- **Wallet**: A multi-currency account that can hold KES, USD, and EUR
- **Ledger**: The double-entry accounting system that records all financial transactions
- **Transaction**: Any financial operation that affects wallet balances
- **OTP**: One-Time Password used for authentication
- **JWT**: JSON Web Token used for session management
- **STK_Push**: MPESA's SIM Toolkit Push payment initiation
- **B2C**: Business-to-Customer payment
- **FX**: Foreign Exchange currency conversion
- **Commission**: Earnings paid to agents for facilitating transactions
- **Fee**: Charges applied to transactions
- **Audit_Trail**: Immutable record of all system operations
- **Device**: A registered device associated with a user account
- **Session**: An authenticated user connection with expiry time
- **Ledger_Entry**: A single debit or credit record in the double-entry system
- **Balance**: A derived value calculated from ledger entries, never stored directly
- **Reconciliation**: The process of comparing external provider records against internal ledger entries
- **Discrepancy**: A mismatch or inconsistency detected during reconciliation
- **Reconciliation_Job**: An automated or manual task that performs reconciliation for a date range
- **Match_Rate**: The percentage of transactions that successfully match between provider and ledger
- **Provider_Reliability_Score**: A metric indicating how often a provider's records match internal records


## Requirements

### Requirement 1: User Authentication and Registration

**User Story:** As a user, I want to register and authenticate securely using OTP verification, so that my account and transactions are protected.

#### Acceptance Criteria

1. WHEN a user submits a registration request with phone number and password, THE System SHALL validate the phone number format and password strength
2. WHEN a valid registration request is received, THE System SHALL hash the password using bcrypt with minimum 12 rounds
3. WHEN a user registration is created, THE System SHALL generate a unique wallet identifier in format WLT7770001
4. WHEN a user requests OTP, THE System SHALL generate a 6-digit numeric code with 5-minute expiry
5. WHEN an OTP is generated, THE System SHALL send it via the SMS Engine
6. WHEN a user submits valid credentials, THE System SHALL generate a JWT token with 15-minute expiry
7. WHEN a JWT token is generated, THE System SHALL include user ID, role, and wallet ID in the token payload
8. WHEN a user authenticates from a new device, THE System SHALL log the device information including IP address, user agent, and timestamp
9. IF an authentication attempt fails 5 times within 15 minutes, THEN THE System SHALL temporarily lock the account for 30 minutes
10. WHEN an OTP expires, THE System SHALL reject any verification attempt with that OTP

### Requirement 2: Agent Authentication and Registration

**User Story:** As an agent, I want to register with my business details and authenticate securely, so that I can facilitate customer transactions.

#### Acceptance Criteria

1. WHEN an agent submits a registration request, THE System SHALL validate business name, phone number, and identification documents
2. WHEN a valid agent registration is created, THE System SHALL generate a unique agent identifier in format AGT8880001
3. WHEN an agent registration is created, THE System SHALL create an associated wallet with multi-currency support
4. WHEN an agent authenticates, THE System SHALL assign role-based permissions for agent operations
5. WHEN an agent account is created, THE System SHALL set the initial wallet state to LOCKED pending admin approval
6. IF an admin approves an agent account, THEN THE System SHALL transition the wallet state to ACTIVE

### Requirement 3: Role-Based Access Control

**User Story:** As an admin, I want to control access to system features based on user roles, so that security and operational boundaries are maintained.

#### Acceptance Criteria

1. THE System SHALL support three roles: USER, AGENT, and ADMIN
2. WHEN a user attempts to access a protected resource, THE System SHALL verify the JWT token and extract the role
3. WHEN a USER role attempts agent-only operations, THE System SHALL reject the request with authorization error
4. WHEN an AGENT role attempts admin-only operations, THE System SHALL reject the request with authorization error
5. WHEN an ADMIN role accesses any resource, THE System SHALL log the action in the Audit Trail

### Requirement 4: Multi-Currency Wallet Management

**User Story:** As a user, I want to hold multiple currencies in my wallet, so that I can transact in KES, USD, and EUR.

#### Acceptance Criteria

1. WHEN a wallet is created, THE System SHALL initialize currency balances for KES, USD, and EUR
2. THE System SHALL derive all wallet balances from Ledger entries, not from direct balance fields
3. WHEN a balance query is requested, THE System SHALL calculate the balance by summing all Ledger entries for that wallet and currency
4. WHEN a wallet is created, THE System SHALL set the initial state to ACTIVE
5. THE System SHALL support wallet states: ACTIVE, LOCKED, FROZEN, and SUSPENDED
6. WHEN a wallet is in LOCKED state, THE System SHALL reject all transaction attempts
7. WHEN a wallet is in FROZEN state, THE System SHALL allow deposits but reject withdrawals
8. WHEN a wallet is in SUSPENDED state, THE System SHALL reject all transactions except admin-initiated operations
9. WHEN an admin changes wallet state, THE System SHALL log the state transition in the Audit Trail

### Requirement 5: Double-Entry Ledger System

**User Story:** As a system architect, I want all financial transactions to use double-entry accounting, so that financial integrity and auditability are guaranteed.

#### Acceptance Criteria

1. THE System SHALL record every financial transaction as paired debit and credit Ledger entries
2. WHEN a Ledger entry is created, THE System SHALL include transaction ID, wallet ID, currency, amount, entry type (DEBIT or CREDIT), and timestamp
3. WHEN a transaction is processed, THE System SHALL ensure the sum of all debits equals the sum of all credits
4. THE System SHALL reject any transaction that would violate the double-entry principle
5. WHEN a Ledger entry is created, THE System SHALL assign it a unique UUID v4 identifier
6. THE System SHALL make all Ledger entries immutable after creation
7. WHEN a transaction needs reversal, THE System SHALL create new offsetting Ledger entries, not modify existing ones
8. WHEN calculating a wallet balance, THE System SHALL sum all CREDIT entries and subtract all DEBIT entries for that wallet and currency

### Requirement 6: Deposit Transactions

**User Story:** As a user, I want to deposit money into my wallet via MPESA or card payment, so that I can fund my account.

#### Acceptance Criteria

1. WHEN a user initiates an MPESA deposit, THE System SHALL trigger an STK Push request to the MPESA API
2. WHEN an MPESA STK Push is successful, THE System SHALL create a pending transaction record
3. WHEN MPESA confirms payment, THE System SHALL create Ledger entries: debit MPESA_SUSPENSE account, credit user wallet
4. WHEN a user initiates a card deposit via Paystack, THE System SHALL generate a payment link with transaction reference
5. WHEN Paystack confirms payment, THE System SHALL create Ledger entries: debit PAYSTACK_SUSPENSE account, credit user wallet
6. WHEN a deposit is completed, THE System SHALL update the transaction status to COMPLETED
7. IF a deposit fails, THEN THE System SHALL update the transaction status to FAILED and log the error reason
8. WHEN a deposit transaction is created, THE System SHALL assign it a unique UUID v4 identifier

### Requirement 7: Withdrawal Transactions

**User Story:** As a user, I want to withdraw money from my wallet to my MPESA account, so that I can access my funds.

#### Acceptance Criteria

1. WHEN a user initiates a withdrawal, THE System SHALL verify the wallet has sufficient balance in the requested currency
2. WHEN a withdrawal is initiated, THE System SHALL check the wallet state is ACTIVE
3. WHEN a withdrawal is approved, THE System SHALL create Ledger entries: debit user wallet, credit MPESA_SUSPENSE account
4. WHEN Ledger entries are created, THE System SHALL initiate an MPESA B2C payment
5. WHEN MPESA confirms the B2C payment, THE System SHALL update the transaction status to COMPLETED
6. IF the MPESA B2C payment fails, THEN THE System SHALL create reversing Ledger entries to restore the user balance
7. WHEN a withdrawal fails, THE System SHALL update the transaction status to FAILED and log the error reason
8. WHEN a withdrawal exceeds a daily limit, THE System SHALL reject the transaction

### Requirement 8: Peer-to-Peer Transfers

**User Story:** As a user, I want to transfer money to another user's wallet, so that I can send funds to friends and family.

#### Acceptance Criteria

1. WHEN a user initiates a P2P transfer, THE System SHALL verify the sender wallet has sufficient balance
2. WHEN a P2P transfer is initiated, THE System SHALL validate the recipient wallet exists and is in ACTIVE state
3. WHEN a P2P transfer is approved, THE System SHALL create Ledger entries: debit sender wallet, credit recipient wallet
4. WHEN a P2P transfer involves the same currency, THE System SHALL transfer the exact amount without conversion
5. IF a P2P transfer involves different currencies, THEN THE System SHALL use the FX Engine to convert the amount
6. WHEN a P2P transfer is completed, THE System SHALL update the transaction status to COMPLETED
7. WHEN a P2P transfer is created, THE System SHALL record both sender and recipient wallet IDs

### Requirement 9: Agent Cash-In Transactions

**User Story:** As a user, I want to deposit cash with an agent who credits my wallet, so that I can fund my account without a bank.

#### Acceptance Criteria

1. WHEN an agent initiates a cash-in transaction, THE System SHALL verify the agent wallet is in ACTIVE state
2. WHEN a cash-in is initiated, THE System SHALL validate the customer wallet exists and is in ACTIVE or FROZEN state
3. WHEN a cash-in is approved, THE System SHALL create Ledger entries: debit agent wallet, credit customer wallet
4. WHEN a cash-in is completed, THE System SHALL calculate and record the agent commission
5. WHEN a cash-in is completed, THE System SHALL update the transaction status to COMPLETED
6. WHEN a cash-in transaction is created, THE System SHALL record both agent and customer wallet IDs

### Requirement 10: Agent Cash-Out Transactions

**User Story:** As a user, I want to withdraw cash from an agent who debits my wallet, so that I can access my funds in cash.

#### Acceptance Criteria

1. WHEN an agent initiates a cash-out transaction, THE System SHALL verify the customer wallet has sufficient balance
2. WHEN a cash-out is initiated, THE System SHALL verify the agent wallet has sufficient float balance
3. WHEN a cash-out is approved, THE System SHALL create Ledger entries: debit customer wallet, credit agent wallet
4. WHEN a cash-out is completed, THE System SHALL calculate and record the agent commission
5. WHEN a cash-out is completed, THE System SHALL update the transaction status to COMPLETED
6. WHEN a cash-out exceeds the agent's daily transaction limit, THE System SHALL reject the transaction

### Requirement 11: Transaction Fee Management

**User Story:** As an admin, I want to configure transaction fees for different transaction types, so that the platform can generate revenue.

#### Acceptance Criteria

1. THE System SHALL support fee types: FIXED, PERCENTAGE, and TIERED
2. WHEN an admin creates a fee configuration, THE System SHALL validate the fee structure and apply it to the specified transaction type
3. WHEN a transaction is processed, THE System SHALL calculate the applicable fee based on the transaction amount and type
4. WHEN a fee is calculated, THE System SHALL create Ledger entries: debit user wallet, credit FEE_REVENUE account
5. WHEN a fee configuration is updated, THE System SHALL apply the new fee to subsequent transactions only
6. WHEN a tiered fee is configured, THE System SHALL define amount ranges and corresponding fee values
7. WHEN calculating a tiered fee, THE System SHALL select the fee based on which tier the transaction amount falls into

### Requirement 12: Agent Commission Management

**User Story:** As an admin, I want to configure commission rates for agents, so that agents are compensated for facilitating transactions.

#### Acceptance Criteria

1. THE System SHALL support commission types: FIXED, PERCENTAGE, and TIERED
2. WHEN an admin creates a commission configuration, THE System SHALL validate the commission structure and apply it to agent transactions
3. WHEN an agent transaction is completed, THE System SHALL calculate the applicable commission
4. WHEN a commission is calculated, THE System SHALL create Ledger entries: debit COMMISSION_EXPENSE account, credit agent wallet
5. WHEN a commission configuration is updated, THE System SHALL apply the new commission to subsequent transactions only
6. WHEN an agent views their dashboard, THE System SHALL display total commissions earned

### Requirement 13: Foreign Exchange Conversion

**User Story:** As a user, I want to convert between KES, USD, and EUR in my wallet, so that I can hold funds in different currencies.

#### Acceptance Criteria

1. WHEN a user initiates an FX conversion, THE System SHALL verify the source currency balance is sufficient
2. WHEN an FX conversion is initiated, THE System SHALL fetch the current exchange rate from the FX Engine
3. WHEN an FX conversion is approved, THE System SHALL create Ledger entries: debit source currency wallet, credit destination currency wallet
4. WHEN calculating the destination amount, THE System SHALL apply the exchange rate and any applicable FX margin
5. WHEN an FX conversion is completed, THE System SHALL record the exchange rate used in the transaction record
6. WHEN an admin updates exchange rates, THE System SHALL apply the new rates to subsequent conversions only
7. THE System SHALL support currency pairs: KES/USD, KES/EUR, USD/EUR, and their inverses

### Requirement 14: Airtime Purchase

**User Story:** As a user, I want to purchase airtime for my phone number or another number, so that I can top up mobile credit.

#### Acceptance Criteria

1. WHEN a user initiates an airtime purchase, THE System SHALL verify the wallet has sufficient KES balance
2. WHEN an airtime purchase is initiated, THE System SHALL validate the phone number format
3. WHEN an airtime purchase is approved, THE System SHALL create Ledger entries: debit user wallet, credit AIRTIME_SUSPENSE account
4. WHEN Ledger entries are created, THE System SHALL call the Airtime API to process the purchase
5. WHEN the Airtime API confirms success, THE System SHALL update the transaction status to COMPLETED
6. IF the Airtime API fails, THEN THE System SHALL create reversing Ledger entries and update the transaction status to FAILED
7. WHEN an airtime purchase is completed, THE System SHALL calculate and apply the transaction fee

### Requirement 15: SMS Notification System

**User Story:** As a user, I want to receive SMS notifications for all transactions, so that I am informed of account activity.

#### Acceptance Criteria

1. WHEN a transaction is completed, THE System SHALL send an SMS notification to the user's registered phone number
2. WHEN an SMS is sent, THE System SHALL include transaction type, amount, currency, and new balance
3. WHEN an OTP is generated, THE System SHALL send it via SMS within 10 seconds
4. WHEN an SMS fails to send, THE System SHALL retry up to 3 times with exponential backoff
5. IF all SMS retry attempts fail, THEN THE System SHALL log the failure in the Audit Trail
6. WHEN an SMS is successfully sent, THE System SHALL record the SMS ID and timestamp

### Requirement 16: Admin Wallet State Management

**User Story:** As an admin, I want to change wallet states to manage risk and compliance, so that I can lock, freeze, or suspend problematic accounts.

#### Acceptance Criteria

1. WHEN an admin changes a wallet state, THE System SHALL validate the state transition is allowed
2. WHEN a wallet state changes to LOCKED, THE System SHALL reject all subsequent transaction attempts
3. WHEN a wallet state changes to FROZEN, THE System SHALL allow deposits but reject withdrawals
4. WHEN a wallet state changes to SUSPENDED, THE System SHALL reject all transactions except admin-initiated operations
5. WHEN a wallet state changes, THE System SHALL record the admin user ID, reason, and timestamp in the Audit Trail
6. WHEN an admin views a wallet, THE System SHALL display the current state and state change history

### Requirement 17: Admin Fee Configuration

**User Story:** As an admin, I want to create and update fee configurations, so that I can adjust platform pricing.

#### Acceptance Criteria

1. WHEN an admin creates a fee configuration, THE System SHALL validate the fee type is FIXED, PERCENTAGE, or TIERED
2. WHEN a FIXED fee is configured, THE System SHALL require a fixed amount value
3. WHEN a PERCENTAGE fee is configured, THE System SHALL require a percentage value between 0 and 100
4. WHEN a TIERED fee is configured, THE System SHALL require at least one tier with min amount, max amount, and fee value
5. WHEN an admin updates a fee configuration, THE System SHALL create a new version and deactivate the old version
6. WHEN a fee configuration is applied, THE System SHALL use the active version for the transaction type

### Requirement 18: Admin Commission Configuration

**User Story:** As an admin, I want to create and update commission configurations, so that I can adjust agent compensation.

#### Acceptance Criteria

1. WHEN an admin creates a commission configuration, THE System SHALL validate the commission type is FIXED, PERCENTAGE, or TIERED
2. WHEN a FIXED commission is configured, THE System SHALL require a fixed amount value
3. WHEN a PERCENTAGE commission is configured, THE System SHALL require a percentage value between 0 and 100
4. WHEN a TIERED commission is configured, THE System SHALL require at least one tier with min amount, max amount, and commission value
5. WHEN an admin updates a commission configuration, THE System SHALL create a new version and deactivate the old version
6. WHEN an agent transaction is processed, THE System SHALL use the active commission configuration

### Requirement 19: Admin Exchange Rate Management

**User Story:** As an admin, I want to update exchange rates for currency pairs, so that FX conversions use current market rates.

#### Acceptance Criteria

1. WHEN an admin updates an exchange rate, THE System SHALL validate the rate is a positive decimal number
2. WHEN an exchange rate is updated, THE System SHALL record the admin user ID and timestamp
3. WHEN an exchange rate is updated, THE System SHALL apply the new rate to subsequent FX conversions only
4. WHEN an admin views exchange rates, THE System SHALL display the current rate and rate change history
5. THE System SHALL support exchange rates for currency pairs: KES/USD, KES/EUR, USD/EUR, and their inverses
6. WHEN an inverse rate is calculated, THE System SHALL compute it as 1 divided by the base rate

### Requirement 20: Transaction History and Reporting

**User Story:** As a user, I want to view my transaction history, so that I can track my account activity.

#### Acceptance Criteria

1. WHEN a user requests transaction history, THE System SHALL return all transactions for their wallet
2. WHEN displaying transaction history, THE System SHALL include transaction ID, type, amount, currency, status, and timestamp
3. WHEN a user filters transaction history, THE System SHALL support filtering by date range, transaction type, and status
4. WHEN a user requests transaction history, THE System SHALL paginate results with maximum 50 transactions per page
5. WHEN an agent requests transaction history, THE System SHALL include commission earned for each transaction
6. WHEN an admin requests transaction history, THE System SHALL support filtering by wallet ID, agent ID, or user ID

### Requirement 21: Audit Trail and Compliance

**User Story:** As a compliance officer, I want an immutable audit trail of all system operations, so that I can investigate issues and meet regulatory requirements.

#### Acceptance Criteria

1. THE System SHALL log all authentication attempts with user ID, timestamp, IP address, and result
2. THE System SHALL log all wallet state changes with admin ID, wallet ID, old state, new state, reason, and timestamp
3. THE System SHALL log all fee and commission configuration changes with admin ID, configuration details, and timestamp
4. THE System SHALL log all exchange rate updates with admin ID, currency pair, old rate, new rate, and timestamp
5. THE System SHALL log all failed transactions with transaction ID, error reason, and timestamp
6. THE System SHALL make all Audit Trail entries immutable after creation
7. WHEN an admin queries the Audit Trail, THE System SHALL support filtering by entity type, entity ID, and date range
8. WHEN an Audit Trail entry is created, THE System SHALL assign it a unique UUID v4 identifier

### Requirement 22: System Health and Monitoring

**User Story:** As a system administrator, I want to monitor system health and performance, so that I can ensure uptime and reliability.

#### Acceptance Criteria

1. THE System SHALL expose a health check endpoint that returns system status
2. WHEN the health check endpoint is called, THE System SHALL verify database connectivity
3. WHEN the health check endpoint is called, THE System SHALL verify external API connectivity (MPESA, Paystack, SMS)
4. WHEN a critical error occurs, THE System SHALL log the error with stack trace and context
5. WHEN database queries exceed 1 second, THE System SHALL log a slow query warning
6. THE System SHALL track and log all API response times for external integrations

### Requirement 23: Data Validation and Error Handling

**User Story:** As a developer, I want comprehensive input validation and error handling, so that the system is robust and secure.

#### Acceptance Criteria

1. WHEN a request is received, THE System SHALL validate all required fields are present
2. WHEN a phone number is provided, THE System SHALL validate it matches the format for the target country
3. WHEN an amount is provided, THE System SHALL validate it is a positive number with maximum 2 decimal places
4. WHEN a currency code is provided, THE System SHALL validate it is one of: KES, USD, EUR
5. WHEN a wallet ID is provided, THE System SHALL validate it matches the format WLT7770001 or AGT8880001
6. WHEN validation fails, THE System SHALL return a descriptive error message indicating which field failed validation
7. WHEN an unexpected error occurs, THE System SHALL return a generic error message without exposing internal details
8. WHEN an error occurs, THE System SHALL log the full error details including stack trace for debugging

### Requirement 24: Idempotency for Transaction Processing

**User Story:** As a system architect, I want transaction requests to be idempotent, so that duplicate requests do not create duplicate transactions.

#### Acceptance Criteria

1. WHEN a transaction request includes an idempotency key, THE System SHALL check if a transaction with that key already exists
2. IF a transaction with the same idempotency key exists, THEN THE System SHALL return the existing transaction result without creating a new transaction
3. WHEN a transaction is created, THE System SHALL store the idempotency key with the transaction record
4. WHEN an idempotency key is reused after 24 hours, THE System SHALL allow a new transaction to be created
5. WHEN a transaction request does not include an idempotency key, THE System SHALL generate one automatically

### Requirement 25: Rate Limiting and Throttling

**User Story:** As a security engineer, I want to rate limit API requests, so that the system is protected from abuse and DDoS attacks.

#### Acceptance Criteria

1. WHEN a user makes API requests, THE System SHALL limit requests to 100 per minute per user
2. WHEN a user exceeds the rate limit, THE System SHALL reject subsequent requests with a 429 status code
3. WHEN an agent makes API requests, THE System SHALL limit requests to 200 per minute per agent
4. WHEN an admin makes API requests, THE System SHALL limit requests to 500 per minute per admin
5. WHEN rate limit is exceeded, THE System SHALL include a Retry-After header indicating when requests can resume
6. WHEN a rate limit violation occurs, THE System SHALL log the user ID, IP address, and timestamp

### Requirement 26: Database Transaction Management

**User Story:** As a system architect, I want all financial operations to use database transactions, so that data consistency is maintained.

#### Acceptance Criteria

1. WHEN a financial transaction is processed, THE System SHALL wrap all database operations in a single database transaction
2. IF any database operation fails within a transaction, THEN THE System SHALL roll back all changes
3. WHEN a database transaction is committed, THE System SHALL ensure all Ledger entries are persisted atomically
4. WHEN a database deadlock occurs, THE System SHALL retry the transaction up to 3 times
5. IF all retry attempts fail, THEN THE System SHALL return an error and log the failure

### Requirement 27: Password Security and Management

**User Story:** As a user, I want my password to be stored securely, so that my account cannot be compromised.

#### Acceptance Criteria

1. WHEN a user creates a password, THE System SHALL require minimum 8 characters with at least one uppercase, one lowercase, one digit, and one special character
2. WHEN a password is stored, THE System SHALL hash it using bcrypt with minimum 12 rounds
3. THE System SHALL never store passwords in plain text
4. THE System SHALL never return password hashes in API responses
5. WHEN a user changes their password, THE System SHALL require the current password for verification
6. WHEN a user forgets their password, THE System SHALL provide a password reset flow using OTP verification

### Requirement 28: Session Management and Token Refresh

**User Story:** As a user, I want my session to remain active while I'm using the app, so that I don't have to re-authenticate frequently.

#### Acceptance Criteria

1. WHEN a JWT token is generated, THE System SHALL set the expiry to 15 minutes
2. WHEN a user requests a token refresh, THE System SHALL verify the existing token is valid but expired
3. WHEN a token refresh is approved, THE System SHALL generate a new JWT token with updated expiry
4. WHEN a user logs out, THE System SHALL invalidate the current JWT token
5. WHEN a token is invalidated, THE System SHALL add it to a blacklist until its original expiry time
6. WHEN validating a token, THE System SHALL check it is not in the blacklist

### Requirement 29: Multi-Device Support

**User Story:** As a user, I want to access my account from multiple devices, so that I can use the service on my phone, tablet, or computer.

#### Acceptance Criteria

1. WHEN a user authenticates from a new device, THE System SHALL create a device record with device fingerprint
2. WHEN a device record is created, THE System SHALL include IP address, user agent, device type, and first seen timestamp
3. WHEN a user views their devices, THE System SHALL display all registered devices with last active timestamp
4. WHEN a user revokes a device, THE System SHALL invalidate all active sessions for that device
5. WHEN a user authenticates from more than 5 devices, THE System SHALL automatically revoke the oldest device

### Requirement 30: Ledger Reconciliation

**User Story:** As a finance officer, I want to reconcile ledger entries to ensure accounting accuracy, so that financial reports are trustworthy.

#### Acceptance Criteria

1. WHEN a reconciliation is requested, THE System SHALL calculate the sum of all debit entries
2. WHEN a reconciliation is requested, THE System SHALL calculate the sum of all credit entries
3. WHEN a reconciliation is completed, THE System SHALL verify the sum of debits equals the sum of credits
4. IF debits do not equal credits, THEN THE System SHALL flag the discrepancy and log it in the Audit Trail
5. WHEN a reconciliation is requested for a specific date range, THE System SHALL include only Ledger entries within that range
6. WHEN a reconciliation report is generated, THE System SHALL include total debits, total credits, and balance by currency

### Requirement 31: Wallet Lookup and Confirmation

**User Story:** As a user, I want to look up a recipient wallet before sending money, so that I can confirm I'm sending to the correct person.

#### Acceptance Criteria

1. WHEN a wallet lookup is requested with a wallet number, THE System SHALL return the wallet number, full name, masked phone, status, and KYC status
2. WHEN a wallet lookup is performed, THE System SHALL mask the phone number showing only the last 4 digits
3. WHEN a wallet lookup is performed, THE System SHALL never expose full phone number, email address, or internal user ID
4. IF a wallet is in LOCKED state, THEN THE System SHALL reject the lookup request with an error message
5. IF a wallet is in FROZEN state, THEN THE System SHALL reject the lookup request with an error message
6. WHEN a wallet lookup query is executed, THE System SHALL use an index on wallet_number for performance
7. WHEN a wallet does not exist, THE System SHALL return a not found error

### Requirement 32: MPESA Deposit Message Capture

**User Story:** As a system operator, I want to capture and store all MPESA deposit messages, so that I can audit and reconcile MPESA transactions.

#### Acceptance Criteria

1. WHEN an MPESA STK callback is received, THE System SHALL extract the MPESA receipt number, sender phone, amount, and raw payload
2. WHEN MPESA deposit data is extracted, THE System SHALL store it in the mpesa_logs table with receipt, phone, amount, raw payload, and timestamp
3. WHEN an MPESA deposit is processed, THE System SHALL follow the flow: STK Push, callback, validation, logging, transaction creation, ledger entries, SMS notification
4. WHEN an MPESA deposit is logged, THE System SHALL check for duplicate MPESA receipt numbers to ensure idempotency
5. IF a duplicate MPESA receipt is detected, THEN THE System SHALL reject the deposit and return the existing transaction
6. WHEN an MPESA deposit is completed, THE System SHALL send an SMS with format: "ABAN REMIT: Deposit of KES X received from 2547XXXXXXX. MPESA Ref: XXX New Balance: KES Y."

### Requirement 33: Withdrawal SMS Notification

**User Story:** As a user, I want to receive detailed SMS notifications for withdrawals, so that I can track my account activity.

#### Acceptance Criteria

1. WHEN a withdrawal is completed, THE System SHALL send an SMS with format: "ABAN REMIT: You have withdrawn KES X. Fee: KES Y Reference: TXN123 Available Balance: KES Z."
2. WHEN a withdrawal exceeds a configured threshold, THE System SHALL require OTP verification before processing
3. WHEN an OTP is required for withdrawal, THE System SHALL generate and send the OTP before allowing the withdrawal to proceed
4. WHEN a withdrawal SMS is sent, THE System SHALL include the transaction reference, amount, fee, and new balance

### Requirement 34: Receipt Generation

**User Story:** As a user, I want to generate a receipt for any transaction, so that I have proof of payment.

#### Acceptance Criteria

1. WHEN a receipt is requested for a transaction reference, THE System SHALL generate a PDF receipt with all transaction details
2. WHEN a receipt is generated, THE System SHALL include: logo, reference, date/time, sender details, receiver details, amount, fee, net amount, currency, status, provider reference, exchange rate, and commission
3. WHEN a receipt is generated, THE System SHALL include a QR code containing the transaction reference
4. WHEN a receipt is generated, THE System SHALL calculate a verification hash using SHA256(reference + amount + created_at)
5. WHEN a transaction is created, THE System SHALL store the verification hash in the transactions table
6. WHEN a receipt is generated, THE System SHALL format it for A4 printing with clean, professional design
7. WHEN a receipt is requested for a non-existent transaction, THE System SHALL return a not found error

### Requirement 35: Fraud Protection Enhancements

**User Story:** As a security officer, I want enhanced fraud protection mechanisms, so that the system prevents fraudulent transactions.

#### Acceptance Criteria

1. WHEN a P2P transfer is initiated, THE System SHALL verify the sender wallet ID is different from the receiver wallet ID
2. IF sender and receiver wallet IDs are the same, THEN THE System SHALL reject the transaction with an error message
3. WHEN any transfer is initiated, THE System SHALL verify both sender and receiver wallets have status ACTIVE
4. WHEN a transaction updates wallet balances, THE System SHALL use SELECT FOR UPDATE to lock the wallet records
5. WHEN an MPESA deposit is processed, THE System SHALL check for duplicate MPESA receipt numbers
6. IF a duplicate MPESA receipt is found, THEN THE System SHALL reject the deposit as a duplicate
7. THE System SHALL never update wallet balance fields directly, only through ledger entries

### Requirement 36: SMS Logging and Cost Tracking

**User Story:** As an admin, I want to log all SMS messages and track costs, so that I can monitor SMS expenses and delivery rates.

#### Acceptance Criteria

1. WHEN an SMS is sent, THE System SHALL log the recipient, message content, cost, status, and timestamp in the sms_logs table
2. WHEN an SMS log entry is created, THE System SHALL include the SMS provider's message ID
3. WHEN an admin requests an SMS cost report, THE System SHALL calculate total SMS costs for a specified date range
4. WHEN an admin requests an SMS cost report, THE System SHALL include total messages sent, total cost, and delivery success rate
5. WHEN an SMS fails to send, THE System SHALL log the failure with error message in the sms_logs table

### Requirement 37: Complete Transaction Flow Validation

**User Story:** As a system architect, I want a standardized transaction flow for all money transfers, so that consistency and security are maintained.

#### Acceptance Criteria

1. WHEN a money transfer is initiated, THE System SHALL execute the following steps in order: wallet lookup, name confirmation, PIN validation, fee calculation, transaction creation, ledger entries, commit, SMS notifications, receipt generation
2. WHEN wallet lookup is performed, THE System SHALL verify the recipient wallet exists and is in ACTIVE state
3. WHEN PIN validation is performed, THE System SHALL verify the sender's PIN matches the stored hash
4. WHEN fee calculation is performed, THE System SHALL apply the active fee configuration for the transaction type
5. WHEN ledger entries are created, THE System SHALL ensure all entries are created within a single database transaction
6. WHEN the database transaction commits, THE System SHALL send SMS notifications to both sender and receiver
7. WHEN SMS notifications are sent, THE System SHALL not block the transaction response if SMS delivery is delayed
8. WHEN a receipt is generated, THE System SHALL make it available via the receipt endpoint immediately after transaction completion

### Requirement 38: MPESA Reconciliation

**User Story:** As a finance officer, I want to reconcile MPESA transactions against ledger entries, so that I can detect and resolve discrepancies.

#### Acceptance Criteria

1. WHEN an MPESA reconciliation job is triggered, THE System SHALL fetch all MPESA logs for the specified date range
2. WHEN MPESA logs are fetched, THE System SHALL fetch all MPESA deposit transactions for the same date range
3. WHEN reconciling MPESA logs, THE System SHALL match each log to a transaction by MPESA receipt number
4. IF an MPESA log has no matching transaction, THEN THE System SHALL flag it as MISSING_LEDGER with severity CRITICAL
5. IF a transaction has no matching MPESA log, THEN THE System SHALL flag it as MISSING_PROVIDER with severity HIGH
6. WHEN an MPESA log matches a transaction, THE System SHALL compare amount, phone number, and timestamp
7. IF matched records have different amounts, THEN THE System SHALL flag it as AMOUNT_MISMATCH with severity HIGH
8. WHEN an MPESA reconciliation job completes, THE System SHALL record total transactions, matched transactions, and discrepancies found

### Requirement 39: Paystack Reconciliation

**User Story:** As a finance officer, I want to reconcile Paystack payments against ledger entries, so that I can detect payment discrepancies.

#### Acceptance Criteria

1. WHEN a Paystack reconciliation job is triggered, THE System SHALL fetch all Paystack payment logs for the specified date range
2. WHEN Paystack logs are fetched, THE System SHALL fetch all card deposit transactions for the same date range
3. WHEN reconciling Paystack logs, THE System SHALL match each log to a transaction by Paystack reference
4. IF a Paystack log has no matching transaction, THEN THE System SHALL flag it as MISSING_LEDGER with severity CRITICAL
5. IF a transaction has no matching Paystack log, THEN THE System SHALL flag it as MISSING_PROVIDER with severity HIGH
6. WHEN a Paystack log matches a transaction, THE System SHALL compare amount and timestamp
7. IF matched records have different amounts, THEN THE System SHALL flag it as AMOUNT_MISMATCH with severity HIGH

### Requirement 40: Internal Ledger Reconciliation

**User Story:** As a finance officer, I want to verify ledger integrity, so that I can ensure double-entry accounting is maintained.

#### Acceptance Criteria

1. WHEN a ledger reconciliation job is triggered, THE System SHALL fetch all ledger entries for the specified date range
2. WHEN ledger entries are fetched, THE System SHALL group them by transaction_id
3. WHEN reconciling ledger entries, THE System SHALL sum all DEBIT entries and all CREDIT entries for each transaction
4. IF the sum of debits does not equal the sum of credits for a transaction, THEN THE System SHALL flag it as UNBALANCED with severity CRITICAL
5. WHEN reconciling wallet balances, THE System SHALL calculate balance from ledger entries for each wallet
6. WHEN a calculated balance is retrieved, THE System SHALL compare it with the expected balance
7. IF calculated balance does not match expected balance, THEN THE System SHALL flag it as BALANCE_MISMATCH with severity CRITICAL

### Requirement 41: Automated Reconciliation Jobs

**User Story:** As a system administrator, I want automated daily reconciliation, so that discrepancies are detected promptly.

#### Acceptance Criteria

1. THE System SHALL schedule a daily reconciliation job to run at 2:00 AM local time
2. WHEN the scheduled job runs, THE System SHALL execute MPESA, Paystack, and ledger reconciliation for the previous day
3. WHEN an admin triggers on-demand reconciliation, THE System SHALL execute reconciliation for the specified date range
4. WHEN a reconciliation job starts, THE System SHALL create a job record with status PENDING
5. WHEN a reconciliation job is running, THE System SHALL update the job status to RUNNING
6. WHEN a reconciliation job completes, THE System SHALL update the job status to COMPLETED and record completion timestamp
7. IF a reconciliation job fails, THEN THE System SHALL update the job status to FAILED and log the error reason
8. WHEN a reconciliation job completes, THE System SHALL record total transactions, matched transactions, and discrepancies found

### Requirement 42: Discrepancy Management

**User Story:** As a finance officer, I want to track and resolve discrepancies, so that financial integrity is maintained.

#### Acceptance Criteria

1. WHEN a discrepancy is detected, THE System SHALL create a discrepancy record with type, severity, provider, reference, and details
2. WHEN a discrepancy is created, THE System SHALL set the initial status to PENDING
3. WHEN a CRITICAL or HIGH severity discrepancy is created, THE System SHALL send an immediate alert to the finance team
4. WHEN an admin views discrepancies, THE System SHALL support filtering by status, severity, provider, and date range
5. WHEN an admin resolves a discrepancy, THE System SHALL update the status to RESOLVED and record resolution notes
6. WHEN a discrepancy is resolved, THE System SHALL record the admin user ID and resolution timestamp
7. WHEN an admin marks a discrepancy as ignored, THE System SHALL update the status to IGNORED and record the reason

### Requirement 43: Reconciliation Reports

**User Story:** As a finance officer, I want reconciliation reports, so that I can audit financial operations.

#### Acceptance Criteria

1. WHEN a daily reconciliation summary is requested, THE System SHALL return total transactions, matched transactions, unmatched transactions, and discrepancies for the specified date
2. WHEN a detailed discrepancy report is requested, THE System SHALL return all discrepancies with transaction details for the specified date range
3. WHEN a trend analysis report is requested, THE System SHALL calculate discrepancy rates over the specified time period
4. WHEN a report is exported, THE System SHALL support CSV and PDF formats
5. WHEN a CSV report is generated, THE System SHALL include all relevant fields with proper headers
6. WHEN a PDF report is generated, THE System SHALL format it for A4 printing with company branding

### Requirement 44: Reconciliation Metrics

**User Story:** As a finance manager, I want reconciliation metrics, so that I can monitor system reliability.

#### Acceptance Criteria

1. WHEN reconciliation metrics are requested, THE System SHALL calculate match rate percentage as matched transactions divided by total transactions
2. WHEN reconciliation metrics are requested, THE System SHALL calculate average reconciliation time for completed jobs
3. WHEN reconciliation metrics are requested, THE System SHALL calculate average discrepancy resolution time
4. WHEN reconciliation metrics are requested, THE System SHALL calculate provider reliability scores based on discrepancy rates
5. WHEN provider reliability scores are calculated, THE System SHALL compute them as 100 minus the discrepancy rate percentage
6. WHEN metrics are displayed, THE System SHALL show trends over the last 30 days

### Requirement 45: Reconciliation Notifications

**User Story:** As a finance team member, I want to receive alerts for critical discrepancies, so that I can respond quickly.

#### Acceptance Criteria

1. WHEN a CRITICAL severity discrepancy is detected, THE System SHALL send an immediate email and SMS to the finance team
2. WHEN HIGH severity discrepancies are detected, THE System SHALL send a daily summary email
3. WHEN MEDIUM or LOW severity discrepancies are detected, THE System SHALL include them in the weekly summary report
4. WHEN a notification is sent, THE System SHALL include discrepancy type, severity, provider, amount, and reference
5. WHEN a notification email is sent, THE System SHALL include a link to view the discrepancy details in the admin panel

