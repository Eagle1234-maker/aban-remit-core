/**
 * SMS Engine Implementation
 * 
 * Sends SMS messages and logs all attempts to the SMS log repository.
 * Validates Requirements: 36.1, 36.2, 36.5
 */

import { SMSEngine } from './interface.js';
import { SMSResult, SMSStatus } from './types.js';
import { SMSLogRepository } from '../../repositories/sms-log/interface.js';

export class SMSEngineImpl implements SMSEngine {
  private smsLogRepository: SMSLogRepository;
  private smsCostPerMessage: number;
  
  constructor(smsLogRepository: SMSLogRepository, smsCostPerMessage: number = 1.0) {
    this.smsLogRepository = smsLogRepository;
    this.smsCostPerMessage = smsCostPerMessage;
  }
  
  /**
   * Send an SMS message
   * Logs every attempt with recipient, message, cost, and status
   */
  async sendSMS(recipient: string, message: string): Promise<SMSResult> {
    const cost = this.smsCostPerMessage;
    let status: SMSStatus = 'PENDING';
    let providerMessageId: string | undefined;
    let errorMessage: string | undefined;
    
    try {
      // Simulate SMS sending (in production, call actual SMS provider API)
      // For now, we'll mock a successful send
      const mockProviderResponse = await this.mockSMSProvider(recipient, message);
      
      if (mockProviderResponse.success) {
        status = 'SENT';
        providerMessageId = mockProviderResponse.messageId;
      } else {
        status = 'FAILED';
        errorMessage = mockProviderResponse.error;
      }
    } catch (error) {
      status = 'FAILED';
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Log the SMS attempt
    const logEntry = await this.smsLogRepository.createLog({
      recipient,
      message,
      cost,
      status,
      providerMessageId,
      errorMessage
    });
    
    return {
      id: logEntry.id,
      recipient: logEntry.recipient,
      message: logEntry.message,
      status: logEntry.status,
      cost: logEntry.cost,
      providerMessageId: logEntry.providerMessageId,
      errorMessage: logEntry.errorMessage,
      sentAt: logEntry.createdAt
    };
  }
  
  /**
   * Send OTP SMS
   */
  async sendOTP(recipient: string, code: string): Promise<SMSResult> {
    const message = `Your ABAN verification code is ${code}. Valid for 5 minutes.`;
    return this.sendSMS(recipient, message);
  }
  
  /**
   * Send transaction notification SMS
   */
  async sendTransactionNotification(recipient: string, message: string): Promise<SMSResult> {
    return this.sendSMS(recipient, message);
  }
  
  /**
   * Mock SMS provider (replace with actual provider in production)
   */
  private async mockSMSProvider(recipient: string, message: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock success for valid phone numbers
    if (recipient.startsWith('+254') || recipient.startsWith('254')) {
      return {
        success: true,
        messageId: `SMS-${Date.now()}-${Math.random().toString(36).substring(7)}`
      };
    }
    
    // Mock failure for invalid phone numbers
    return {
      success: false,
      error: 'Invalid phone number format'
    };
  }
}
