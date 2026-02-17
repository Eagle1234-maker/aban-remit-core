/**
 * LogTableValidator - Validates log table structures
 * 
 * Validates:
 * - MPESA log table structure
 * - Paystack log table structure
 * - SMS log table structure
 * - Column definitions
 * - Unique constraints
 * - JSONB columns
 */

import { Pool } from 'pg';
import { ValidationResult } from '../../types.js';

interface ColumnInfo {
  columnName: string;
  dataType: string;
  udtName: string;
}

export class LogTableValidator {
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
   * Validate all log tables
   * Requirements: 3.1-3.8
   */
  async validateAllLogTables(): Promise<ValidationResult> {
    try {
      const issues: any[] = [];

      // Validate MPESA logs
      const mpesaResult = await this.validateMpesaLogTable();
      if (!mpesaResult.passed) {
        issues.push({ table: 'mpesa_logs', ...mpesaResult });
      }

      // Validate Paystack logs
      const paystackResult = await this.validatePaystackLogTable();
      if (!paystackResult.passed) {
        issues.push({ table: 'paystack_logs', ...paystackResult });
      }

      // Validate SMS logs
      const smsResult = await this.validateSmsLogTable();
      if (!smsResult.passed) {
        issues.push({ table: 'sms_logs', ...smsResult });
      }

      if (issues.length > 0) {
        return {
          passed: false,
          message: 'Log table validation failed',
          details: { issues },
        };
      }

      return {
        passed: true,
        message: 'All log tables validated successfully',
      };
    } catch (error) {
      return {
        passed: false,
        message: `Log table validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      };
    }
  }

  /**
   * Validate MPESA log table
   */
  async validateMpesaLogTable(): Promise<ValidationResult> {
    const requiredColumns = [
      { name: 'id', type: 'uuid' },
      { name: 'mpesa_receipt', type: 'varchar' },
      { name: 'phone', type: 'varchar' },
      { name: 'amount', type: 'numeric' },
      { name: 'raw_payload', type: 'jsonb' },
      { name: 'created_at', type: 'timestamp' },
    ];

    return await this.validateLogTableColumns('services', 'mpesa_logs', requiredColumns);
  }

  /**
   * Validate Paystack log table
   */
  async validatePaystackLogTable(): Promise<ValidationResult> {
    const requiredColumns = [
      { name: 'id', type: 'uuid' },
      { name: 'paystack_reference', type: 'varchar' },
      { name: 'email', type: 'varchar' },
      { name: 'amount', type: 'numeric' },
      { name: 'currency', type: 'varchar' },
      { name: 'status', type: 'varchar' },
      { name: 'gateway_response', type: 'varchar' },
      { name: 'raw_payload', type: 'jsonb' },
      { name: 'created_at', type: 'timestamp' },
    ];

    return await this.validateLogTableColumns('services', 'paystack_logs', requiredColumns);
  }

  /**
   * Validate SMS log table
   */
  async validateSmsLogTable(): Promise<ValidationResult> {
    const requiredColumns = [
      { name: 'id', type: 'uuid' },
      { name: 'recipient', type: 'varchar' },
      { name: 'message', type: 'text' },
      { name: 'cost', type: 'numeric' },
      { name: 'status', type: 'varchar' },
      { name: 'provider_message_id', type: 'varchar' },
      { name: 'error_message', type: 'varchar' },
      { name: 'created_at', type: 'timestamp' },
    ];

    return await this.validateLogTableColumns('services', 'sms_logs', requiredColumns);
  }

  /**
   * Validate log table columns
   */
  async validateLogTableColumns(
    schemaName: string,
    tableName: string,
    requiredColumns: Array<{ name: string; type: string }>
  ): Promise<ValidationResult> {
    try {
      // Get actual columns
      const query = `
        SELECT 
          column_name as "columnName",
          data_type as "dataType",
          udt_name as "udtName"
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
      `;

      const result = await this.pool.query(query, [schemaName, tableName]);
      const actualColumns: ColumnInfo[] = result.rows;

      const missingColumns: string[] = [];
      const wrongTypeColumns: Array<{ column: string; expected: string; actual: string }> = [];

      // Check each required column
      for (const required of requiredColumns) {
        const actual = actualColumns.find(col => col.columnName === required.name);

        if (!actual) {
          missingColumns.push(required.name);
          continue;
        }

        // Normalize type names for comparison
        const actualType = this.normalizeType(actual.dataType, actual.udtName);
        const expectedType = this.normalizeType(required.type, required.type);

        if (!this.typesMatch(actualType, expectedType)) {
          wrongTypeColumns.push({
            column: required.name,
            expected: required.type,
            actual: actualType,
          });
        }
      }

      // Validate unique constraints
      const uniqueResult = await this.validateUniqueConstraints(schemaName, tableName);
      
      // Validate JSONB columns
      const jsonbResult = await this.validateJsonbColumns(schemaName, tableName, ['raw_payload']);

      if (missingColumns.length > 0 || wrongTypeColumns.length > 0 || !uniqueResult.passed || !jsonbResult.passed) {
        return {
          passed: false,
          message: `Table ${schemaName}.${tableName} validation failed`,
          details: {
            missingColumns: missingColumns.length > 0 ? missingColumns : undefined,
            wrongTypeColumns: wrongTypeColumns.length > 0 ? wrongTypeColumns : undefined,
            uniqueConstraints: !uniqueResult.passed ? uniqueResult.details : undefined,
            jsonbColumns: !jsonbResult.passed ? jsonbResult.details : undefined,
          },
        };
      }

      return {
        passed: true,
        message: `Table ${schemaName}.${tableName} validated successfully`,
      };
    } catch (error) {
      return {
        passed: false,
        message: `Column validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      };
    }
  }

