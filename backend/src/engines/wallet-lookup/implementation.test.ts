import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WalletLookupEngineImpl } from './implementation.js';
import { WalletLookupError } from './types.js';
import * as db from '../../utils/db.js';

// Mock the database module
vi.mock('../../utils/db.js');

describe('WalletLookupEngine', () => {
  let engine: WalletLookupEngineImpl;
  const mockQuery = vi.mocked(db.query);

  beforeEach(() => {
    engine = new WalletLookupEngineImpl();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('lookupWallet', () => {
    it('should return wallet information with masked phone for ACTIVE wallet', async () => {
      // Arrange
      const walletNumber = 'WLT7770001';
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            wallet_id: 'WLT7770001',
            full_name: 'John Doe',
            phone: '+254712345678',
            wallet_state: 'ACTIVE',
            kyc_status: 'VERIFIED',
          },
        ],
        rowCount: 1,
      } as any);

      // Act
      const result = await engine.lookupWallet(walletNumber);

      // Assert
      expect(result).toEqual({
        walletNumber: 'WLT7770001',
        fullName: 'John Doe',
        phoneMasked: '****5678',
        status: 'ACTIVE',
        kycStatus: 'VERIFIED',
      });

      // Verify query was called with correct parameters
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM core.wallets w'),
        [walletNumber]
      );
    });

    it('should throw NOT_FOUND error when wallet does not exist', async () => {
      // Arrange
      const walletNumber = 'WLT9999999';
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      // Act & Assert
      await expect(engine.lookupWallet(walletNumber)).rejects.toThrow(
        'not found'
      );
    });

    it('should throw LOCKED error when wallet is LOCKED', async () => {
      // Arrange
      const walletNumber = 'WLT7770002';
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            wallet_id: 'WLT7770002',
            full_name: 'Jane Smith',
            phone: '+254723456789',
            wallet_state: 'LOCKED',
            kyc_status: 'VERIFIED',
          },
        ],
        rowCount: 1,
      } as any);

      // Act & Assert
      await expect(engine.lookupWallet(walletNumber)).rejects.toThrow(
        'locked'
      );
    });

    it('should throw FROZEN error when wallet is FROZEN', async () => {
      // Arrange
      const walletNumber = 'WLT7770003';
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            wallet_id: 'WLT7770003',
            full_name: 'Bob Johnson',
            phone: '+254734567890',
            wallet_state: 'FROZEN',
            kyc_status: 'PENDING',
          },
        ],
        rowCount: 1,
      } as any);

      // Act & Assert
      await expect(engine.lookupWallet(walletNumber)).rejects.toThrow(
        'frozen'
      );
    });

    it('should allow lookup for SUSPENDED wallet', async () => {
      // Arrange
      const walletNumber = 'WLT7770004';
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            wallet_id: 'WLT7770004',
            full_name: 'Alice Brown',
            phone: '+254745678901',
            wallet_state: 'SUSPENDED',
            kyc_status: 'UNVERIFIED',
          },
        ],
        rowCount: 1,
      } as any);

      // Act
      const result = await engine.lookupWallet(walletNumber);

      // Assert
      expect(result).toEqual({
        walletNumber: 'WLT7770004',
        fullName: 'Alice Brown',
        phoneMasked: '****8901',
        status: 'SUSPENDED',
        kycStatus: 'UNVERIFIED',
      });
    });

    it('should work with agent wallet numbers', async () => {
      // Arrange
      const walletNumber = 'AGT8880001';
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            wallet_id: 'AGT8880001',
            full_name: 'Agent Business Ltd',
            phone: '+254756789012',
            wallet_state: 'ACTIVE',
            kyc_status: 'VERIFIED',
          },
        ],
        rowCount: 1,
      } as any);

      // Act
      const result = await engine.lookupWallet(walletNumber);

      // Assert
      expect(result).toEqual({
        walletNumber: 'AGT8880001',
        fullName: 'Agent Business Ltd',
        phoneMasked: '****9012',
        status: 'ACTIVE',
        kycStatus: 'VERIFIED',
      });
    });

    it('should mask phone numbers correctly for different formats', async () => {
      // Arrange
      const walletNumber = 'WLT7770005';
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            wallet_id: 'WLT7770005',
            full_name: 'Test User',
            phone: '0712345678', // Local format
            wallet_state: 'ACTIVE',
            kyc_status: 'VERIFIED',
          },
        ],
        rowCount: 1,
      } as any);

      // Act
      const result = await engine.lookupWallet(walletNumber);

      // Assert
      expect(result.phoneMasked).toBe('****5678');
    });

    it('should use indexed query for performance', async () => {
      // Arrange
      const walletNumber = 'WLT7770001';
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            wallet_id: 'WLT7770001',
            full_name: 'John Doe',
            phone: '+254712345678',
            wallet_state: 'ACTIVE',
            kyc_status: 'VERIFIED',
          },
        ],
        rowCount: 1,
      } as any);

      // Act
      await engine.lookupWallet(walletNumber);

      // Assert - verify the query uses WHERE w.id = $1 which uses the index
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE w.id = $1'),
        [walletNumber]
      );
    });
  });
});
