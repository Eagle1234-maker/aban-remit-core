/**
 * Withdrawal Configuration Module
 * 
 * Manages withdrawal-related configuration including OTP threshold.
 * Validates Requirements: 33.2
 */

export interface WithdrawalConfig {
  otpThreshold: number; // Amount above which OTP is required (in KES)
  otpExpiry: number; // Seconds (default: 300)
}

/**
 * Get withdrawal configuration from environment variables
 * Default threshold: 10,000 KES
 */
export function getWithdrawalConfig(): WithdrawalConfig {
  const otpThreshold = parseFloat(process.env.WITHDRAWAL_OTP_THRESHOLD || '10000');
  const otpExpiry = parseInt(process.env.OTP_EXPIRY_SECONDS || '300', 10);
  
  return {
    otpThreshold,
    otpExpiry
  };
}

/**
 * Check if a withdrawal amount requires OTP verification
 * @param amount - Withdrawal amount in KES
 * @returns true if amount exceeds threshold, false otherwise
 */
export function requiresOTP(amount: number): boolean {
  const config = getWithdrawalConfig();
  return amount > config.otpThreshold;
}
