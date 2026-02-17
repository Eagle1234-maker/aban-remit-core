/**
 * Unit tests for Withdrawal Configuration
 * Validates Requirements: 33.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getWithdrawalConfig, requiresOTP } from './withdrawal';

describe('Withdrawal Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('getWithdrawalConfig', () => {
    it('should return default threshold of 10,000 KES when not configured', () => {
      delete process.env.WITHDRAWAL_OTP_THRESHOLD;
      
      const config = getWithdrawalConfig();
      
      expect(config.otpThreshold).toBe(10000);
    });

    it('should return configured threshold from environment', () => {
      process.env.WITHDRAWAL_OTP_THRESHOLD = '5000';
      
      const config = getWithdrawalConfig();
      
      expect(config.otpThreshold).toBe(5000);
    });

    it('should return default OTP expiry of 300 seconds when not configured', () => {
      delete process.env.OTP_EXPIRY_SECONDS;
      
      const config = getWithdrawalConfig();
      
      expect(config.otpExpiry).toBe(300);
    });

    it('should return configured OTP expiry from environment', () => {
      process.env.OTP_EXPIRY_SECONDS = '600';
      
      const config = getWithdrawalConfig();
      
      expect(config.otpExpiry).toBe(600);
    });

    it('should handle decimal threshold values', () => {
      process.env.WITHDRAWAL_OTP_THRESHOLD = '10000.50';
      
      const config = getWithdrawalConfig();
      
      expect(config.otpThreshold).toBe(10000.50);
    });
  });

  describe('requiresOTP', () => {
    beforeEach(() => {
      process.env.WITHDRAWAL_OTP_THRESHOLD = '10000';
    });

    it('should return false for amounts below threshold', () => {
      expect(requiresOTP(5000)).toBe(false);
    });

    it('should return false for amounts equal to threshold', () => {
      expect(requiresOTP(10000)).toBe(false);
    });

    it('should return true for amounts above threshold', () => {
      expect(requiresOTP(10000.01)).toBe(true);
    });

    it('should return true for large amounts', () => {
      expect(requiresOTP(50000)).toBe(true);
    });

    it('should handle edge case of threshold + 1 cent', () => {
      expect(requiresOTP(10000.01)).toBe(true);
    });

    it('should handle edge case of threshold - 1 cent', () => {
      expect(requiresOTP(9999.99)).toBe(false);
    });
  });

  describe('requiresOTP with different thresholds', () => {
    it('should respect custom threshold of 5000', () => {
      process.env.WITHDRAWAL_OTP_THRESHOLD = '5000';
      
      expect(requiresOTP(4999)).toBe(false);
      expect(requiresOTP(5000)).toBe(false);
      expect(requiresOTP(5001)).toBe(true);
    });

    it('should respect custom threshold of 20000', () => {
      process.env.WITHDRAWAL_OTP_THRESHOLD = '20000';
      
      expect(requiresOTP(19999)).toBe(false);
      expect(requiresOTP(20000)).toBe(false);
      expect(requiresOTP(20001)).toBe(true);
    });

    it('should respect threshold of 0 (always require OTP)', () => {
      process.env.WITHDRAWAL_OTP_THRESHOLD = '0';
      
      expect(requiresOTP(0)).toBe(false);
      expect(requiresOTP(0.01)).toBe(true);
      expect(requiresOTP(100)).toBe(true);
    });
  });
});
