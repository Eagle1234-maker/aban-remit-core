/**
 * PostgreSQLProductionValidator - Validates PostgreSQL database production readiness
 * 
 * Validates:
 * - Multi-schema architecture (auth, core, ledger, audit, services)
 * - Connection pool configuration
 * - Log table structures (mpesa_logs, paystack_logs, sms_logs)
 * - Critical indexes for performance
 * - System account initialization
 * - Ledger integrity
 * - Idempotency mechanisms
 * - Security and permissions
 * 
 * Requirements: 1.1-13.8
 */

import { PhaseResult, ValidationError, ValidationWarning } from '../types.js';
import { SchemaValidator } from './helpers/schema-validator.js';
import { ConnectionPoolValidator } from './helpers/connection-pool-validator.js';
import { LogTableValidator } from './helpers/log-table-validator.js';
import { IntegrationValidator } from './helpers/integration-validator.js';

export interface PostgreSQLValidationConfig {
  connectionString: string;
  expectedDatabase: string;
  expectedUser: string;
  minPostgresVersion: string;
}

export class PostgreSQLProductionValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];
  private config: PostgreSQLValidationConfig;
  
  private schemaValidator: SchemaValidator;
  private connectionPoolValidator: ConnectionPoolValidator;
  private logTableValidator: LogTableValidator;
  private integrationValidator: IntegrationValidator;

  constructor(config: PostgreSQLValidationConfig) {
    this.config = config;
    
    // Initialize helper validators
    this.schemaValidator = new SchemaValidator(config.connectionString);
    this.connectionPoolValidator = new ConnectionPoolValidator(config.connectionString);
    this.logTableValidator = new LogTableValidator(config.connectionString);
    this.integrationValidator = new IntegrationValidator(config.connectionString);
  }

  /**
   * Execute all PostgreSQL production validation checks
   */
  async execute(): Promise<PhaseResult> {
    this.errors = [];
    this.warnings = [];

    try {
      // Run all validation checks
      await this.validateSchemaArchitecture();
      await this.validateConnectionPool();
      await this.validateLogTables();
      await this.validateIndexes();
      await this.validateSystemAccounts();
      await this.validateConnection();
      await this.validateLedgerIntegrity();
      await this.validateIdempotency();
      await this.validateSecurity();
    } catch (error) {
      this.errors.push({
        phase: 'postgresqlProduction',
        code: 'VALIDATION_EXECUTION_FAILED',
        message: `Validation execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });
    }

    const status = this.errors.length > 0 ? 'FAIL' : this.warnings.length > 0 ? 'WARN' : 'PASS';

    return {
      phaseName: 'postgresqlProduction',
      status,
      errors: this.errors,
      warnings: this.warnings,
      duration: 0, // Will be set by orchestrator
    };
  }

  /**
   * Validate multi-schema architecture
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
   */
  async validateSchemaArchitecture(): Promise<void> {
    try {
      const result = await this.schemaValidator.validateAllSchemas();
      
      if (!result.passed) {
        this.errors.push({
          phase: 'postgresqlProduction',
          code: 'SCHEMA_VALIDATION_FAILED',
          message: result.message,
          details: result.details,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.errors.push({
        phase: 'postgresqlProduction',
        code: 'SCHEMA_VALIDATION_ERROR',
        message: `Schema validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Validate connection pool configuration
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
   */
  async validateConnectionPool(): Promise<void> {
    try {
      const result = await this.connectionPoolValidator.validatePool();
      
      if (!result.passed) {
        this.errors.push({
          phase: 'postgresqlProduction',
          code: 'CONNECTION_POOL_VALIDATION_FAILED',
          message: result.message,
          details: result.details,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Add warnings for performance issues
      if (result.details?.warnings) {
        for (const warning of result.details.warnings) {
          this.warnings.push({
            phase: 'postgresqlProduction',
            message: warning,
          });
        }
      }
    } catch (error) {
      this.errors.push({
        phase: 'postgresqlProduction',
        code: 'CONNECTION_POOL_VALIDATION_ERROR',
        message: `Connection pool validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Validate log table structures
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
   */
  async validateLogTables(): Promise<void> {
    try {
      const result = await this.logTableValidator.validateAllLogTables();
      
      if (!result.passed) {
        this.errors.push({
          phase: 'postgresqlProduction',
          code: 'LOG_TABLE_VALIDATION_FAILED',
          message: result.message,
          details: result.details,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.errors.push({
        phase: 'postgresqlProduction',
        code: 'LOG_TABLE_VALIDATION_ERROR',
        message: `Log table validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Validate critical indexes
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
   */
  async validateIndexes(): Promise<void> {
    try {
      const result = await this.schemaValidator.validateCriticalIndexes();
      
      if (!result.passed) {
        this.errors.push({
          phase: 'postgresqlProduction',
          code: 'INDEX_VALIDATION_FAILED',
          message: result.message,
          details: result.details,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.errors.push({
        phase: 'postgresqlProduction',
        code: 'INDEX_VALIDATION_ERROR',
        message: `Index validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Validate system accounts
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
   */
  async validateSystemAccounts(): Promise<void> {
    try {
      const result = await this.schemaValidator.validateSystemAccounts();
      
      if (!result.passed) {
        this.errors.push({
          phase: 'postgresqlProduction',
          code: 'SYSTEM_ACCOUNT_VALIDATION_FAILED',
          message: result.message,
          details: result.details,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.errors.push({
        phase: 'postgresqlProduction',
        code: 'SYSTEM_ACCOUNT_VALIDATION_ERROR',
        message: `System account validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Validate database connection
   * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
   */
  async validateConnection(): Promise<void> {
    try {
      const result = await this.connectionPoolValidator.validateConnection(
        this.config.expectedDatabase,
        this.config.expectedUser,
        this.config.minPostgresVersion
      );
      
      if (!result.passed) {
        this.errors.push({
          phase: 'postgresqlProduction',
          code: 'CONNECTION_VALIDATION_FAILED',
          message: result.message,
          details: result.details,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Add latency warning if needed
      if (result.details?.latency > 100) {
        this.warnings.push({
          phase: 'postgresqlProduction',
          message: `Connection latency (${result.details.latency}ms) exceeds 100ms threshold`,
          suggestion: 'Consider optimizing network connectivity or database location',
        });
      }
    } catch (error) {
      this.errors.push({
        phase: 'postgresqlProduction',
        code: 'CONNECTION_VALIDATION_ERROR',
        message: `Connection validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Validate ledger integrity
   * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8
   */
  async validateLedgerIntegrity(): Promise<void> {
    try {
      const result = await this.schemaValidator.validateLedgerIntegrity();
      
      if (!result.passed) {
        this.errors.push({
          phase: 'postgresqlProduction',
          code: 'LEDGER_INTEGRITY_VALIDATION_FAILED',
          message: result.message,
          details: result.details,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.errors.push({
        phase: 'postgresqlProduction',
        code: 'LEDGER_INTEGRITY_VALIDATION_ERROR',
        message: `Ledger integrity validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Validate idempotency mechanisms
   * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8
   */
  async validateIdempotency(): Promise<void> {
    try {
      const result = await this.integrationValidator.validateIdempotency();
      
      if (!result.passed) {
        this.errors.push({
          phase: 'postgresqlProduction',
          code: 'IDEMPOTENCY_VALIDATION_FAILED',
          message: result.message,
          details: result.details,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.errors.push({
        phase: 'postgresqlProduction',
        code: 'IDEMPOTENCY_VALIDATION_ERROR',
        message: `Idempotency validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Validate security and permissions
   * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8
   */
  async validateSecurity(): Promise<void> {
    try {
      const result = await this.schemaValidator.validateSecurity(this.config.expectedUser);
      
      if (!result.passed) {
        this.errors.push({
          phase: 'postgresqlProduction',
          code: 'SECURITY_VALIDATION_FAILED',
          message: result.message,
          details: result.details,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.errors.push({
        phase: 'postgresqlProduction',
        code: 'SECURITY_VALIDATION_ERROR',
        message: `Security validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Generate production readiness report
   * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8
   */
  generateProductionReadinessReport(): any {
    const productionReady = this.errors.length === 0;
    
    return {
      timestamp: new Date().toISOString(),
      productionReady,
      status: productionReady ? 'PRODUCTION READY' : 'NOT PRODUCTION READY',
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
      },
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Generate recommendations based on errors and warnings
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    for (const error of this.errors) {
      if (error.code === 'SCHEMA_VALIDATION_FAILED') {
        recommendations.push('Run database migrations to create missing schemas and tables');
      } else if (error.code === 'INDEX_VALIDATION_FAILED') {
        recommendations.push('Add missing indexes to improve query performance');
      } else if (error.code === 'SYSTEM_ACCOUNT_VALIDATION_FAILED') {
        recommendations.push('Initialize system accounts (MPESA_SUSPENSE, PAYSTACK_SUSPENSE, etc.)');
      } else if (error.code === 'SECURITY_VALIDATION_FAILED') {
        recommendations.push('Review and fix database security permissions');
      }
    }
    
    return [...new Set(recommendations)]; // Remove duplicates
  }
}
