/**
 * Instalipa Airtime Engine Implementation
 * 
 * Implements Instalipa Airtime API integration with OAuth 2.0 authentication.
 * Validates Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 15.1, 15.2, 15.3, 15.4
 */

import { InstalipaEngine } from './interface.js';
import {
  AirtimePurchaseResult,
  BalanceResult,
  InstalipaOAuthTokenResponse,
  InstalipaAirtimePurchaseResponse,
  InstalipaBalanceResponse,
  InstalipaError,
  InstalipaAuthError,
  InstalipaValidationError,
  AirtimeStatus
} from './types.js';
import { normalizeForInstalipa, isValidKenyanPhone } from '../../utils/phone-normalization.js';
import { httpClient } from '../../utils/http-client.js';
import { AirtimeLogRepository } from '../../repositories/airtime-log/interface.js';

interface TokenCache {
  accessToken: string;
  expiresAt: Date;
}

interface BalanceCache {
  balance: number;
  currency: string;
  cachedAt: Date;
}

export class InstalipaEngineImpl implements InstalipaEngine {
  private consumerKey: string;
  private consumerSecret: string;
  private callbackUrl: string;
  private apiUrl: string;
  private timeout: number;
  private tokenCache: TokenCache | null = null;
  private balanceCache: BalanceCache | null = null;
  private airtimeLogRepository: AirtimeLogRepository;
  private readonly BALANCE_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  private readonly BALANCE_WARNING_THRESHOLD = 1000; // KES
  
  constructor(airtimeLogRepository: AirtimeLogRepository) {
    // Load configuration from environment variables
    this.consumerKey = process.env.INSTALIPA_CONSUMER_KEY || '';
    this.consumerSecret = process.env.INSTALIPA_CONSUMER_SECRET || '';
    this.callbackUrl = process.env.INSTALIPA_CALLBACK_URL || '';
    this.apiUrl = process.env.INSTALIPA_API_URL || 'https://api.instalipa.com';
    this.timeout = parseInt(process.env.INSTALIPA_TIMEOUT || '30000', 10);
    this.airtimeLogRepository = airtimeLogRepository;
    
    // Validate configuration
    if (!this.consumerKey) {
      throw new Error('INSTALIPA_CONSUMER_KEY is required');
    }
    if (!this.consumerSecret) {
      throw new Error('INSTALIPA_CONSUMER_SECRET is required');
    }
    if (!this.callbackUrl) {
      throw new Error('INSTALIPA_CALLBACK_URL is required');
    }
  }
  
