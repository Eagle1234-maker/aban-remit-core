/**
 * M-Pesa Engine Interface
 */

import { STKPushResult, TransactionStatusResult } from './types.js';

export interface MPesaEngine {
  /**
   * Initiate STK Push payment request
   * 
   * @param phone - Phone number in format 254XXXXXXXXX
   * @param amount - Amount to charge
   * @param accountReference - Account reference for the transaction
   * @returns STK Push result with checkout request ID
   */
  initiateSTKPush(
    phone: string,
    amount: number,
    accountReference: string
  ): Promise<STKPushResult>;

  /**
   * Query transaction status
   * 
   * @param checkoutRequestId - Checkout request ID from STK Push
   * @returns Transaction status result
   */
  queryTransactionStatus(checkoutRequestId: string): Promise<TransactionStatusResult>;

  /**
   * Get current access token (for internal use)
   * 
   * @returns Access token
   */
  getAccessToken(): Promise<string>;
}
