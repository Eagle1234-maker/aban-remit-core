/**
 * SMS Engine Interface
 * 
 * Defines the contract for SMS sending with logging.
 * Validates Requirements: 36.1, 36.2, 36.5
 */

import { SMSResult } from './types.js';

export interface SMSEngine {
  /**
   * Send an SMS message
   * Logs every attempt with recipient, message, cost, and status
   * 
   * @param recipient - Phone number to send SMS to
   * @param message - SMS message content
   * @returns SMS result with status and logging information
   */
  sendSMS(recipient: string, message: string): Promise<SMSResult>;
  
  /**
   * Send OTP SMS
   * 
   * @param recipient - Phone number to send OTP to
   * @param code - OTP code
   * @returns SMS result
   */
  sendOTP(recipient: string, code: string): Promise<SMSResult>;
  
  /**
   * Send transaction notification SMS
   * 
   * @param recipient - Phone number to send notification to
   * @param message - Transaction notification message
   * @returns SMS result
   */
  sendTransactionNotification(recipient: string, message: string): Promise<SMSResult>;
}
