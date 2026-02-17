/**
 * SMS Engine Types
 * 
 * Type definitions for SMS sending and logging.
 * Validates Requirements: 36.1, 36.2, 36.5
 */

export type SMSStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface SMSResult {
  id: string;
  recipient: string;
  message: string;
  status: SMSStatus;
  cost: number;
  providerMessageId?: string;
  errorMessage?: string;
  sentAt?: Date;
}

export interface SMSLogEntry {
  id: string;
  recipient: string;
  message: string;
  cost: number;
  status: SMSStatus;
  providerMessageId?: string;
  errorMessage?: string;
  createdAt: Date;
}
