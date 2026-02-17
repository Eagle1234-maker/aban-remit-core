import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import depositsRoutes, { setMPESALogRepositoryFactory } from './deposits.js';

describe('POST /deposits/mpesa/callback', () => {
  let app: express.Application;
  let mockFindByReceipt: any;
  let mockCreateLog: any;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    
    // Setup mocks
    mockFindByReceipt = vi.fn();
    mockCreateLog = vi.fn();
    
    // Set up the factory to return our mock
    setMPESALogRepositoryFactory(() => ({
      findByReceipt: mockFindByReceipt,
      createLog: mockCreateLog
    } as any));
    
    app.use('/deposits', depositsRoutes);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid MPESA callback', () => {
    it('should process new MPESA deposit and log to mpesa_logs table', async () => {
      // Arrange
      const mpesaCallback = {
        Body: {
          stkCallback: {
            CallbackMetadata: {
              Item: [
                { Name: 'MpesaReceiptNumber', Value: 'MPE123456789' },
                { Name: 'PhoneNumber', Value: '254712345678' },
                { Name: 'Amount', Value: 1000.50 }
              ]
            }
          }
        }
      };

      mockFindByReceipt.mockResolvedValue(null);
      mockCreateLog.mockResolvedValue({
        id: 'log-uuid-123',
        mpesaReceipt: 'MPE123456789',
        phone: '254712345678',
        amount: 1000.50,
        rawPayload: mpesaCallback,
        createdAt: new Date()
      });

      // Act
      const response = await request(app)
        .post('/deposits/mpesa/callback')
        .send(mpesaCallback);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.receipt).toBe('MPE123456789');
      expect(mockFindByReceipt).toHaveBeenCalledWith('MPE123456789');
      expect(mockCreateLog).toHaveBeenCalledWith({
        receipt: 'MPE123456789',
        phone: '254712345678',
        amount: 1000.50,
        rawPayload: mpesaCallback
      });
    });

    it('should generate deposit SMS with correct format (Requirement 32.6)', async () => {
      // Arrange - Test that SMS is generated with format:
      // "ABAN REMIT: Deposit of KES X received from 2547XXXXXXX. MPESA Ref: XXX New Balance: KES Y."
      const mpesaCallback = {
        Body: {
          stkCallback: {
            CallbackMetadata: {
              Item: [
                { Name: 'MpesaReceiptNumber', Value: 'MPE123456789' },
                { Name: 'PhoneNumber', Value: '254712345678' },
                { Name: 'Amount', Value: 1000.00 }
              ]
            }
          }
        }
      };

      mockFindByReceipt.mockResolvedValue(null);
      mockCreateLog.mockResolvedValue({
        id: 'log-uuid-123',
        mpesaReceipt: 'MPE123456789',
        phone: '254712345678',
        amount: 1000.00,
        rawPayload: mpesaCallback,
        createdAt: new Date()
      });

      // Spy on console.log to verify SMS message generation
      const consoleLogSpy = vi.spyOn(console, 'log');

      // Act
      const response = await request(app)
        .post('/deposits/mpesa/callback')
        .send(mpesaCallback);

      // Assert
      expect(response.status).toBe(200);
      
      // Verify SMS message was generated with correct format
      const smsLogCall = consoleLogSpy.mock.calls.find(call => 
        call[0]?.includes('SMS to be sent:')
      );
      
      expect(smsLogCall).toBeDefined();
      const smsMessage = smsLogCall?.[0] as string;
      
      // Verify SMS contains all required elements per Requirement 32.6
      expect(smsMessage).toContain('ABAN REMIT');
      expect(smsMessage).toContain('Deposit of KES 1000.00');
      expect(smsMessage).toContain('****5678'); // Masked phone
      expect(smsMessage).toContain('MPESA Ref: MPE123456789');
      expect(smsMessage).toContain('New Balance: KES 5000.00');
      
      consoleLogSpy.mockRestore();
    });

    it('should handle alternative MPESA callback format with TransID', async () => {
      // Arrange
      const mpesaCallback = {
        TransID: 'MPE987654321',
        MSISDN: '254798765432',
        TransAmount: '500.00'
      };

      mockFindByReceipt.mockResolvedValue(null);
      mockCreateLog.mockResolvedValue({
        id: 'log-uuid-456',
        mpesaReceipt: 'MPE987654321',
        phone: '254798765432',
        amount: 500.00,
        rawPayload: mpesaCallback,
        createdAt: new Date()
      });

      // Act
      const response = await request(app)
        .post('/deposits/mpesa/callback')
        .send(mpesaCallback);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.receipt).toBe('MPE987654321');
      expect(mockCreateLog).toHaveBeenCalledWith({
        receipt: 'MPE987654321',
        phone: '254798765432',
        amount: 500.00,
        rawPayload: mpesaCallback
      });
    });
  });

  describe('Duplicate receipt handling (Idempotency)', () => {
    it('should reject duplicate MPESA receipt and return existing transaction', async () => {
      // Arrange - Requirement 32.4, 32.5: Check for duplicate receipt and return existing transaction
      const mpesaCallback = {
        Body: {
          stkCallback: {
            CallbackMetadata: {
              Item: [
                { Name: 'MpesaReceiptNumber', Value: 'MPE123456789' },
                { Name: 'PhoneNumber', Value: '254712345678' },
                { Name: 'Amount', Value: 1000.50 }
              ]
            }
          }
        }
      };

      const existingLog = {
        id: 'existing-log-uuid',
        mpesaReceipt: 'MPE123456789',
        phone: '254712345678',
        amount: 1000.50,
        rawPayload: mpesaCallback,
        createdAt: new Date()
      };

      mockFindByReceipt.mockResolvedValue(existingLog);

      // Act
      const response = await request(app)
        .post('/deposits/mpesa/callback')
        .send(mpesaCallback);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Transaction already processed');
      expect(response.body.receipt).toBe('MPE123456789');
      expect(mockFindByReceipt).toHaveBeenCalledWith('MPE123456789');
      expect(mockCreateLog).not.toHaveBeenCalled();
    });

    it('should not create duplicate log entries for same receipt', async () => {
      // Arrange
      const mpesaCallback = {
        TransID: 'MPE555666777',
        MSISDN: '254711223344',
        TransAmount: '750.00'
      };

      const existingLog = {
        id: 'existing-log-uuid-2',
        mpesaReceipt: 'MPE555666777',
        phone: '254711223344',
        amount: 750.00,
        rawPayload: mpesaCallback,
        createdAt: new Date()
      };

      mockFindByReceipt.mockResolvedValue(existingLog);

      // Act
      const response = await request(app)
        .post('/deposits/mpesa/callback')
        .send(mpesaCallback);

      // Assert
      expect(response.status).toBe(200);
      expect(mockCreateLog).not.toHaveBeenCalled();
    });
  });

  describe('Invalid callback payload', () => {
    it('should return 400 when MPESA receipt is missing', async () => {
      // Arrange
      const invalidCallback = {
        Body: {
          stkCallback: {
            CallbackMetadata: {
              Item: [
                { Name: 'PhoneNumber', Value: '254712345678' },
                { Name: 'Amount', Value: 1000.50 }
              ]
            }
          }
        }
      };

      // Act
      const response = await request(app)
        .post('/deposits/mpesa/callback')
        .send(invalidCallback);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('missing required fields');
      expect(mockFindByReceipt).not.toHaveBeenCalled();
      expect(mockCreateLog).not.toHaveBeenCalled();
    });

    it('should return 400 when sender phone is missing', async () => {
      // Arrange
      const invalidCallback = {
        Body: {
          stkCallback: {
            CallbackMetadata: {
              Item: [
                { Name: 'MpesaReceiptNumber', Value: 'MPE123456789' },
                { Name: 'Amount', Value: 1000.50 }
              ]
            }
          }
        }
      };

      // Act
      const response = await request(app)
        .post('/deposits/mpesa/callback')
        .send(invalidCallback);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(mockCreateLog).not.toHaveBeenCalled();
    });

    it('should return 400 when amount is missing', async () => {
      // Arrange
      const invalidCallback = {
        Body: {
          stkCallback: {
            CallbackMetadata: {
              Item: [
                { Name: 'MpesaReceiptNumber', Value: 'MPE123456789' },
                { Name: 'PhoneNumber', Value: '254712345678' }
              ]
            }
          }
        }
      };

      // Act
      const response = await request(app)
        .post('/deposits/mpesa/callback')
        .send(invalidCallback);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(mockCreateLog).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should return 500 when repository throws an error', async () => {
      // Arrange
      const mpesaCallback = {
        TransID: 'MPE123456789',
        MSISDN: '254712345678',
        TransAmount: '1000.50'
      };

      mockFindByReceipt.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const response = await request(app)
        .post('/deposits/mpesa/callback')
        .send(mpesaCallback);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal Server Error');
      expect(response.body.message).toBe('Failed to process MPESA callback');
    });
  });
});
