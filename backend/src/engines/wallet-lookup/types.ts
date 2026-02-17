import { WalletState, KYCStatus } from '../../types/index.js';

/**
 * Result of a wallet lookup operation
 * Requirements: 31.1
 */
export interface WalletLookupResult {
  walletNumber: string;
  fullName: string;
  phoneMasked: string; // Format: ****1234
  status: WalletState;
  kycStatus: KYCStatus;
}

/**
 * Error thrown when wallet lookup fails
 */
export class WalletLookupError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'LOCKED' | 'FROZEN' | 'INVALID_STATE'
  ) {
    super(message);
    this.name = 'WalletLookupError';
  }
}
