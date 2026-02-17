import { WalletLookupResult } from './types.js';

/**
 * WalletLookupEngine interface
 * Provides secure wallet information lookup for transaction confirmation
 * 
 * Requirements: 31.1, 31.4, 31.5
 */
export interface WalletLookupEngine {
  /**
   * Look up wallet information by wallet number
   * 
   * @param walletNumber - Wallet ID (e.g., WLT7770001 or AGT8880001)
   * @returns Wallet lookup result with masked sensitive data
   * @throws WalletLookupError if wallet not found or in invalid state
   * 
   * Requirements: 31.1, 31.2, 31.3, 31.4, 31.5
   */
  lookupWallet(walletNumber: string): Promise<WalletLookupResult>;
}