  /**
   * Validate unique constraints
   */
  async validateUniqueConstraints(
    schemaName: string,
    tableName: string
  ): Promise<ValidationResult> {
    try {
      const query = `
        SELECT 
          tc.constraint_name,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'UNIQUE'
          AND tc.table_schema = $1
          AND tc.table_name = $2
      `;

      const result = await this.pool.query(query, [schemaName, tableName]);
      
      // Check for expected unique constraints based on table
      const expectedUnique: Record<string, string[]> = {
        mpesa_logs: ['mpesa_receipt'],
        paystack_logs: ['paystack_reference'],
      };

      const expected = expectedUnique[tableName] || [];
      const actual = result.rows.map(row => row.column_name);

      const missing = expected.filter(col => !actual.includes(col));

      if (missing.length > 0) {
        return {
          passed: false,
          message: 'Missing unique constraints',
          details: { missing, expected, actual },
        };
      }

      return {
        passed: true,
        message: 'Unique constraints validated',
      };
    } catch (error) {
      return {
        passed: false,
        message: `Unique constraint validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      };
    }
  }

  /**
   * Validate JSONB columns
   */
  async validateJsonbColumns(
    schemaName: string,
    tableName: string,
    columns: string[]
  ): Promise<ValidationResult> {
    try {
      const query = `
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_schema = $1 
          AND table_name = $2
          AND column_name = ANY($3::text[])
      `;

      const result = await this.pool.query(query, [schemaName, tableName, columns]);
      
      const wrongType = result.rows.filter(row => 
        row.data_type !== 'jsonb' && row.udt_name !== 'jsonb'
      );

      if (wrongType.length > 0) {
        return {
          passed: false,
          message: 'JSONB column validation failed',
          details: { wrongType },
        };
      }

      return {
        passed: true,
        message: 'JSONB columns validated',
      };
    } catch (error) {
      return {
        passed: false,
        message: `JSONB validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      };
    }
  }

  /**
   * Normalize type names for comparison
   */
  private normalizeType(dataType: string, udtName: string): string {
    const type = (dataType || udtName).toLowerCase();
    
    // Map common type variations
    const typeMap: Record<string, string> = {
      'character varying': 'varchar',
      'timestamp without time zone': 'timestamp',
      'timestamp with time zone': 'timestamptz',
    };

    return typeMap[type] || type;
  }

  /**
   * Check if types match
   */
  private typesMatch(actual: string, expected: string): boolean {
    // Direct match
    if (actual === expected) return true;

    // Handle numeric types
    if (expected === 'numeric' && actual === 'numeric') return true;
    if (expected === 'decimal' && actual === 'numeric') return true;

    // Handle text types
    if (expected === 'varchar' && actual === 'varchar') return true;
    if (expected === 'text' && actual === 'text') return true;

    // Handle timestamp types
    if (expected === 'timestamp' && (actual === 'timestamp' || actual === 'timestamptz')) return true;

    // Handle UUID
    if (expected === 'uuid' && actual === 'uuid') return true;

    // Handle JSONB
    if (expected === 'jsonb' && actual === 'jsonb') return true;

    return false;
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
