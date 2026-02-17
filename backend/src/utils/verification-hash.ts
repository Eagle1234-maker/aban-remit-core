/**
 * Verification Hash Utility
 * 
 * Calculates verification hashes for transactions and receipts.
 * Validates Requirements: 34.4, 34.5
 */

import crypto from 'crypto';

/**
 * Calculate verification hash for a transaction
 * Uses SHA256(reference + amount + created_at)
 * 
 * @param reference - Transaction reference
 * @param amount - Transaction amount
 * @param createdAt - Transaction creation date
 * @returns SHA256 hash as hex string
 */
export function calculateVerificationHash(
  reference: string,
  amount: number,
  createdAt: Date
): string {
  const data = `${reference}${amount.toString()}${createdAt.toISOString()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}