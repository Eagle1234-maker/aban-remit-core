import { Currency } from '../../types/index.js';

/**
 * Transaction status for receipts
 */
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';

/**
 * Result of receipt generation
 * Requirements: 34.1
 */
export interface ReceiptPDF {
  pdfBuffer: Buffer;
  filename: string;
  verificationHash: string;
}

/**
 * Complete transaction data for receipt generation
 * Requirements: 34.2
 */
export interface ReceiptData {
  logo?: string; // Base64 or URL
  reference: string;
  dateTime: Date;
  senderName: string;
  senderWallet: string;
  receiverName?: string;
  receiverWallet?: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: Currency;
  status: TransactionStatus;
  providerReference?: string;
  exchangeRate?: number;
  commission?: number;
  verificationHash: string;
}

/**
 * Error thrown when receipt generation fails
 */
export class ReceiptGenerationError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'INVALID_STATUS' | 'GENERATION_FAILED'
  ) {
    super(message);
    this.name = 'ReceiptGenerationError';
  }
}
