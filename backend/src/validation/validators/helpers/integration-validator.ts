/**
 * IntegrationValidator - Validates integration logging functionality
 * 
 * Validates:
 * - MPESA callback logging
 * - Paystack webhook logging
 * - SMS delivery logging
 * - Idempotency mechanisms
 * - Duplicate rejection
 */

import { Pool } from 'pg';
import { ValidationResult } from '../../types.js';

export class IntegrationValidator {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  /**
   * Validate idempotency mechanisms
   * Requirements: 11.1-11.8
   */
  async validateIdempotency(): Promise<ValidationResult> {
    try {
      const issues: any[] = [];

      // Check unique constraint on core.transactions.idempotency_key
      const transactionConstraintQuery = `
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'core'
          AND table_name = 'transactions'
          AND constraint_type = 'UNIQUE'
          AND constraint_name LIKE '%idempotency_key%'
      `;

      const transactionResult = await this.pool.query(transactionConstraintQuery);
      
      if (transactionResult.rows.length === 0) {
        issues.push({
          type: 'MISSING_CONSTRAINT',
          table: 'core.transactions',
          column: 'idempotency_key',
          message: 'Missing UNIQUE constraint on idempotency_key',
        });
      }

      // Check unique constraint on services.mpesa_logs.mpesa_receipt
      const mpesaConstraintQuery = `
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'services'
          AND table_name = 'mpesa_logs'
          AND constraint_type = 'UNIQUE'
          AND constraint_name LIKE '%mpesa_receipt%'
      `;

      const mpesaResult = await this.pool.query(mpesaConstraintQuery);
      
      if (mpesaResult.rows.length === 0) {
        issues.push({
          type: 'MISSING_CONSTRAINT',
          table: 'services.mpesa_logs',
          column: 'mpesa_receipt',
          message: 'Missing UNIQUE constraint on mpesa_receipt',
        });
      }

      // Check unique constraint on services.paystack_logs.paystack_reference
      const paystackConstraintQuery = `
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'services'
          AND table_name = 'paystack_logs'
          AND constraint_type = 'UNIQUE'
          AND constraint_name LIKE '%paystack_reference%'
      `;

      const paystackResult = await this.pool.query(paystackConstraintQuery);
      
      if (paystackResult.rows.length === 0) {
        issues.push({
          type: 'MISSING_CONSTRAINT',
          table: 'services.paystack_logs',
          column: 'paystack_reference',
          message: 'Missing UNIQUE constraint on paystack_reference',
        });
      }

      // Check for duplicate idempotency keys in database
      const duplicateKeysQuery = `
        SELECT idempotency_key, COUNT(*) as count
        FROM core.transactions
        GROUP BY idempotency_key
        HAVING COUNT(*) > 1
        LIMIT 10
      `;

      const duplicateResult = await this.pool.query(duplicateKeysQuery);
      
      if (duplicateResult.rows.length > 0) {
        issues.push({
          type: 'DUPLICATE_KEYS',
          message: 'Found duplicate idempotency keys in database',
          examples: duplicateResult.rows,
        });
      }

      // Check index on idempotency_key
      const indexQuery = `
        SELECT i.relname as index_name
        FROM pg_class t
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE n.nspname = 'core'
          AND t.relname = 'transactions'
          AND a.attname = 'idempotency_key'
      `;

      const indexResult = await this.pool.query(indexQuery);
      
      if (indexResult.rows.length === 0) {
        issues.push({
          type: 'MISSING_INDEX',
          table: 'core.transactions',
          column: 'idempotency_key',
          message: 'Missing index on idempotency_key',
        });
      }

      if (issues.length > 0) {
        return {
          passed: false,
          message: 'Idempotency validation failed',
          details: { issues },
        };
      }

      return {
        passed: true,
        message: 'Idempotency mechanisms validated successfully',
      };
    } catch (error) {
      return {
        passed: false,
        message: `Idempotency validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      };
    }
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
