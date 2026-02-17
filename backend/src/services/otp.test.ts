/**
 * Unit tests for OTP Service
 * Validates Requirements: 33.2, 33.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateOTP, verifyOTP, clearOTP } from './otp';

describe('OTP Service', () => {
  const testUserId = 'user-123';

  beforeEach(() => {
    // Clear any existing OTPs
    clearOTP(testUserId);
  });

  afterEach(() => {
    // Clean up
    clearOTP(testUserId);
    vi.restoreAllMocks();
  });

  describe('generateOTP', () => {
    it('should generate a 6-digit OTP code', async () => {
      const code = await generateOTP(testUserId);
      
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate different codes for different users', async () => {
      const code1 = await generateOTP('user-1');
      const code2 = await generateOTP('user-2');
      
      // Codes should be different (with very high probability)
      expect(code1).not.toBe(code2);
      
      // Clean up
      clearOTP('user-1');
      clearOTP('user-2');
    });

    it('should replace existing OTP when generating new one', async () => {
      const code1 = await generateOTP(testUserId);
      const code2 = await generateOTP(testUserId);
      
      expect(code1).not.toBe(code2);
      
      // Old code should not work
      const isValid1 = await verifyOTP(testUserId, code1);
      expect(isValid1).toBe(false);
    });
  });

  describe('verifyOTP', () => {
    it('should return true for valid OTP', async () => {
      const code = await generateOTP(testUserId);
      const isValid = await verifyOTP(testUserId, code);
      
      expect(isValid).toBe(true);
    });

    it('should return false for invalid OTP', async () => {
      await generateOTP(testUserId);
      const isValid = await verifyOTP(testUserId, '000000');
      
      expect(isValid).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      const isValid = await verifyOTP('non-existent-user', '123456');
      
      expect(isValid).toBe(false);
    });

    it('should return false for expired OTP', async () => {
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      let currentTime = Date.now();
      
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);
      
      const code = await generateOTP(testUserId);
      
      // Advance time by 6 minutes (OTP expires in 5 minutes)
      currentTime += 6 * 60 * 1000;
      
      const isValid = await verifyOTP(testUserId, code);
      
      expect(isValid).toBe(false);
      
      // Restore Date.now
      Date.now = originalNow;
    });

    it('should remove OTP after successful verification (one-time use)', async () => {
      const code = await generateOTP(testUserId);
      
      // First verification should succeed
      const isValid1 = await verifyOTP(testUserId, code);
      expect(isValid1).toBe(true);
      
      // Second verification with same code should fail
      const isValid2 = await verifyOTP(testUserId, code);
      expect(isValid2).toBe(false);
    });

    it('should not remove OTP after failed verification', async () => {
      const code = await generateOTP(testUserId);
      
      // Try with wrong code
      const isValid1 = await verifyOTP(testUserId, '000000');
      expect(isValid1).toBe(false);
      
      // Try with correct code - should still work
      const isValid2 = await verifyOTP(testUserId, code);
      expect(isValid2).toBe(true);
    });
  });

  describe('clearOTP', () => {
    it('should remove OTP for user', async () => {
      const code = await generateOTP(testUserId);
      clearOTP(testUserId);
      
      const isValid = await verifyOTP(testUserId, code);
      expect(isValid).toBe(false);
    });

    it('should not affect other users', async () => {
      const code1 = await generateOTP('user-1');
      const code2 = await generateOTP('user-2');
      
      clearOTP('user-1');
      
      // user-1 OTP should be cleared
      const isValid1 = await verifyOTP('user-1', code1);
      expect(isValid1).toBe(false);
      
      // user-2 OTP should still work
      const isValid2 = await verifyOTP('user-2', code2);
      expect(isValid2).toBe(true);
      
      // Clean up
      clearOTP('user-2');
    });
  });
});
