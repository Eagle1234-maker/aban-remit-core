/**
 * MPESA Log Repository Types
 * 
 * Manages MPESA deposit logs for audit trail and idempotency checking.
 * Requirements: 32.2, 32.4
 */

/**
 * MPESA log entry stored in services.mpesa_logs table
 */
export interface MPESALog {
  id: string;
  mpesaReceipt: string;
  phone: string;
  amount: number;
  rawPayload: Record<string, any>;
  createdAt: Date;
}

/**
 * Input for creating a new MPESA log entry
 */
export interface CreateMPESALogInput {
  receipt: string;
  phone: string;
  amount: number;
  rawPayload: Record<string, any>;
}
