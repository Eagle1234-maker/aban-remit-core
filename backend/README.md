# Aban Remit Core Backend

Multi-currency digital wallet and agent banking platform with double-entry accounting.

## Features

- Multi-currency wallets (KES, USD, EUR)
- MPESA and Paystack integration
- Double-entry ledger system
- Agent banking operations
- Foreign exchange conversion
- Airtime purchases
- SMS notifications
- Receipt generation
- Fraud protection
- Reconciliation engine

## Database Setup

### Prerequisites

- PostgreSQL 15+
- Node.js 18+

### Initial Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Run migrations:
```bash
npm run prisma:migrate
```

### Database Schema

The system uses two PostgreSQL schemas:

- `core`: Main application tables (users, wallets, transactions, ledger_entries)
- `services`: Service-specific tables (mpesa_logs, sms_logs)

### Migrations

This migration adds:

1. **services.mpesa_logs** - MPESA deposit tracking
   - Stores MPESA receipt numbers for idempotency
   - Captures raw callback payloads for audit
   - Indexed on receipt and phone for fast lookups

2. **services.sms_logs** - SMS notification tracking
   - Logs all SMS messages sent
   - Tracks costs for expense reporting
   - Records delivery status and errors

3. **core.transactions.verification_hash** - Receipt verification
   - SHA256 hash for receipt authenticity
   - Format: SHA256(reference + amount + created_at)

4. **Indexes**:
   - `idx_mpesa_logs_receipt` - Fast MPESA receipt lookups
   - `idx_mpesa_logs_phone` - Phone number queries
   - `idx_sms_logs_recipient` - SMS recipient lookups
   - `idx_sms_logs_created` - Date range queries
   - `idx_wallets_number` - Wallet number lookups

### Running Migrations

Development:
```bash
npm run prisma:migrate
```

Production:
```bash
npm run prisma:deploy
```

### Database Management

View database in Prisma Studio:
```bash
npm run prisma:studio
```

## Development

Start development server:
```bash
npm run dev
```

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Architecture

The system follows a modular monolith architecture with clear separation of concerns:

- **Engines**: Business logic components (Authentication, Wallet, Ledger, Transaction, etc.)
- **Repositories**: Data access layer
- **Controllers**: HTTP request handlers
- **Middleware**: Authentication, validation, rate limiting

### Key Principles

1. **Double-Entry Accounting**: All financial transactions create paired debit/credit entries
2. **Derived Balances**: Balances calculated from ledger entries, never stored directly
3. **Immutability**: Ledger entries and audit logs are immutable
4. **Idempotency**: All transaction endpoints support idempotency keys
5. **Atomicity**: All financial operations execute within database transactions

## Testing

The system uses dual testing approach:

- **Unit Tests**: Specific examples and edge cases
- **Property-Based Tests**: Universal correctness properties (using fast-check)

Run property-based tests:
```bash
npm test -- --grep "Property"
```

## License

ISC
