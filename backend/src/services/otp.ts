/**
 * OTP Service
 * 
 * Handles OTP generation, storage, and verification for withdrawal authentication.
 * Validates Requirements: 33.2, 33.3
 */

import { getWithdrawalConfig } from '../config/withdrawal.js';

interface OTPRecord {
  code: string;
  expiresAt: Date;
  userId: string;
}

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map<string, OTPRecord>();

/**
 * Generate a 6-digit OTP code
 */
function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate and store OTP for a user
 * @param userId - User ID requesting OTP
 * @returns Generated OTP code
 */
export async function generateOTP(userId: string): Promise<string> {
  const config = getWithdrawalConfig();
  const code = generateOTPCode();
  const expiresAt = new Date(Date.now() + config.otpExpiry * 1000);
  
  otpStore.set(userId, {
    code,
    expiresAt,
    userId
  });
  
  return code;
}

/**
 * Verify OTP for a user
 * @param userId - User ID to verify
 * @param code - OTP code to verify
 * @returns true if OTP is valid and not expired, false otherwise
 */
export async function verifyOTP(userId: string, code: string): Promise<boolean> {
  const record = otpStore.get(userId);
  
  if (!record) {
    return false;
  }
  
  // Check if OTP has expired
  if (Date.now() > record.expiresAt.getTime()) {
    otpStore.delete(userId);
    return false;
  }
  
  // Check if code matches
  if (record.code !== code) {
    return false;
  }
  
  // OTP is valid, remove it (one-time use)
  otpStore.delete(userId);
  return true;
}

/**
 * Clear OTP for a user (for testing purposes)
 * @param userId - User ID to clear OTP for
 */
export function clearOTP(userId: string): void {
  otpStore.delete(userId);
}
