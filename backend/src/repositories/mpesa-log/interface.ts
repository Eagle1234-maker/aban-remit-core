import { MPESALog, CreateMPESALogInput } from './types.js';

/**
 * MPESALogRepository Interface
 * 
 * Manages MPESA deposit logs for audit trail and idempotency checking.
 * 
 * Requirements:
 * - 32.2: Store MPESA receipt, phone, amount, raw payload, and timestamp
 * - 32.4: Check for duplicate MPESA receipt numbers to ensure idempotency
 */
export interface MPESALogRepository {
  /**
   * Create a new MPESA log entry
   * 
   * @param input - MPESA log data (receipt, phone, amount, rawPayload)
   * @returns Created MPESA log with generated ID and timestamp
   * 
   * Requirement 32.2: Store MPESA deposit data in mpesa_logs table
   */
  createLog(input: CreateMPESALogInput): Promise<MPESALog>;

  /**
   * Find an MPESA log by receipt number
   * 
   * @param receipt - MPESA receipt number to search for
   * @returns MPESA log if found, null otherwise
   * 
   * Requirement 32.4: Check for duplicate MPESA receipt numbers
   */
  findByReceipt(receipt: string): Promise<MPESALog | null>;
}
