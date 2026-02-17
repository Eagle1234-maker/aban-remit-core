/**
 * Unit tests for Wallet Withdrawal Routes
 * Validates Requirements: 33.2, 33.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import walletRouter from './wallet';
import { clearOTP } from '../services/otp';

// Mock authentication middleware
vi.mock('../middleware/auth.js', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { userId: 'test-user-123', role: 'USER' };
    next();
  },
  AuthenticatedRequest: class {}
}));

describe('Wallet Withdrawal Routes', () => {
  let app: Express;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/wallet', walletRouter);
    
    // Clear any existing OTPs
    clearOTP(testUserId);
    
    // Set withdrawal threshold for testing
    process.env.WITHDRAWAL_OTP_THRESHOLD = '10000';
  });

  afterEach(() => {
    clearOTP(testUserId);
    vi.restoreAllMocks();
  });

  describe('POST /wallet/withdraw/request', () => {
    it('should return otpRequired: false for amounts below threshold', async () => {
      const response = await request(app)
        .post('/wallet/withdraw/request')
        .send({
          amount: 5000,
          currency: 'KES',
          phone: '+254712345678'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.otpRequired).toBe(false);
    });

    it('should return otpRequired: false for amounts equal to threshold', async () => {
      const response = await request(app)
        .post('/wallet/withdraw/request')
        .send({
          amount: 10000,
          currency: 'KES',
          phone: '+254712345678'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.otpRequired).toBe(false);
    });

    it('should return otpRequired: true for amounts above threshold', async () => {
      const response = await request(app)
        .post('/wallet/withdraw/request')
        .send({
          amount: 15000,
          currency: 'KES',
          phone: '+254712345678'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.otpRequired).toBe(true);
      expect(response.body.message).toContain('OTP');
    });

    it('should return 400 for missing amount', async () => {
      const response = await request(app)
        .post('/wallet/withdraw/request')
        .send({
          currency: 'KES',
          phone: '+254712345678'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 for missing currency', async () => {
      const response = await request(app)
        .post('/wallet/withdraw/request')
        .send({
          amount: 5000,
          phone: '+254712345678'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 for missing phone', async () => {
      const response = await request(app)
        .post('/wallet/withdraw/request')
        .send({
          amount: 5000,
          currency: 'KES'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 for negative amount', async () => {
      const response = await request(app)
        .post('/wallet/withdraw/request')
        .send({
          amount: -1000,
          currency: 'KES',
          phone: '+254712345678'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('greater than 0');
    });

    it('should return 400 for zero amount', async () => {
      const response = await request(app)
        .post('/wallet/withdraw/request')
        .send({
          amount: 0,
          currency: 'KES',
          phone: '+254712345678'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('greater than 0');
    });
  });

  describe('POST /wallet/withdraw/confirm', () => {
    it('should process withdrawal without OTP for amounts below threshold', async () => {
      const response = await request(app)
        .post('/wallet/withdraw/confirm')
        .send({
          amount: 5000,
          currency: 'KES',
          phone: '+254712345678'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transactionId).toBeDefined();
    });

    it('should require OTP for amounts above threshold', async () => {
      const response = await request(app)
        .post('/wallet/withdraw/confirm')
        .send({
          amount: 15000,
          currency: 'KES',
          phone: '+254712345678'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('OTP is required');
    });

    it('should reject invalid OTP', async () => {
      const response = await request(app)
        .post('/wallet/withdraw/confirm')
        .send({
          amount: 15000,
          currency: 'KES',
          phone: '+254712345678',
          otp: '000000'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid or expired OTP');
    });

    it('should process withdrawal with valid OTP', async () => {
      // First, request OTP
      const requestResponse = await request(app)
        .post('/wallet/withdraw/request')
        .send({
          amount: 15000,
          currency: 'KES',
          phone: '+254712345678'
        });

      expect(requestResponse.body.otpRequired).toBe(true);

      // Get the OTP from console.log (in production, this would be sent via SMS)
      // For testing, we'll generate a new OTP and use it
      const { generateOTP } = await import('../services/otp');
      const otp = await generateOTP(testUserId);

      // Confirm withdrawal with OTP
      const confirmResponse = await request(app)
        .post('/wallet/withdraw/confirm')
        .send({
          amount: 15000,
          currency: 'KES',
          phone: '+254712345678',
          otp
        });

      expect(confirmResponse.status).toBe(200);
      expect(confirmResponse.body.success).toBe(true);
      expect(confirmResponse.body.transactionId).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/wallet/withdraw/confirm')
        .send({
          amount: 5000
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 for negative amount', async () => {
      const response = await request(app)
        .post('/wallet/withdraw/confirm')
        .send({
          amount: -1000,
          currency: 'KES',
          phone: '+254712345678'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('greater than 0');
    });
  });

  describe('OTP Integration', () => {
    it('should generate OTP on request and verify on confirm', async () => {
      // Request withdrawal with amount above threshold
      const requestResponse = await request(app)
        .post('/wallet/withdraw/request')
        .send({
          amount: 20000,
          currency: 'KES',
          phone: '+254712345678'
        });

      expect(requestResponse.body.otpRequired).toBe(true);

      // Generate OTP
      const { generateOTP } = await import('../services/otp');
      const otp = await generateOTP(testUserId);

      // Confirm with correct OTP
      const confirmResponse = await request(app)
        .post('/wallet/withdraw/confirm')
        .send({
          amount: 20000,
          currency: 'KES',
          phone: '+254712345678',
          otp
        });

      expect(confirmResponse.status).toBe(200);
      expect(confirmResponse.body.success).toBe(true);
    });

    it('should reject reused OTP', async () => {
      // Generate OTP
      const { generateOTP } = await import('../services/otp');
      const otp = await generateOTP(testUserId);

      // First confirmation should succeed
      const firstResponse = await request(app)
        .post('/wallet/withdraw/confirm')
        .send({
          amount: 15000,
          currency: 'KES',
          phone: '+254712345678',
          otp
        });

      expect(firstResponse.status).toBe(200);

      // Second confirmation with same OTP should fail
      const secondResponse = await request(app)
        .post('/wallet/withdraw/confirm')
        .send({
          amount: 15000,
          currency: 'KES',
          phone: '+254712345678',
          otp
        });

      expect(secondResponse.status).toBe(400);
      expect(secondResponse.body.message).toContain('Invalid or expired OTP');
    });
  });
});
