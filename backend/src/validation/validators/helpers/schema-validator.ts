/**
 * SchemaValidator - Validates PostgreSQL schema structure
 * 
 * Validates:
 * - Schema existence
 * - Table structure
 * - Column definitions
 * - Constraints
 * - Indexes
 * - System accounts
 * - Ledger integrity
 * - Security permissions
 */

import { Pool, QueryResult } from 'pg';
import { ValidationResult } from '../../types.js';

interface SchemaInfo {
  schemaName: string;
  tables: string[];
}

interface TableColumn {
  columnName: string;
  dataType: string;
  isNullable: boolean;
}

interface IndexInfo {
  indexName: string;
  tableName: string;
  columnName: string;
  isUnique: boolean;
}

export class SchemaValidator {
  private pool: Pool;

  // Expected schema structure based on Prisma schema
  private readonly EXPECTED_SCHEMAS = {
    auth: ['users', 'otps', 'devices', 'token_blacklist'],
    core: ['wallets', 'wallet_state_history', 'transactions', 'fee_configs', 'commission_configs', 'exchange_rates', 'exchange_rate_history'],
    ledger: ['entries'],
    audit: ['entries', 'reconciliation_jobs', 'reconciliation_discrepancies'],
    services: ['mpesa_logs', 'sms_logs', 'paystack_logs']
  };

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  /**
   * Validate all required schemas exist
   * Requirements: 1.1, 1.2
   */
  async validateAllSchemas(): Promise<ValidationResult> {
    try {
      const missingSchemas: string[] = [];
      const missingTables: { schema: string; table: string }[] = [];

      // Check each required schema
      for (const [schemaName, expectedTables] of Object.entries(this.EXPECTED_SCHEMAS)) {
        const schemaExists = await this.validateSchemaExists(schemaName);
        
        if (!schemaExists) {
          missingSchemas.push(schemaName);
          continue;
        }

        // Check tables in this schema
        for (const tableName of expectedTables) {
          const tableExists = await this.validateTableExists(schemaName, tableName);
          if (!tableExists) {
            missingTables.push({ schema: schemaName, table: tableName });
          }
        }
      }

      if (missingSchemas.length > 0 || missingTables.length > 0) {
        return {
          passed: false,
          message: 'Schema validation failed',
          details: {
            missingSchemas,
            missingTables,
            expectedSchemas: Object.keys(this.EXPECTED_SCHEMAS),
          },
        };
      }

      return {
        passed: true,
        message: 'All required schemas and tables exist',
        details: {
          validatedSchemas: Object.keys(this.EXPECTED_SCHEMAS),
          totalTables: Object.values(this.EXPECTED_SCHEMAS).flat().length,
        },
      };
    } catch (error) {
      return {
        passed: false,
        message: `Schema validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      };
    }
  }

  /**
   * Check if a schema exists
   */
  async validateSchemaExists(schemaName: string): Promise<boolean> {
    const query = `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = $1
    `;
    
    const result = await this.pool.query(query, [schemaName]);
    return result.rows.length > 0;
  }

  /**
   * Check if a table exists in a schema
   */
  async validateTableExists(schemaName: string, tableName: string): Promise<boolean> {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 AND table_name = $2
    `;
    
    const result = await this.pool.query(query, [schemaName, tableName]);
    return result.rows.length > 0;
  }

  /**
   * Check if a column exists in a table
   */
  async validateColumnExists(schemaName: string, tableName: string, columnName: string): Promise<boolean> {
    const query = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = $2 AND column_name = $3
    `;
    
    const result = await this.pool.query(query, [schemaName, tableName, columnName]);
    return result.rows.length > 0;
  }

  /**
   * Validate column data type
   */
  async validateColumnType(schemaName: string, tableName: string, columnName: string, expectedType: string): Promise<boolean> {
    const query = `
      SELECT data_type, udt_name
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = $2 AND column_name = $3
    `;
    
    const result = await this.pool.query(query, [schemaName, tableName, columnName]);
    
    if (result.rows.length === 0) {
      return false;
    }

    const actualType = result.rows[0].data_type.toLowerCase();
    const udtName = result.rows[0].udt_name.toLowerCase();
    
    // Handle different type representations
    const normalizedExpected = expectedType.toLowerCase();
    
    return actualType === normalizedExpected || udtName === normalizedExpected;
  }

  /**
   * Get complete schema structure
   */
  async getSchemaStructure(schemaName: string): Promise<SchemaInfo> {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1
      ORDER BY table_name
    `;
    
    const result = await this.pool.query(query, [schemaName]);
    
    return {
      schemaName,
      tables: result.rows.map(row => row.table_name),
    };
  }

  /**
   * Validate critical indexes
   * Requirements: 4.1-4.8
   */
  async validateCriticalIndexes(): Promise<ValidationResult> {
    try {
      const requiredIndexes = [
        { schema: 'services', table: 'mpesa_logs', column: 'mpesa_receipt' },
        { schema: 'services', table: 'mpesa_logs', column: 'phone' },
        { schema: 'services', table: 'paystack_logs', column: 'paystack_reference' },
        { schema: 'services', table: 'sms_logs', column: 'recipient' },
        { schema: 'services', table: 'sms_logs', column: 'created_at' },
        { schema: 'core', table: 'transactions', column: 'idempotency_key' },
        { schema: 'core', table: 'wallets', column: 'owner_id' },
      ];

      const missingIndexes: typeof requiredIndexes = [];

      for (const { schema, table, column } of requiredIndexes) {
        const hasIndex = await this.validateIndexExists(schema, table, column);
        if (!hasIndex) {
          missingIndexes.push({ schema, table, column });
        }
      }

      if (missingIndexes.length > 0) {
        return {
          passed: false,
          message: 'Missing critical indexes',
          details: {
            missingIndexes,
            totalRequired: requiredIndexes.length,
          },
        };
      }

      return {
        passed: true,
        message: 'All critical indexes exist',
        details: {
          validatedIndexes: requiredIndexes.length,
        },
      };
    } catch (error) {
      return {
        passed: false,
        message: `Index validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      };
    }
  }

  /**
   * Check if an index exists on a column
   */
  async validateIndexExists(schemaName: string, tableName: string, columnName: string): Promise<boolean> {
    const query = `
      SELECT i.relname as index_name
      FROM pg_class t
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE n.nspname = $1
        AND t.relname = $2
        AND a.attname = $3
    `;
    
    const result = await this.pool.query(query, [schemaName, tableName, columnName]);
    return result.rows.length > 0;
  }

  /**
   * Get all indexes for a table
   */
  async getTableIndexes(schemaName: string, tableName: string): Promise<IndexInfo[]> {
    const query = `
      SELECT 
        i.relname as index_name,
        t.relname as table_name,
        a.attname as column_name,
        ix.indisunique as is_unique
      FROM pg_class t
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE n.nspname = $1 AND t.relname = $2
      ORDER BY i.relname, a.attname
    `;
    
    const result = await this.pool.query(query, [schemaName, tableName]);
    
    return result.rows.map(row => ({
      indexName: row.index_name,
      tableName: row.table_name,
      columnName: row.column_name,
      isUnique: row.is_unique,
    }));
  }

  /**
   * Validate system accounts
   * Requirements: 5.1-5.8
   */
  async validateSystemAccounts(): Promise<ValidationResult> {
    try {
      const requiredSystemAccounts = [
        'MPESA_SUSPENSE',
        'PAYSTACK_SUSPENSE',
        'AIRTIME_SUSPENSE',
        'FEE_REVENUE',
        'COMMISSION_EXPENSE',
      ];

      const query = `
        SELECT id, type, state
        FROM core.wallets
        WHERE id = ANY($1::text[])
      `;

      const result = await this.pool.query(query, [requiredSystemAccounts]);
      
      const foundAccounts = result.rows.map(row => row.id);
      const missingAccounts = requiredSystemAccounts.filter(acc => !foundAccounts.includes(acc));
      
      const invalidAccounts = result.rows.filter(row => 
        row.type !== 'SYSTEM' || row.state !== 'ACTIVE'
      );

      if (missingAccounts.length > 0 || invalidAccounts.length > 0) {
        return {
          passed: false,
          message: 'System account validation failed',
          details: {
            missingAccounts,
            invalidAccounts: invalidAccounts.map(row => ({
              id: row.id,
              type: row.type,
              state: row.state,
            })),
            requiredAccounts: requiredSystemAccounts,
          },
        };
      }

      return {
        passed: true,
        message: 'All system accounts exist and are properly configured',
        details: {
          validatedAccounts: requiredSystemAccounts,
        },
      };
    } catch (error) {
      return {
        passed: false,
        message: `System account validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      };
    }
  }

  /**
   * Validate ledger integrity
   * Requirements: 10.1-10.8
   */
  async validateLedgerIntegrity(): Promise<ValidationResult> {
    try {
      const issues: any[] = [];

      // Check for unbalanced transactions
      const unbalancedQuery = `
        SELECT 
          transaction_id,
          SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END) as total_debit,
          SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END) as total_credit
        FROM ledger.entries
        GROUP BY transaction_id
        HAVING SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END) != 
               SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END)
        LIMIT 10
      `;

      const unbalancedResult = await this.pool.query(unbalancedQuery);
      
      if (unbalancedResult.rows.length > 0) {
        issues.push({
          type: 'UNBALANCED_TRANSACTIONS',
          count: unbalancedResult.rows.length,
          examples: unbalancedResult.rows,
        });
      }

      // Check for orphaned ledger entries (invalid transaction references)
      const orphanedQuery = `
        SELECT le.id, le.transaction_id
        FROM ledger.entries le
        LEFT JOIN core.transactions t ON le.transaction_id = t.id
        WHERE t.id IS NULL
        LIMIT 10
      `;

      const orphanedResult = await this.pool.query(orphanedQuery);
      
      if (orphanedResult.rows.length > 0) {
        issues.push({
          type: 'ORPHANED_ENTRIES',
          count: orphanedResult.rows.length,
          examples: orphanedResult.rows,
        });
      }

      // Check for negative amounts
      const negativeQuery = `
        SELECT id, transaction_id, amount
        FROM ledger.entries
        WHERE amount < 0
        LIMIT 10
      `;

      const negativeResult = await this.pool.query(negativeQuery);
      
      if (negativeResult.rows.length > 0) {
        issues.push({
          type: 'NEGATIVE_AMOUNTS',
          count: negativeResult.rows.length,
          examples: negativeResult.rows,
        });
      }

      if (issues.length > 0) {
        return {
          passed: false,
          message: 'Ledger integrity violations found',
          details: { issues },
        };
      }

      return {
        passed: true,
        message: 'Ledger integrity validated successfully',
      };
    } catch (error) {
      return {
        passed: false,
        message: `Ledger integrity validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      };
    }
  }

  /**
   * Validate security and permissions
   * Requirements: 12.1-12.8
   */
  async validateSecurity(expectedUser: string): Promise<ValidationResult> {
    try {
      const issues: any[] = [];

      // Check user permissions on application schemas
      const schemas = ['auth', 'core', 'ledger', 'audit', 'services'];
      const requiredPrivileges = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];

      for (const schema of schemas) {
        const query = `
          SELECT 
            privilege_type
          FROM information_schema.role_table_grants
          WHERE grantee = $1 AND table_schema = $2
        `;

        const result = await this.pool.query(query, [expectedUser, schema]);
        const grantedPrivileges = result.rows.map(row => row.privilege_type);

        const missingPrivileges = requiredPrivileges.filter(
          priv => !grantedPrivileges.includes(priv)
        );

        if (missingPrivileges.length > 0) {
          issues.push({
            type: 'MISSING_PRIVILEGES',
            schema,
            missingPrivileges,
          });
        }
      }

      // Check for dangerous permissions (DROP, TRUNCATE)
      const dangerousQuery = `
        SELECT table_schema, privilege_type
        FROM information_schema.role_table_grants
        WHERE grantee = $1 
          AND privilege_type IN ('DROP', 'TRUNCATE')
          AND table_schema = ANY($2::text[])
      `;

      const dangerousResult = await this.pool.query(dangerousQuery, [expectedUser, schemas]);
      
      if (dangerousResult.rows.length > 0) {
        issues.push({
          type: 'DANGEROUS_PRIVILEGES',
          privileges: dangerousResult.rows,
        });
      }

      if (issues.length > 0) {
        return {
          passed: false,
          message: 'Security validation failed',
          details: { issues },
        };
      }

      return {
        passed: true,
        message: 'Security permissions validated successfully',
      };
    } catch (error) {
      return {
        passed: false,
        message: `Security validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
