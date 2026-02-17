import { MPESALogRepository } from './interface.js';
import { MPESALog, CreateMPESALogInput } from './types.js';
import { query } from '../../utils/db.js';

/**
 * Database row structure for MPESA log queries
 */
interface MPESALogRow {
  id: string;
  mpesa_receipt: string;
  phone: string;
  amount: string; // DECIMAL returned as string from PostgreSQL
  raw_payload: Record<string, any>;
  created_at: Date;
}

/**
 * Implementation of MPESALogRepository
 * 
 * Manages MPESA deposit logs in services.mpesa_logs table.
 * Provides audit trail and idempotency checking for MPESA deposits.
 * 
 * Requirements: 32.2, 32.4
 */
export class MPESALogRepositoryImpl implements MPESALogRepository {
  /**
   * Create a new MPESA log entry
   * 
   * Stores MPESA receipt, phone, amount, raw payload, and timestamp.
   * Uses unique constraint on mpesa_receipt to prevent duplicates.
   * 
   * @param input - MPESA log data
   * @returns Created MPESA log with generated ID and timestamp
   * @throws Error if receipt already exists (unique constraint violation)
   * 
   * Requirement 32.2: Store MPESA deposit data in mpesa_logs table
   */
  async createLog(input: CreateMPESALogInput): Promise<MPESALog> {
    const result = await query<MPESALogRow>(
      `
      INSERT INTO services.mpesa_logs (mpesa_receipt, phone, amount, raw_payload)
      VALUES ($1, $2, $3, $4)
      RETURNING id, mpesa_receipt, phone, amount, raw_payload, created_at
      `,
      [input.receipt, input.phone, input.amount, input.rawPayload]
    );

    const row = result.rows[0];

    return {
      id: row.id,
      mpesaReceipt: row.mpesa_receipt,
      phone: row.phone,
      amount: parseFloat(row.amount),
      rawPayload: row.raw_payload,
      createdAt: row.created_at,
    };
  }

  /**
   * Find an MPESA log by receipt number
   * 
   * Uses idx_mpesa_logs_receipt index for fast lookup.
   * Returns null if no log found with the given receipt.
   * 
   * @param receipt - MPESA receipt number to search for
   * @returns MPESA log if found, null otherwise
   * 
   * Requirement 32.4: Check for duplicate MPESA receipt numbers
   */
  async findByReceipt(receipt: string): Promise<MPESALog | null> {
    const result = await query<MPESALogRow>(
      `
      SELECT id, mpesa_receipt, phone, amount, raw_payload, created_at
      FROM services.mpesa_logs
      WHERE mpesa_receipt = $1
      `,
      [receipt]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      mpesaReceipt: row.mpesa_receipt,
      phone: row.phone,
      amount: parseFloat(row.amount),
      rawPayload: row.raw_payload,
      createdAt: row.created_at,
    };
  }
}
