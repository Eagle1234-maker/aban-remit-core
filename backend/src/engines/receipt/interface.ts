/**
 * Receipt Engine Interface
 * 
 * Handles PDF receipt generation with verification for all transactions.
 * Validates Requirements: 34.1
 */

export interface ReceiptPDF {
  pdfBuffer: Buffer;
  filename: string;
  verificationHash: string;
}

export interface ReceiptData {
  logo: string; // Base64 or URL
  reference: string;
  dateTime: Date;
  senderName: string;
  senderWallet: string;
  receiverName: string;
  receiverWallet: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  status: string;
  providerReference?: string;
  exchangeRate?: number;
  commission?: number;
  verificationHash: string;
}

export interface ReceiptEngine {
  generateReceipt(transactionReference: string): Promise<ReceiptPDF>;
  verifyReceipt(reference: string, hash: string): Promise<boolean>;
}