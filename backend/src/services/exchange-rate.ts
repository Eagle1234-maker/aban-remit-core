/**
 * Exchange Rate Service
 * 
 * Provides currency conversion functionality using ExchangeRate-API.
 * Supports caching to minimize API calls and improve performance.
 */

import { httpClient } from '../utils/http-client.js';

/**
 * Exchange Rate Service
 */
export class ExchangeRateService {
  private apiKey: string;
  private apiUrl: string;
  private rateCache: Map<string, { rate: number; timestamp: Date }>;
  private readonly cacheDurationMs: number;

  constructor() {
    this.apiKey = process.env.EXCHANGE_RATE_API_KEY || '';
    this.apiUrl = process.env.EXCHANGE_RATE_API_URL || 'https://v6.exchangerate-api.com/v6';
    this.rateCache = new Map();
    this.cacheDurationMs = 60 * 60 * 1000; // 1 hour

    if (!this.apiKey) {
      throw new Error('EXCHANGE_RATE_API_KEY environment variable is required');
    }
  }

  /**
   * Get exchange rate between two currencies
   * 
   * @param baseCurrency - Base currency code (e.g., 'KES')
   * @param targetCurrency - Target currency code (e.g., 'USD')
   * @returns Exchange rate result
   */
  async getExchangeRate(
    baseCurrency: string,
    targetCurrency: string
  ): Promise<ExchangeRateResult> {
    // Check cache first
    const cacheKey = `${baseCurrency}_${targetCurrency}`;
    const cached = this.rateCache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return {
        baseCurrency,
        targetCurrency,
        rate: cached.rate,
        timestamp: cached.timestamp,
      };
    }

    // Fetch from API
    try {
      const url = `${this.apiUrl}/${this.apiKey}/pair/${baseCurrency}/${targetCurrency}`;
      
      const response = await httpClient.request<PairConversionResponse>({
        method: 'GET',
        url,
        timeout: 10000,
      });

      if (response.data.result !== 'success') {
        throw new Error(`Exchange rate API error: ${response.data.result}`);
      }

      const rate = response.data.conversion_rate;
      const timestamp = new Date(response.data.time_last_update_utc);

      // Cache the result
      this.rateCache.set(cacheKey, { rate, timestamp });

      return {
        baseCurrency,
        targetCurrency,
        rate,
        timestamp,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch exchange rate for ${baseCurrency}/${targetCurrency}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Convert amount from one currency to another
   * 
   * @param amount - Amount to convert
   * @param fromCurrency - Source currency code
   * @param toCurrency - Target currency code
   * @returns Conversion result
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<ConversionResult> {
    if (amount < 0) {
      throw new Error('Amount must be positive');
    }

    if (fromCurrency === toCurrency) {
      return {
        fromCurrency,
        toCurrency,
        fromAmount: amount,
        toAmount: amount,
        rate: 1,
        timestamp: new Date(),
      };
    }

    const rateResult = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * rateResult.rate;

    return {
      fromCurrency,
      toCurrency,
      fromAmount: amount,
      toAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
      rate: rateResult.rate,
      timestamp: rateResult.timestamp,
    };
  }

  /**
   * Get all exchange rates for a base currency
   * 
   * @param baseCurrency - Base currency code
   * @returns Map of currency codes to exchange rates
   */
  async getAllRates(baseCurrency: string): Promise<Record<string, number>> {
    try {
      const url = `${this.apiUrl}/${this.apiKey}/latest/${baseCurrency}`;
      
      const response = await httpClient.request<ExchangeRateAPIResponse>({
        method: 'GET',
        url,
        timeout: 10000,
      });

      if (response.data.result !== 'success') {
        throw new Error(`Exchange rate API error: ${response.data.result}`);
      }

      return response.data.conversion_rates;
    } catch (error) {
      throw new Error(
        `Failed to fetch all rates for ${baseCurrency}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Convert KES to USD (common use case)
   */
  async convertKEStoUSD(amountKES: number): Promise<ConversionResult> {
    return this.convertCurrency(amountKES, 'KES', 'USD');
  }

  /**
   * Convert USD to KES (common use case)
   */
  async convertUSDtoKES(amountUSD: number): Promise<ConversionResult> {
    return this.convertCurrency(amountUSD, 'USD', 'KES');
  }

  /**
   * Clear exchange rate cache
   */
  clearCache(): void {
    this.rateCache.clear();
  }

  /**
   * Check if cached rate is still valid
   */
  private isCacheValid(timestamp: Date): boolean {
    const now = new Date();
    const age = now.getTime() - timestamp.getTime();
    return age < this.cacheDurationMs;
  }
}

/**
 * Create singleton instance (optional - can be created manually in tests)
 */
export function createExchangeRateService(): ExchangeRateService {
  return new ExchangeRateService();
}


export interface ExchangeRateResult {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  timestamp: Date;
}

export interface ConversionResult {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  timestamp: Date;
}

interface ExchangeRateAPIResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

interface PairConversionResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  target_code: string;
  conversion_rate: number;
}
