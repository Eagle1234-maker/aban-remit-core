/**
 * M-Pesa Daraja API Types
 */

export interface STKPushResult {
  checkoutRequestId: string;
  merchantRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
}

export interface TransactionStatusResult {
  resultCode: string;
  resultDesc: string;
  mpesaReceiptNumber?: string;
  transactionDate?: Date;
  phoneNumber?: string;
  amount?: number;
}

export class MPesaError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'MPesaError';
  }
}

export class MPesaAuthError extends MPesaError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR');
    this.name = 'MPesaAuthError';
  }
}

export class MPesaValidationError extends MPesaError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'MPesaValidationError';
  }
}
