/**
 * Unit tests for Transaction Locking Utilities
 * Validates Requirements: 35.4
 */

import { describe, it, expect, vi } from 'vitest';
import { generateWalletLockSQL, lockWallets, executeWithWalletLocks } from './transaction-locking.js';

describe('Transaction Locking', () => {
  describe('generateWalletLockSQL', () => {
    it('should generate SQL with FOR UPDATE for single wallet', () => {
      const sql = generateWalletLockSQL(['WLT7770001']);
      
      expect(sql).toContain('SELECT id, owner_id, type, state, created_at, updated_at');
      expect(sql).toContain('FROM wallets');
      expect(sql).toContain('WHERE id IN ($1)');
      expect(sql).toContain('FOR UPDATE');
    });

    it('should generate SQL with multiple placeholders for multiple wallets', () => {
      const sql = generateWalletLockSQL(['WLT7770001', 'WLT7770002']);
      
      expect(sql).toContain('WHERE id IN ($1, $2)');
      expect(sql).toContain('FOR UPDATE');
    });

    it('should handle three wallets correctly', () => {
      const sql = generateWalletLockSQL(['WLT7770001', 'WLT7770002', 'AGT8880001']);
      
      expect(sql).toContain('WHERE id IN ($1, $2, $3)');
    });

    it('should throw error for empty wallet array', () => {
      expect(() => {
        generateWalletLockSQL([]);
      }).toThrow('At least one wallet ID must be provided for locking');
    });

    it('should include all required columns in SELECT', () => {
      const sql = generateWalletLockSQL(['WLT7770001']);
      
      expect(sql).toContain('id');
      expect(sql).toContain('owner_id');
      expect(sql).toContain('type');
      expect(sql).toContain('state');
      expect(sql).toContain('created_at');
      expect(sql).toContain('updated_at');
    });
  });

  describe('lockWallets', () => {
    it('should return wallet records for provided IDs', async () => {
      const walletIds = ['WLT7770001', 'WLT7770002'];
      
      const wallets = await lockWallets(walletIds);
      
      expect(wallets).toHaveLength(2);
      expect(wallets[0].id).toBe('WLT7770001');
      expect(wallets[1].id).toBe('WLT7770002');
    });

    it('should set correct type for user wallets', async () => {
      const wallets = await lockWallets(['WLT7770001']);
      
      expect(wallets[0].type).toBe('USER');
    });

    it('should set correct type for agent wallets', async () => {
      const wallets = await lockWallets(['AGT8880001']);
      
      expect(wallets[0].type).toBe('AGENT');
    });

    it('should include all required wallet fields', async () => {
      const wallets = await lockWallets(['WLT7770001']);
      const wallet = wallets[0];
      
      expect(wallet.id).toBeDefined();
      expect(wallet.owner_id).toBeDefined();
      expect(wallet.type).toBeDefined();
      expect(wallet.state).toBeDefined();
      expect(wallet.created_at).toBeDefined();
      expect(wallet.updated_at).toBeDefined();
    });

    it('should handle mixed wallet types', async () => {
      const wallets = await lockWallets(['WLT7770001', 'AGT8880001']);
      
      expect(wallets[0].type).toBe('USER');
      expect(wallets[1].type).toBe('AGENT');
    });
  });

  describe('executeWithWalletLocks', () => {
    it('should execute operation with locked wallets', async () => {
      const walletIds = ['WLT7770001', 'WLT7770002'];
      const mockOperation = vi.fn().mockResolvedValue('success');
      
      const result = await executeWithWalletLocks(walletIds, mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'WLT7770001' }),
          expect.objectContaining({ id: 'WLT7770002' })
        ])
      );
    });

    it('should pass locked wallets to operation function', async () => {
      const walletIds = ['WLT7770001'];
      let receivedWallets: any[] = [];
      
      await executeWithWalletLocks(walletIds, async (wallets) => {
        receivedWallets = wallets;
        return 'done';
      });
      
      expect(receivedWallets).toHaveLength(1);
      expect(receivedWallets[0].id).toBe('WLT7770001');
    });

    it('should propagate operation errors', async () => {
      const walletIds = ['WLT7770001'];
      const mockOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));
      
      await expect(
        executeWithWalletLocks(walletIds, mockOperation)
      ).rejects.toThrow('Operation failed');
    });

    it('should handle successful operations', async () => {
      const walletIds = ['WLT7770001'];
      const mockOperation = vi.fn().mockResolvedValue({ transactionId: 'TXN123' });
      
      const result = await executeWithWalletLocks(walletIds, mockOperation);
      
      expect(result).toEqual({ transactionId: 'TXN123' });
    });

    it('should work with empty operation result', async () => {
      const walletIds = ['WLT7770001'];
      const mockOperation = vi.fn().mockResolvedValue(undefined);
      
      const result = await executeWithWalletLocks(walletIds, mockOperation);
      
      expect(result).toBeUndefined();
    });
  });
});