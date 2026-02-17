/**
 * TalkSasa SMS Engine Implementation
 * 
 * Implements TalkSasa Bulk SMS API integration with Bearer token authentication.
 * Validates Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { TalkSasaEngine } from './interface.js';
import { 
  TalkSasaSMSResult, 
  TalkSasaSMSStatus, 
  TalkSasaError, 
  TalkSasaValidationError,
  TalkSasaAPIResponse 
} from './types.js';
import { normalizeForTalkSasa, isValidKenyanPhone } from '../../utils/phone-normalization.js';
import { httpClient } from '../../utils/http-client.js';
import { SMSLogRepository } from '../../repositories/sms-log/interface.js';

export class TalkSasaEngineImpl implements TalkSasaEngine {
  private apiToken: string;
  private senderId: string;
  private apiUrl: string;
  private timeout: number;
  private smsLogRepository: SMSLogRepository;
  
  constructor(smsLogRepository: SMSLogRepository) {
    // Load configuration from environment variables
    this.apiToken = process.env.TALKSASA_API_TOKEN || '';
    this.senderId = process.env.TALKSASA_SENDER_ID || '';
    this.apiUrl = process.env.TALKSASA_API_URL || 'https://bulksms.talksasa.com/api/v3';
    this.timeout = parseInt(process.env.TALKSASA_TIMEOUT || '15000', 10);
    this.smsLogRepository = smsLogRepository;
    
    // Validate configuration
    if (!this.apiToken) {
      throw new Error('TALKSASA_API_TOKEN is required');
    }
    if (!this.senderId) {
      throw new Error('TALKSASA_SENDER_ID is required');
    }
  }
  
  /**
   * Send SMS message via TalkSasa API
   * Logs every attempt with recipient, message, cost, and status
   */
  async sendSMS(recipient: string, message: string): Promise<TalkSasaSMSResult> {
    // Validate phone number
    if (!isValidKenyanPhone(recipient)) {
      throw new TalkSasaValidationError(`Invalid Kenyan phone number: ${recipient}`);
    }
    
    // Normalize phone number for TalkSasa
    const normalizedPhone = normalizeForTalkSasa(recipient);
    
    // Validate message
    if (!message || message.trim().length === 0) {
      throw new TalkSasaValidationError('SMS message cannot be empty');
    }
    
    let status: TalkSasaSMSStatus = 'PENDING';
    let providerMessageId: string | undefined;
    let errorMessage: string | undefined;
    let cost = 0;
    
    try {
      // Send SMS via TalkSasa API
      const response = await httpClient.request<TalkSasaAPIResponse>({
        method: 'POST',
        url: `${this.apiUrl}/sms/send`,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: {
          sender_id: this.senderId,
          recipient: normalizedPhone,
          message: message
        },
        timeout: this.timeout,
        retryConfig: {
          maxRetries: 3,
          retryableStatusCodes: [429, 500, 502, 503, 504],
          backoffMultiplier: 2,
          initialDelayMs: 1000
        }
      });
      
      // Parse response
      if (response.data.success) {
        status = 'SENT';
        providerMessageId = response.data.data?.message_id;
        cost = response.data.data?.cost || 1.0; // Default cost if not provided
      } else {
        // API returned error
        status = 'FAILED';
        errorMessage = response.data.error?.message || response.data.message || 'Unknown error';
      }
    } catch (error) {
      // Handle errors
      status = 'FAILED';
      
      if (error instanceof TalkSasaError) {
        throw error;
      }
      
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Log the SMS attempt to repository
    const logEntry = await this.smsLogRepository.createLog({
      recipient: normalizedPhone,
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
      status: logEntry.status as TalkSasaSMSStatus,
      cost: logEntry.cost,
      providerMessageId: logEntry.providerMessageId,
      errorMessage: logEntry.errorMessage,
      sentAt: logEntry.createdAt
    };
  }
  
  /**
   * Send OTP SMS via TalkSasa API
   */
  async sendOTP(recipient: string, code: string): Promise<TalkSasaSMSResult> {
    const message = `Your ABAN verification code is ${code}. Valid for 5 minutes.`;
    return this.sendSMS(recipient, message);
  }
  
  /**
   * Send transaction notification SMS via TalkSasa API
   */
  async sendTransactionNotification(recipient: string, message: string): Promise<TalkSasaSMSResult> {
    return this.sendSMS(recipient, message);
  }
}
