# Wallet Lookup Engine

## Overview

The Wallet Lookup Engine provides secure wallet information lookup for transaction confirmation. It implements phone masking and state validation to protect user privacy and prevent invalid transactions.

## Features

- **Secure Information Retrieval**: Returns wallet number, full name, masked phone, status, and KYC status
- **Phone Number Masking**: Masks all but the last 4 digits of phone numbers (e.g., `****5678`)
- **State Validation**: Rejects lookups for LOCKED or FROZEN wallets
- **Performance Optimized**: Uses indexed queries on wallet_number for fast lookups
- **Privacy Protection**: Never exposes full phone numbers, email addresses, or internal user IDs

## Requirements Implemented

- **31.1**: Return wallet number, full name, masked phone, status, and KYC status
- **31.2**: Mask phone number showing only last 4 digits
- **31.3**: Never expose sensitive data (full phone, email, internal user ID)
- **31.4**: Reject lookups for LOCKED wallets
- **31.5**: Reject lookups for FROZEN wallets
- **31.6**: Use indexed query on wallet_number for performance
- **31.7**: Return not found error for non-existent wallets

## Usage

```typescript
import { WalletLookupEngineImpl } from './engines/wallet-lookup/index.js';

const engine = new WalletLookupEngineImpl();

try {
  const result = await engine.lookupWallet('WLT7770001');
  console.log(result);
  // {
  //   walletNumber: 'WLT7770001',
  //   fullName: 'John Doe',
  //   phoneMasked: '****5678',
  //   status: 'ACTIVE',
  //   kycStatus: 'VERIFIED'
  // }
} catch (error) {
  if (error instanceof WalletLookupError) {
    console.error(`Lookup failed: ${error.message} (${error.code})`);
  }
}
```

## Error Handling

The engine throws `WalletLookupError` with the following error codes:

- **NOT_FOUND**: Wallet does not exist
- **LOCKED**: Wallet is locked and cannot be used for transactions
- **FROZEN**: Wallet is frozen and cannot receive transfers
- **INVALID_STATE**: Wallet is in an invalid state

## Database Schema

The engine queries the following tables:

```sql
SELECT 
  w.id as wallet_id,
  u.full_name,
  u.phone,
  w.state as wallet_state,
  u.kyc_status
FROM core.wallets w
INNER JOIN core.users u ON w.owner_id = u.id
WHERE w.id = $1
```

## Testing

The implementation includes comprehensive unit tests covering:

- Successful lookups for ACTIVE wallets
- Error handling for non-existent wallets
- State validation (LOCKED, FROZEN, SUSPENDED)
- Phone number masking for various formats
- Agent wallet support
- Index usage verification

Run tests:

```bash
npm test src/engines/wallet-lookup/implementation.test.ts
```

## Files

- `interface.ts` - WalletLookupEngine interface definition
- `implementation.ts` - WalletLookupEngineImpl implementation
- `types.ts` - Type definitions and error classes
- `implementation.test.ts` - Unit tests
- `index.ts` - Public exports

## Dependencies

- `pg` - PostgreSQL client for database queries
- `../../utils/db.js` - Database connection pool
- `../../utils/phone-masking.js` - Phone number masking utility
- `../../types/index.js` - Core type definitions
