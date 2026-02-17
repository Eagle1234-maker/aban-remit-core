/**
 * Unit tests for Balance Calculation Utilities
 * Validates Requirements: 35.7
 */

import { describe, it, expect } from 'vitest';
import { 
  calculateBalanceFromLedger, 
  validateBalanceDerivation, 
  generateBalanceCalculationSQL,
  LedgerEntry 
} from './balance-calculation.js';

describe('Balance Calculation', () => {
  const mockEntries: LedgerEntry[] = [
    {
      id: '1',
      transactionId: 'TXN001',
      walletId: 'WLT7770001',
      currency: 'KES',
      amount: 1000,
      entryType: 'CREDIT',
      description: 'Deposit',
      createdAt: new Date()
    },
    {
      id: '2',
      transactionId: 'TXN002',
      walletId: 'WLT7770001',
      currency: 'KES',
      amount: 200,
      entryType: 'DEBIT',
      description: 'Withdrawal',
      createdAt: new Date()
    }
  ];

  describe('calculateBalanceFromLedger', () => {
    it('should calculate correct balance from credits and debits', () => {
      const balance = calculateBalanceFromLedger(mockEntries, 'KES');
      
      // Credits: 1000, Debits: 200, Balance: 800
      expect(balance).toBe(800);
    });

    it('should return zero for empty entries', () => {
      const balance = calculateBalanceFromLedger([], 'KES');
      expect(balance).toBe(0);
    });

    it('should filter by currency correctly', () => {
      const usdEntries: LedgerEntry[] = [
        {
          id: '3',
          transactionId: 'TXN003',
          walletId: 'WLT7770001',
          currency: 'USD',
          amount: 100,
          entryType: 'CREDIT',
          description: 'USD deposit',
          createdAt: new Date()
        }
      ];
      
      const allEntries = [...mockEntries, ...usdEntries];
      const kesBalance = calculateBalanceFromLedger(allEntries, 'KES');
      const usdBalance = calculateBalanceFromLedger(allEntries, 'USD');
      
      expect(kesBalance).toBe(800);
      expect(usdBalance).toBe(100);
    });
  });

  describe('validateBalanceDerivation', () => {
    it('should validate correct balance derivation', () => {
      const result = validateBalanceDerivation('WLT7770001', 'KES', mockEntries, 800);
      
      expect(result.isValid).toBe(true);
      expect(result.calculatedBalance).toBe(800);
      expect(result.message).toBe('Balance derivation is correct');
    });

    it('should detect balance mismatch', () => {
      const result = validateBalanceDerivation('WLT7770001', 'KES', mockEntries, 1000);
      
      expect(result.isValid).toBe(false);
      expect(result.calculatedBalance).toBe(800);
      expect(result.message).toContain('Balance mismatch');
    });
  });

  describe('generateBalanceCalculationSQL', () => {
    it('should generate correct SQL for balance calculation', () => {
      const sql = generateBalanceCalculationSQL('WLT7770001', 'KES');
      
      expect(sql).toContain('SELECT');
      expect(sql).toContain('COALESCE');
      expect(sql).toContain('FROM ledger_entries');
      expect(sql).toContain('WHERE wallet_id = $1 AND currency = $2');
    });
  });
});