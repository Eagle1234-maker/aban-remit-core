/**
 * TalkSasa SMS Engine Types
 * 
 * Type definitions for TalkSasa Bulk SMS API integration.
 * Validates Requirements: 4.1, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

export type TalkSasaSMSStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface TalkSasaSMSResult {
  id: string;
  recipient: string;
  message: string;
  status: TalkSasaSMSStatus;
  cost: number;
  providerMessageId?: string;
  errorMessage?: string;
  sentAt?: Date;
}

export interface TalkSasaAPIResponse {
  success: boolean;
  message: string;
  data?: {
    message_id?: string;
    cost?: number;
    balance?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export class TalkSasaError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public providerError?: { code: string; message: string }
  ) {
    super(message);
    this.name = 'TalkSasaError';
  }
}

export class TalkSasaValidationError extends TalkSasaError {
  constructor(message: string) {
    super(message, 'TALKSASA_VALIDATION_ERROR');
    this.name = 'TalkSasaValidationError';
  }
}
