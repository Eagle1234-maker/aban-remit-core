import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MPESALogRepositoryImpl } from './implementation.js';
import * as db from '../../utils/db.js';

// Mock the database module
vi.mock('../../utils/db.js');

describe('MPESALogRepository', () => {
  let repository: MPESALogRepositoryImpl;
  const mockQuery = vi.mocked(db.query);

  beforeEach(() => {
    repository = new MPESALogRepositoryImpl();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createLog', () => {
    it('should create a new MPESA log entry with all required fields', async () => {
      // Arrange
      const input = {
        receipt: 'MPE123456789',
        phone: '+254712345678',
        amount: 1000.50,
        rawPayload: {
          TransactionType: 'Pay Bill',
          TransID: 'MPE123456789',
          TransAmount: '1000.50',
          BusinessShortCode: '174379',
          BillRefNumber: 'WLT7770001',
          MSISDN: '254712345678',
          FirstName: 'John',
        },
      };

      const mockRow = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        mpesa_receipt: 'MPE123456789',
        phone: '+254712345678',
        amount: '1000.50',
        raw_payload: input.rawPayload,
        created_at: new Date('2024-01-15T10:30:00Z'),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockRow],
        rowCount: 1,
      } as any);

      // Act
      const result = await repository.createLog(input);

      // Assert
      expect(result).toEqual({
        id: '550e8400-e29b-41d4-a716-446655440000',
        mpesaReceipt: 'MPE123456789',
        phone: '+254712345678',
        amount: 1000.50,
        rawPayload: input.rawPayload,
        createdAt: new Date('2024-01-15T10:30:00Z'),
      });

      // Verify query was called with correct parameters
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO services.mpesa_logs'),
        [input.receipt, input.phone, input.amount, input.rawPayload]
      );
    });

    it('should store raw payload as JSONB', async () => {
      // Arrange
      const input = {
        receipt: 'MPE987654321',
        phone: '+254723456789',
        amount: 500.00,
        rawPayload: {
          TransactionType: 'Pay Bill',
          TransID: 'MPE987654321',
          TransAmount: '500.00',
          ResultCode: '0',
          ResultDesc: 'The service request is processed successfully.',
        },
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: '660e8400-e29b-41d4-a716-446655440001',
            mpesa_receipt: 'MPE987654321',
            phone: '+254723456789',
            amount: '500.00',
            raw_payload: input.rawPayload,
            created_at: new Date(),
          },
        ],
        rowCount: 1,
      } as any);

      // Act
      const result = await repository.createLog(input);

      // Assert
      expect(result.rawPayload).toEqual(input.rawPayload);
      expect(result.rawPayload.ResultCode).toBe('0');
    });

    it('should handle decimal amounts correctly', async () => {
      // Arrange
      const input = {
        receipt: 'MPE111222333',
        phone: '+254734567890',
        amount: 1234.56,
        rawPayload: { TransID: 'MPE111222333' },
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: '770e8400-e29b-41d4-a716-446655440002',
            mpesa_receipt: 'MPE111222333',
            phone: '+254734567890',
            amount: '1234.56', // PostgreSQL returns DECIMAL as string
            raw_payload: input.rawPayload,
            created_at: new Date(),
          },
        ],
        rowCount: 1,
      } as any);

      // Act
      const result = await repository.createLog(input);

      // Assert
      expect(result.amount).toBe(1234.56);
      expect(typeof result.amount).toBe('number');
    });

    it('should throw error for duplicate receipt (unique constraint)', async () => {
      // Arrange
      const input = {
        receipt: 'MPE123456789',
        phone: '+254712345678',
        amount: 1000.00,
        rawPayload: { TransID: 'MPE123456789' },
      };

      // Simulate unique constraint violation
      const error = new Error('duplicate key value violates unique constraint "mpesa_logs_mpesa_receipt_key"');
      (error as any).code = '23505'; // PostgreSQL unique violation code
      mockQuery.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(repository.createLog(input)).rejects.toThrow('duplicate key');
    });
  });

  describe('findByReceipt', () => {
    it('should find MPESA log by receipt number', async () => {
      // Arrange
      const receipt = 'MPE123456789';
      const mockRow = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        mpesa_receipt: 'MPE123456789',
        phone: '+254712345678',
        amount: '1000.50',
        raw_payload: {
          TransactionType: 'Pay Bill',
          TransID: 'MPE123456789',
        },
        created_at: new Date('2024-01-15T10:30:00Z'),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockRow],
        rowCount: 1,
      } as any);

      // Act
      const result = await repository.findByReceipt(receipt);

      // Assert
      expect(result).toEqual({
        id: '550e8400-e29b-41d4-a716-446655440000',
        mpesaReceipt: 'MPE123456789',
        phone: '+254712345678',
        amount: 1000.50,
        rawPayload: mockRow.raw_payload,
        createdAt: new Date('2024-01-15T10:30:00Z'),
      });

      // Verify query uses indexed column
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE mpesa_receipt = $1'),
        [receipt]
      );
    });

    it('should return null when receipt not found', async () => {
      // Arrange
      const receipt = 'MPE999999999';
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      // Act
      const result = await repository.findByReceipt(receipt);

      // Assert
      expect(result).toBeNull();
    });

    it('should use idx_mpesa_logs_receipt index for fast lookup', async () => {
      // Arrange
      const receipt = 'MPE123456789';
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            mpesa_receipt: 'MPE123456789',
            phone: '+254712345678',
            amount: '1000.00',
            raw_payload: {},
            created_at: new Date(),
          },
        ],
        rowCount: 1,
      } as any);

      // Act
      await repository.findByReceipt(receipt);

      // Assert - verify query structure supports index usage
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM services.mpesa_logs'),
        [receipt]
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE mpesa_receipt = $1'),
        [receipt]
      );
    });

    it('should parse amount from string to number', async () => {
      // Arrange
      const receipt = 'MPE555666777';
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: '880e8400-e29b-41d4-a716-446655440003',
            mpesa_receipt: 'MPE555666777',
            phone: '+254745678901',
            amount: '2500.75', // PostgreSQL DECIMAL as string
            raw_payload: {},
            created_at: new Date(),
          },
        ],
        rowCount: 1,
      } as any);

      // Act
      const result = await repository.findByReceipt(receipt);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(2500.75);
      expect(typeof result!.amount).toBe('number');
    });

    it('should preserve raw payload structure', async () => {
      // Arrange
      const receipt = 'MPE444555666';
      const rawPayload = {
        TransactionType: 'Pay Bill',
        TransID: 'MPE444555666',
        TransAmount: '750.00',
        BusinessShortCode: '174379',
        BillRefNumber: 'WLT7770001',
        MSISDN: '254712345678',
        FirstName: 'John',
        MiddleName: 'Doe',
        LastName: 'Smith',
        TransTime: '20240115103000',
        ResultCode: '0',
        ResultDesc: 'Success',
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: '990e8400-e29b-41d4-a716-446655440004',
            mpesa_receipt: 'MPE444555666',
            phone: '+254712345678',
            amount: '750.00',
            raw_payload: rawPayload,
            created_at: new Date(),
          },
        ],
        rowCount: 1,
      } as any);

      // Act
      const result = await repository.findByReceipt(receipt);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.rawPayload).toEqual(rawPayload);
      expect(result!.rawPayload.FirstName).toBe('John');
      expect(result!.rawPayload.ResultCode).toBe('0');
    });
  });

  describe('idempotency checking', () => {
    it('should support duplicate detection workflow', async () => {
      // Arrange
      const receipt = 'MPE123456789';

      // First check - not found
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      // Act - First check
      const firstCheck = await repository.findByReceipt(receipt);

      // Assert - Not found
      expect(firstCheck).toBeNull();

      // Arrange - Create log
      const input = {
        receipt: 'MPE123456789',
        phone: '+254712345678',
        amount: 1000.00,
        rawPayload: { TransID: 'MPE123456789' },
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'aa0e8400-e29b-41d4-a716-446655440005',
            mpesa_receipt: 'MPE123456789',
            phone: '+254712345678',
            amount: '1000.00',
            raw_payload: input.rawPayload,
            created_at: new Date(),
          },
        ],
        rowCount: 1,
      } as any);

      // Act - Create
      await repository.createLog(input);

      // Arrange - Second check - found
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'aa0e8400-e29b-41d4-a716-446655440005',
            mpesa_receipt: 'MPE123456789',
            phone: '+254712345678',
            amount: '1000.00',
            raw_payload: input.rawPayload,
            created_at: new Date(),
          },
        ],
        rowCount: 1,
      } as any);

      // Act - Second check
      const secondCheck = await repository.findByReceipt(receipt);

      // Assert - Found
      expect(secondCheck).not.toBeNull();
      expect(secondCheck!.mpesaReceipt).toBe(receipt);
    });
  });
});