  /**
   * Get OAuth access token with caching
   * Implements OAuth 2.0 client credentials flow
   */
  async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.tokenCache && this.tokenCache.expiresAt > new Date()) {
      return this.tokenCache.accessToken;
    }
    
    try {
      // Request new token using OAuth 2.0 client credentials flow
      const credentials = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await httpClient.request<InstalipaOAuthTokenResponse>({
        method: 'POST',
        url: `${this.apiUrl}/oauth/token`,
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials',
        timeout: this.timeout,
        retryConfig: {
          maxRetries: 3,
          retryableStatusCodes: [429, 500, 502, 503, 504],
          backoffMultiplier: 2,
          initialDelayMs: 1000
        }
      });
      
      // Cache the token
      const expiresIn = response.data.expires_in || 3600; // Default 1 hour
      const expiresAt = new Date(Date.now() + (expiresIn * 1000) - 60000); // Subtract 1 minute for safety
      
      this.tokenCache = {
        accessToken: response.data.access_token,
        expiresAt
      };
      
      return this.tokenCache.accessToken;
    } catch (error) {
      throw new InstalipaAuthError(
        `Failed to obtain Instalipa access token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : undefined
      );
    }
  }

  /**
   * Purchase airtime for a phone number
   * Logs every attempt with phone, amount, status, and transaction reference
   */
  async purchaseAirtime(phone: string, amount: number, reference: string): Promise<AirtimePurchaseResult> {
    // Validate phone number
    if (!isValidKenyanPhone(phone)) {
      throw new InstalipaValidationError(`Invalid Kenyan phone number: ${phone}`);
    }
    
    // Normalize phone number for Instalipa
    const normalizedPhone = normalizeForInstalipa(phone);
    
    // Validate amount
    if (amount <= 0) {
      throw new InstalipaValidationError('Airtime amount must be greater than 0');
    }
    
    if (amount > 10000) {
      throw new InstalipaValidationError('Airtime amount cannot exceed 10,000 KES');
    }
    
    // Validate reference
    if (!reference || reference.trim().length === 0) {
      throw new InstalipaValidationError('Transaction reference is required');
    }
    
    let status: AirtimeStatus = 'PENDING';
    let providerResponse: any = null;
    let errorMessage: string | undefined;
    
    try {
      // Get access token
      const accessToken = await this.getAccessToken();
      
      // Purchase airtime
      const response = await httpClient.request<InstalipaAirtimePurchaseResponse>({
        method: 'POST',
        url: `${this.apiUrl}/airtime/purchase`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: {
          phone: normalizedPhone,
          amount,
          reference,
          callback_url: this.callbackUrl
        },
        timeout: this.timeout,
        retryConfig: {
          maxRetries: 3,
          retryableStatusCodes: [401, 429, 500, 502, 503, 504],
          backoffMultiplier: 2,
          initialDelayMs: 1000
        }
      });
      
      // Parse response
      status = response.data.success ? 'PENDING' : 'FAILED';
      providerResponse = response.data;
      
      if (!response.data.success) {
        errorMessage = response.data.message || 'Airtime purchase failed';
      }
    } catch (error) {
      // Handle 401 errors by refreshing token and retrying
      if (error instanceof Error && 'statusCode' in error && (error as any).statusCode === 401) {
        // Clear token cache and retry once
        this.tokenCache = null;
        return this.purchaseAirtime(phone, amount, reference);
      }
      
      status = 'FAILED';
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Log the airtime purchase attempt to repository
    const logEntry = await this.airtimeLogRepository.createLog({
      transactionReference: reference,
      phone: normalizedPhone,
      amount,
      status,
      providerResponse,
      errorMessage
    });
    
    return {
      transactionReference: logEntry.transactionReference,
      status: logEntry.status as AirtimeStatus,
      phone: logEntry.phone,
      amount: logEntry.amount,
      message: errorMessage || (status === 'PENDING' ? 'Airtime purchase initiated' : 'Airtime purchase failed')
    };
  }
  
  /**
   * Query airtime balance with 5-minute caching
   */
  async queryBalance(): Promise<BalanceResult> {
    // Check if we have a valid cached balance
    if (this.balanceCache) {
      const cacheAge = Date.now() - this.balanceCache.cachedAt.getTime();
      if (cacheAge < this.BALANCE_CACHE_DURATION_MS) {
        return {
          balance: this.balanceCache.balance,
          currency: this.balanceCache.currency
        };
      }
    }
    
    try {
      // Get access token
      const accessToken = await this.getAccessToken();
      
      // Query balance
      const response = await httpClient.request<InstalipaBalanceResponse>({
        method: 'GET',
        url: `${this.apiUrl}/airtime/balance`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        timeout: this.timeout,
        retryConfig: {
          maxRetries: 3,
          retryableStatusCodes: [401, 429, 500, 502, 503, 504],
          backoffMultiplier: 2,
          initialDelayMs: 1000
        }
      });
      
      // Cache the balance
      this.balanceCache = {
        balance: response.data.balance,
        currency: response.data.currency || 'KES',
        cachedAt: new Date()
      };
      
      // Log warning if balance is below threshold
      if (response.data.balance < this.BALANCE_WARNING_THRESHOLD) {
        console.warn(`[Instalipa] Low airtime balance: ${response.data.balance} ${response.data.currency || 'KES'}`);
      }
      
      return {
        balance: response.data.balance,
        currency: response.data.currency || 'KES'
      };
    } catch (error) {
      // Handle 401 errors by refreshing token and retrying
      if (error instanceof Error && 'statusCode' in error && (error as any).statusCode === 401) {
        // Clear token cache and retry once
        this.tokenCache = null;
        return this.queryBalance();
      }
      
      throw new InstalipaError(
        `Balance query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INSTALIPA_BALANCE_QUERY_FAILED',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : undefined
      );
    }
  }
}
