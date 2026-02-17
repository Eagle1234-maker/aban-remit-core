/**
 * Fraud Protection Utilities
 * 
 * Implements fraud protection mechanisms for transactions.
 * Validates Requirements: 35.1, 35.2, 35.3
 */

export class FraudError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'FraudError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate that sender and receiver wallets are different
 * Requirement 35.1, 35.2: Prevent self-transfers
 * 
 * @param senderWallet - Sender wallet ID
 * @param receiverWallet - Receiver wallet ID
 * @throws FraudError if wallets are the same
 */
export function validateTransfer(senderWallet: string, receiverWallet: string): void {
  if (senderWallet === receiverWallet) {
    throw new FraudError('Cannot transfer to the same wallet', 'SELF_TRANSFER');
  }
}

/**
 * Validate wallet status for transactions
 * Requirement 35.3: Verify both sender and receiver wallets are ACTIVE
 * 
 * @param wallet - Wallet object with state property
 * @param operation - Operation type for error message
 * @throws ValidationError if wallet is not ACTIVE
 */
export function validateWalletStatus(
  wallet: { id: string; state: string }, 
  operation: 'SEND' | 'RECEIVE'
): void {
  if (wallet.state !== 'ACTIVE') {
    throw new ValidationError(`Wallet ${wallet.id} is ${wallet.state}, cannot ${operation}`);
  }
}