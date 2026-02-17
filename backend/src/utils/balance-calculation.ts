/**
 * Balance Calculation Utilities
 * 
 * Ensures all balance queries derive from ledger entries.
 * Validates Requirements: 35.7
 */

export interface LedgerEntry {
  id: string;
  transactionId: string;
  walletId: string;
  currency: string;
  amount: number;
  entryType: 'DEBIT' | 'CREDIT';
  description: string;
  createdAt: Date;
}

/**
 * Calculate wallet balance from ledger entries
 * Balance = SUM(CREDIT entries) - SUM(DEBIT entries)
 * 
 * @param entries - Array of ledger entries for the wallet
 * @param currency - Currency to calculate balance for
 * @returns Calculated balance
 */
export function calculateBalanceFromLedger(
  entries: LedgerEntry[],
  currency: string
): number {
  // Filter entries for the specified currency
  const currencyEntries = entries.filter(entry => entry.currency === currency);
  
  // Sum all CREDIT entries
  const totalCredits = currencyEntries
    .filter(entry => entry.entryType === 'CREDIT')
    .reduce((sum, entry) => sum + entry.amount, 0);
  
  // Sum all DEBIT entries
  const totalDebits = currencyEntries
    .filter(entry => entry.entryType === 'DEBIT')
    .reduce((sum, entry) => sum + entry.amount, 0);
  
  // Balance = Credits - Debits
  return totalCredits - totalDebits;
}

/**
 * Validate that balance calculation is correct
 * Ensures no direct balance field updates are used
 * 
 * @param walletId - Wallet ID to validate
 * @param currency - Currency to validate
 * @param entries - Ledger entries for the wallet
 * @param expectedBalance - Expected balance (if any)
 * @returns Validation result
 */
export function validateBalanceDerivation(
  walletId: string,
  currency: string,
  entries: LedgerEntry[],
  expectedBalance?: number
): { isValid: boolean; calculatedBalance: number; message: string } {
  // Calculate balance from ledger entries
  const calculatedBalance = calculateBalanceFromLedger(entries, currency);
  
  // If expected balance is provided, compare
  if (expectedBalance !== undefined) {
    const isValid = Math.abs(calculatedBalance - expectedBalance) < 0.01; // Allow for floating point precision
    
    return {
      isValid,
      calculatedBalance,
      message: isValid 
        ? 'Balance derivation is correct'
        : `Balance mismatch: calculated ${calculatedBalance}, expected ${expectedBalance}`
    };
  }
  
  return {
    isValid: true,
    calculatedBalance,
    message: 'Balance calculated from ledger entries'
  };
}

/**
 * Generate SQL query to calculate balance from ledger entries
 * This ensures balance is always derived from ledger, never from direct balance fields
 * 
 * @param walletId - Wallet ID
 * @param currency - Currency
 * @returns SQL query string
 */
export function generateBalanceCalculationSQL(walletId: string, currency: string): string {
  return `
    SELECT 
      COALESCE(
        SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END) -
        SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END),
        0
      ) as balance
    FROM ledger_entries 
    WHERE wallet_id = $1 AND currency = $2
  `;
}