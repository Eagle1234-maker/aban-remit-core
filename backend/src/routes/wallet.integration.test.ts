import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import walletRoutes from './wallet.js';
import { query } from '../utils/db.js';

// Mock the database query function
vi.mock('../utils/db.js', () => ({
  query: vi.fn()
}));

const app = express();
app.use(express.json());
app.use('/wallet', walletRoutes);

const JWT_SECRET = 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;

describe('GET /wallet/lookup/:walletNumber - Integration Tests', () => {
  let validToken: string;

  beforeAll(() => {
    // Generate a valid JWT token for testing
    validToken = jwt.sign(
      {
        userId: 'user-123',
        role: 'USER',
        walletId: 'WLT7770001'
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when no authorization header is provided', async () => {
      const response = await request(app)
        .get('/wallet/lookup/WLT7770001')
        .expect(401);

      expect(response.body).toEqual({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    });

    it('should return 401 when authorization header is malformed', async () => {
      const response = await request(app)
        .get('/wallet/lookup/WLT7770001')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toEqual({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/wallet/lookup/WLT7770001')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 401 when token is expired', async () => {
      const expiredToken = jwt.sign(
        {
          userId: 'user-123',
          role: 'USER',
          walletId: 'WLT7770001'
        },
        JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/wallet/lookup/WLT7770001')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toEqual({
        error: 'Unauthorized',
        message: 'Token expired'
      });
    });
  });

  describe('Wallet Number Validation', () => {
    it('should return 400 for invalid wallet number format', async () => {
      const response = await request(app)
        .get('/wallet/lookup/INVALID123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Invalid wallet number format. Expected WLT7770001 or AGT8880001'
      });
    });

    it('should return 400 for wallet number with wrong prefix', async () => {
      const response = await request(app)
        .get('/wallet/lookup/XYZ7770001')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 for wallet number with wrong length', async () => {
      const response = await request(app)
        .get('/wallet/lookup/WLT123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });
  });

  describe('Wallet Lookup - Success Cases', () => {
    it('should return 200 with wallet data for ACTIVE user wallet', async () => {
      // Mock database response
      vi.mocked(query).mockResolvedValueOnce({
        rows: [
          {
            wallet_id: 'WLT7770001',
            full_name: 'John Doe',
            phone: '+254712345678',
            wallet_state: 'ACTIVE',
            kyc_status: 'VERIFIED'
          }
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const response = await request(app)
        .get('/wallet/lookup/WLT7770001')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          walletNumber: 'WLT7770001',
          fullName: 'John Doe',
          phoneMasked: '****5678',
          status: 'ACTIVE',
          kycStatus: 'VERIFIED'
        }
      });
    });

    it('should return 200 with wallet data for ACTIVE agent wallet', async () => {
      // Mock database response
      vi.mocked(query).mockResolvedValueOnce({
        rows: [
          {
            wallet_id: 'AGT8880001',
            full_name: 'Jane Agent',
            phone: '+254798765432',
            wallet_state: 'ACTIVE',
            kyc_status: 'VERIFIED'
          }
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const response = await request(app)
        .get('/wallet/lookup/AGT8880001')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.walletNumber).toBe('AGT8880001');
      expect(response.body.data.phoneMasked).toBe('****5432');
    });

    it('should return 200 with wallet data for SUSPENDED wallet', async () => {
      // SUSPENDED wallets should be allowed for lookup (only LOCKED and FROZEN are rejected)
      vi.mocked(query).mockResolvedValueOnce({
        rows: [
          {
            wallet_id: 'WLT7770002',
            full_name: 'Suspended User',
            phone: '+254711111111',
            wallet_state: 'SUSPENDED',
            kyc_status: 'PENDING'
          }
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const response = await request(app)
        .get('/wallet/lookup/WLT7770002')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('SUSPENDED');
    });
  });

  describe('Wallet Lookup - Error Cases', () => {
    it('should return 404 when wallet does not exist (Requirement 31.7)', async () => {
      // Mock database response with no rows
      vi.mocked(query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const response = await request(app)
        .get('/wallet/lookup/WLT9999999')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 when wallet is LOCKED (Requirement 31.4)', async () => {
      // Mock database response with LOCKED wallet
      vi.mocked(query).mockResolvedValueOnce({
        rows: [
          {
            wallet_id: 'WLT7770003',
            full_name: 'Locked User',
            phone: '+254722222222',
            wallet_state: 'LOCKED',
            kyc_status: 'VERIFIED'
          }
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const response = await request(app)
        .get('/wallet/lookup/WLT7770003')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('locked');
      expect(response.body.code).toBe('LOCKED');
    });

    it('should return 400 when wallet is FROZEN (Requirement 31.5)', async () => {
      // Mock database response with FROZEN wallet
      vi.mocked(query).mockResolvedValueOnce({
        rows: [
          {
            wallet_id: 'WLT7770004',
            full_name: 'Frozen User',
            phone: '+254733333333',
            wallet_state: 'FROZEN',
            kyc_status: 'VERIFIED'
          }
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const response = await request(app)
        .get('/wallet/lookup/WLT7770004')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('frozen');
      expect(response.body.code).toBe('FROZEN');
    });
  });

  describe('Phone Masking (Requirement 31.2)', () => {
    it('should mask phone number showing only last 4 digits', async () => {
      vi.mocked(query).mockResolvedValueOnce({
        rows: [
          {
            wallet_id: 'WLT7770005',
            full_name: 'Test User',
            phone: '+254712345678',
            wallet_state: 'ACTIVE',
            kyc_status: 'VERIFIED'
          }
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const response = await request(app)
        .get('/wallet/lookup/WLT7770005')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.data.phoneMasked).toBe('****5678');
      expect(response.body.data.phoneMasked).not.toContain('+254712');
    });
  });

  describe('Sensitive Data Protection (Requirement 31.3)', () => {
    it('should not expose full phone number in response', async () => {
      vi.mocked(query).mockResolvedValueOnce({
        rows: [
          {
            wallet_id: 'WLT7770006',
            full_name: 'Privacy User',
            phone: '+254798765432',
            wallet_state: 'ACTIVE',
            kyc_status: 'VERIFIED'
          }
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const response = await request(app)
        .get('/wallet/lookup/WLT7770006')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toContain('+254798765432');
      expect(responseString).not.toContain('254798765432');
    });

    it('should not expose email or internal user ID', async () => {
      vi.mocked(query).mockResolvedValueOnce({
        rows: [
          {
            wallet_id: 'WLT7770007',
            full_name: 'Security User',
            phone: '+254711223344',
            wallet_state: 'ACTIVE',
            kyc_status: 'VERIFIED'
          }
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const response = await request(app)
        .get('/wallet/lookup/WLT7770007')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.data).not.toHaveProperty('email');
      expect(response.body.data).not.toHaveProperty('userId');
      expect(response.body.data).not.toHaveProperty('owner_id');
    });
  });
});
