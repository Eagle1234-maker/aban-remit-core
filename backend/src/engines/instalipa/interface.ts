/**
 * Instalipa Airtime Engine Interface
 * 
 * Defines the contract for Instalipa Airtime API integration.
 * Validates Requirements: 6.1, 7.1, 7.2, 7.3, 7.4, 15.1, 15.2, 15.3, 15.4
 */

import { AirtimePurchaseResult, BalanceResult } from './types.js';

export interface InstalipaEngine {
  /**
   * Purchase airtime for a phone number
   * 
   * @param phone - Phone number in format 254XXXXXXXXX
   * @param amount - Airtime amount in KES
   * @param reference - Unique transaction reference
   * @returns Airtime purchase result with transaction reference and status
   */
  purchaseAirtime(phone: string, amount: number, reference: string): Promise<AirtimePurchaseResult>;
  
  /**
   * Query airtime balance
   * Cached for 5 minutes to reduce API calls
   * 
   * @returns Balance result with amount and currency
   */
  queryBalance(): Promise<BalanceResult>;
  
  /**
   * Get current OAuth access token
   * For internal use - handles token caching and refresh
   * 
   * @returns Access token string
   */
  getAccessToken(): Promise<string>;
}
