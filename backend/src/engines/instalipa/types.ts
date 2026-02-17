/**
 * Instalipa Airtime Engine Types
 * 
 * Type definitions for Instalipa Airtime API integration.
 * Validates Requirements: 6.1, 7.1, 7.2, 7.3, 7.4, 7.5, 15.1, 15.2, 15.3, 15.4
 */

export type AirtimeStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface AirtimePurchaseResult {
  transactionReference: string;
  status: AirtimeStatus;
  phone: string;
  amount: number;
  message: string;
}

export interface BalanceResult {
  balance: number;
  currency: string;
}

export interface InstalipaOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface InstalipaAirtimePurchaseResponse {
  success: boolean;
  transaction_reference: string;
  status: string;
  message: string;
  data?: {
    phone?: string;
    amount?: number;
  };
}

export interface InstalipaBalanceResponse {
  success: boolean;
  balance: number;
  currency: string;
  message?: string;
}

export class InstalipaError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public providerError?: { code: string; message: string }
  ) {
    super(message);
    this.name = 'InstalipaError';
  }
}

export class InstalipaAuthError extends InstalipaError {
  constructor(message: string, statusCode?: number) {
    super(message, 'INSTALIPA_AUTH_ERROR', statusCode);
    this.name = 'InstalipaAuthError';
  }
}

export class InstalipaValidationError extends InstalipaError {
  constructor(message: string) {
    super(message, 'INSTALIPA_VALIDATION_ERROR');
    this.name = 'InstalipaValidationError';
  }
}
