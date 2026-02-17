/**
 * TalkSasa SMS Engine Interface
 * 
 * Defines the contract for TalkSasa Bulk SMS API integration.
 * Validates Requirements: 4.1, 5.1, 5.2, 5.3, 5.4, 5.6
 */

import { TalkSasaSMSResult } from './types.js';

export interface TalkSasaEngine {
  /**
   * Send SMS message via TalkSasa API
   * 
   * @param recipient - Phone number in format 254XXXXXXXXX or +254XXXXXXXXX
   * @param message - SMS message content
   * @returns SMS result with status and provider message ID
   */
  sendSMS(recipient: string, message: string): Promise<TalkSasaSMSResult>;
  
  /**
   * Send OTP SMS via TalkSasa API
   * 
   * @param recipient - Phone number in format 254XXXXXXXXX or +254XXXXXXXXX
   * @param code - OTP code
   * @returns SMS result
   */
  sendOTP(recipient: string, code: string): Promise<TalkSasaSMSResult>;
  
  /**
   * Send transaction notification SMS via TalkSasa API
   * 
   * @param recipient - Phone number in format 254XXXXXXXXX or +254XXXXXXXXX
   * @param message - Transaction notification message
   * @returns SMS result
   */
  sendTransactionNotification(recipient: string, message: string): Promise<TalkSasaSMSResult>;
}
