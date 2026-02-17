import { WalletLookupEngine } from './interface.js';
import { WalletLookupResult, WalletLookupError } from './types.js';
import { query } from '../../utils/db.js';
import { maskPhone } from '../../utils/phone-masking.js';
import { WalletState, KYCStatus } from '../../types/index.js';

/**
 * Database row structure for wallet lookup query
 */
interface WalletLookupRow {
  wallet_id: string;
  full_name: string;
  phone: string;
  wallet_state: WalletState;
  kyc_status: KYCStatus;
}

/**
 * Implementation of WalletLookupEngine
 * 
 * Security features:
 * - Phone number masking (only last 4 digits visible)
 * - No exposure of email, internal user ID, or other sensitive data
 * - Rejects lookups for LOCKED or FROZEN wallets
 * - Uses indexed queries for performance
 * 
 * Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6
 */
export class WalletLookupEngineImpl implements WalletLookupEngine {
  /**
   * Look up wallet information by wallet number
   * 
   * @param walletNumber - Wallet ID (e.g., WLT7770001 or AGT8880001)
   * @returns Wallet lookup result with masked phone number
   * @throws WalletLookupError if wallet not found or in invalid state
   * 
   * Requirements: 31.1, 31.4, 31.5, 31.6, 31.7
   */
  async lookupWallet(walletNumber: string): Promise<WalletLookupResult> {
    // Query wallet and user information
    // Uses idx_wallets_number index for fast lookup (Requirement 31.6)
    const result = await query<WalletLookupRow>(
      `
      SELECT 
        w.id as wallet_id,
        u.full_name,
        u.phone,
        w.state as wallet_state,
        u.kyc_status
      FROM core.wallets w
      INNER JOIN core.users u ON w.owner_id = u.id
      WHERE w.id = $1
      `,
      [walletNumber]
    );

    // Requirement 31.7: Return not found error if wallet doesn't exist
    if (result.rows.length === 0) {
      throw new WalletLookupError(
        `Wallet ${walletNumber} not found`,
        'NOT_FOUND'
      );
    }

    const wallet = result.rows[0];

    // Requirement 31.4: Reject lookups for LOCKED wallets
    if (wallet.wallet_state === 'LOCKED') {
      throw new WalletLookupError(
        `Wallet ${walletNumber} is locked and cannot be used for transactions`,
        'LOCKED'
      );
    }

    // Requirement 31.5: Reject lookups for FROZEN wallets
    if (wallet.wallet_state === 'FROZEN') {
      throw new WalletLookupError(
        `Wallet ${walletNumber} is frozen and cannot receive transfers`,
        'FROZEN'
      );
    }

    // Requirement 31.1: Return wallet number, full name, masked phone, status, KYC status
    // Requirement 31.2: Mask phone number (only last 4 digits visible)
    // Requirement 31.3: Never expose full phone, email, or internal user ID
    return {
      walletNumber: wallet.wallet_id,
      fullName: wallet.full_name,
      phoneMasked: maskPhone(wallet.phone),
      status: wallet.wallet_state,
      kycStatus: wallet.kyc_status,
    };
  }
}
