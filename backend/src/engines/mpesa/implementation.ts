/**
 * M-Pesa Daraja API Engine Implementation
 */

import { MPesaEngine } from './interface.js';
import { STKPushResult, TransactionStatusResult, MPesaError, MPesaAuthError, MPesaValidationError } from './types.js';
import { httpClient } from '../../utils/http-client.js';
import { getAPIConfig } from '../../config/api-config.js';
import { validateAndNormalizeForMPesa } from '../../utils/phone-normalization.js';

interface OAuthResponse {
  access_token: string;
  expires_in: string;
}

interface STKPushRequest {
  BusinessShortCode: string;
  Password: string;
  Timestamp: string;
  TransactionType: string;
  Amount: number;
  PartyA: string;
  PartyB: string;
  PhoneNumber: string;
  CallBackURL: string;
  AccountReference: string;
  TransactionDesc: string;
}

interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface STKQueryRequest {
  BusinessShortCode: string;
  Password: string;
  Timestamp: string;
  CheckoutRequestID: string;
}

interface STKQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

/**
 * Token cache entry
 */
interface TokenCache {
  token: string;
  expiresAt: Date;
}

export class MPesaEngineImpl implements MPesaEngine {
  private config: ReturnType<typeof getAPIConfig>['mpesa'];
  private tokenCache: TokenCache | null = null;

  constructor() {
    this.config = getAPIConfig().mpesa;
  }

  /**
   * Get access token with caching
   */
  async getAccessToken(): Promise<string> {
    // Check if cached token is still valid
    if (this.tokenCache && this.isTokenValid(this.tokenCache)) {
      return this.tokenCache.token;
    }

    // Fetch new token
    try {
      const credentials = Buffer.from(
        `${this.config.consumerKey}:${this.config.consumerSecret}`
      ).toString('base64');

      const response = await httpClient.request<OAuthResponse>({
        method: 'GET',
        url: `${this.config.apiUrl}/oauth/v1/generate?grant_type=client_credentials`,
        headers: {
          Authorization: `Basic ${credentials}`,
        },
        timeout: this.config.timeout,
      });

      const token = response.data.access_token;
      const expiresIn = parseInt(response.data.expires_in, 10);

      // Cache token (subtract 60 seconds for safety margin)
      this.tokenCache = {
        token,
        expiresAt: new Date(Date.now() + (expiresIn - 60) * 1000),
      };

      return token;
    } catch (error) {
      throw new MPesaAuthError(
        `Failed to obtain M-Pesa access token: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Initiate STK Push payment request
   */
  async initiateSTKPush(
    phone: string,
    amount: number,
    accountReference: string
  ): Promise<STKPushResult> {
    // Validate inputs
    if (amount <= 0) {
      throw new MPesaValidationError('Amount must be greater than zero');
    }

    if (!accountReference || accountReference.trim() === '') {
      throw new MPesaValidationError('Account reference is required');
    }

    // Normalize phone number
    const normalizedPhone = validateAndNormalizeForMPesa(phone);

    // Get access token
    const accessToken = await this.getAccessToken();

    // Generate password and timestamp
    const timestamp = this.generateTimestamp();
    const password = this.generatePassword(timestamp);

    // Prepare request
    const requestBody: STKPushRequest = {
      BusinessShortCode: this.config.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.floor(amount), // M-Pesa requires integer amount
      PartyA: normalizedPhone,
      PartyB: this.config.shortcode,
      PhoneNumber: normalizedPhone,
      CallBackURL: this.config.callbackUrl,
      AccountReference: accountReference.substring(0, 12), // Max 12 characters
      TransactionDesc: `Payment for ${accountReference}`,
    };

    try {
      const response = await httpClient.request<STKPushResponse>({
        method: 'POST',
        url: `${this.config.apiUrl}/mpesa/stkpush/v1/processrequest`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: requestBody,
        timeout: this.config.timeout,
      });

      // Check response code
      if (response.data.ResponseCode !== '0') {
        throw new MPesaError(
          `STK Push failed: ${response.data.ResponseDescription}`,
          response.data.ResponseCode
        );
      }

      return {
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
        customerMessage: response.data.CustomerMessage,
      };
    } catch (error) {
      if (error instanceof MPesaError) {
        throw error;
      }
      throw new MPesaError(
        `Failed to initiate STK Push: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Query transaction status
   */
  async queryTransactionStatus(checkoutRequestId: string): Promise<TransactionStatusResult> {
    if (!checkoutRequestId || checkoutRequestId.trim() === '') {
      throw new MPesaValidationError('Checkout request ID is required');
    }

    // Get access token
    const accessToken = await this.getAccessToken();

    // Generate password and timestamp
    const timestamp = this.generateTimestamp();
    const password = this.generatePassword(timestamp);

    // Prepare request
    const requestBody: STKQueryRequest = {
      BusinessShortCode: this.config.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    try {
      const response = await httpClient.request<STKQueryResponse>({
        method: 'POST',
        url: `${this.config.apiUrl}/mpesa/stkpushquery/v1/query`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: requestBody,
        timeout: this.config.timeout,
      });

      return {
        resultCode: response.data.ResultCode,
        resultDesc: response.data.ResultDesc,
      };
    } catch (error) {
      throw new MPesaError(
        `Failed to query transaction status: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Generate M-Pesa password
   * Password = Base64(Shortcode + Passkey + Timestamp)
   */
  private generatePassword(timestamp: string): string {
    const rawPassword = `${this.config.shortcode}${this.config.passkey}${timestamp}`;
    return Buffer.from(rawPassword).toString('base64');
  }

  /**
   * Generate timestamp in format YYYYMMDDHHmmss
   */
  private generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Check if cached token is still valid
   */
  private isTokenValid(cache: TokenCache): boolean {
    return cache.expiresAt > new Date();
  }
}

/**
 * Create M-Pesa engine instance
 */
export function createMPesaEngine(): MPesaEngine {
  return new MPesaEngineImpl();
}
