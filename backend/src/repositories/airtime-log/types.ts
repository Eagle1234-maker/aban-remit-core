/**
 * Airtime Log Repository Types
 * 
 * Type definitions for airtime logging.
 */

export type AirtimeLogStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface AirtimeLogEntry {
  id: string;
  transactionReference: string;
  phone: string;
  amount: number;
  status: AirtimeLogStatus;
  providerResponse?: any;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
