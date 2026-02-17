/**
 * BackendDatabaseValidator - Validates database connectivity and CRUD operations
 * 
 * Validates:
 * - Database connection (Requirements 2.1)
 * - CRUD operations: Create, Read, Update, Delete (Requirements 2.2, 2.3, 2.4, 2.5)
 * - Database transactions (Requirements 2.6)
 * - Query performance (Requirements 2.7)
 */

import { PrismaClient } from '@prisma/client';
import { PhaseResult, ValidationResult, ValidationError, ValidationWarning } from '../types.js';

export class BackendDatabaseValidator {
  private prisma: PrismaClient;
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];
  private testUserIds: string[] = [];

  constructor(connectionString?: string) {
    this.prisma = new PrismaClient({
      datasources: connectionString ? {
        db: { url: connectionString }
      } : undefined,
      log: ['error'], // Only log errors to reduce noise
    });
  }

  /**
   * Execute all backend-database validation checks
   */
  async execute(): Promise<PhaseResult> {
    this.errors = [];
    this.warnings = [];
    this.testUserIds = [];

    try {
      // Run checks sequentially to ensure proper cleanup
      await this.validateConnection();
      await this.validateCRUDOperations();
      await this.validateTransactions();
      await this.validateQueryPerformance();
    } finally {
      // Always cleanup test data
      await this.cleanup();
      await this.prisma.$disconnect();
    }

    const status = this.errors.length > 0 ? 'FAIL' : this.warnings.length > 0 ? 'WARN' : 'PASS';

    return {
      phaseName: 'backendDatabase',
      status,
      errors: this.errors,
      warnings: this.warnings,
      duration: 0, // Will be set by orchestrator
    };
  }

  /**
   * Validate database connection
   * Requirements: 2.1
   */
  async validateConnection(): Promise<ValidationResult> {
    try {
      // Test connection by executing a simple query
      await this.prisma.$queryRaw`SELECT 1 as test`;

      return {
        passed: true,
        message: 'Database connection is established',
      };
    } catch (error) {
      this.errors.push({
        phase: 'backendDatabase',
        code: 'DB_CONNECTION_FAILED',
        message: `Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });

      return {
        passed: false,
        message: 'Database connection failed',
        details: error,
      };
    }
  }

  /**
   * Validate CRUD operations
   * Requirements: 2.2, 2.3, 2.4, 2.5
   */
  async validateCRUDOperations(): Promise<ValidationResult> {
    try {
      // Generate unique test data
      const testPhone = `+254TEST${Date.now()}`;

      // CREATE: Create a test user record
      const createdUser = await this.prisma.user.create({
        data: {
          phone: testPhone,
          passwordHash: '$2b$10$test.hash.for.validation.only',
          role: 'user',
          walletId: `TEST${Date.now()}`,
        },
      });

      this.testUserIds.push(createdUser.id);

      if (!createdUser || !createdUser.id) {
        this.errors.push({
          phase: 'backendDatabase',
          code: 'CRUD_CREATE_FAILED',
          message: 'Failed to create test user record',
          timestamp: new Date().toISOString(),
        });

        return {
          passed: false,
          message: 'CRUD Create operation failed',
        };
      }

      // READ: Read the test user record
      const readUser = await this.prisma.user.findUnique({
        where: { id: createdUser.id },
      });

      if (!readUser || readUser.id !== createdUser.id) {
        this.errors.push({
          phase: 'backendDatabase',
          code: 'CRUD_READ_FAILED',
          message: 'Failed to read test user record',
          details: { expectedId: createdUser.id, foundId: readUser?.id },
          timestamp: new Date().toISOString(),
        });

        return {
          passed: false,
          message: 'CRUD Read operation failed',
        };
      }

      // UPDATE: Update the test user record
      const updatedPhone = `+254UPDT${Date.now()}`;
      const updatedUser = await this.prisma.user.update({
        where: { id: createdUser.id },
        data: { phone: updatedPhone },
      });

      if (!updatedUser || updatedUser.phone !== updatedPhone) {
        this.errors.push({
          phase: 'backendDatabase',
          code: 'CRUD_UPDATE_FAILED',
          message: 'Failed to update test user record',
          details: { expectedPhone: updatedPhone, actualPhone: updatedUser?.phone },
          timestamp: new Date().toISOString(),
        });

        return {
          passed: false,
          message: 'CRUD Update operation failed',
        };
      }

      // DELETE: Delete the test user record
      await this.prisma.user.delete({
        where: { id: createdUser.id },
      });

      // Verify deletion
      const deletedUser = await this.prisma.user.findUnique({
        where: { id: createdUser.id },
      });

      if (deletedUser !== null) {
        this.errors.push({
          phase: 'backendDatabase',
          code: 'CRUD_DELETE_FAILED',
          message: 'Failed to delete test user record',
          details: { userId: createdUser.id },
          timestamp: new Date().toISOString(),
        });

        return {
          passed: false,
          message: 'CRUD Delete operation failed',
        };
      }

      // Remove from cleanup list since we already deleted it
      this.testUserIds = this.testUserIds.filter(id => id !== createdUser.id);

      return {
        passed: true,
        message: 'CRUD operations completed successfully',
        details: {
          created: true,
          read: true,
          updated: true,
          deleted: true,
        },
      };
    } catch (error) {
      this.errors.push({
        phase: 'backendDatabase',
        code: 'CRUD_OPERATIONS_FAILED',
        message: `CRUD operations validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });

      return {
        passed: false,
        message: 'CRUD operations validation failed',
        details: error,
      };
    }
  }

  /**
   * Validate database transactions
   * Requirements: 2.6
   */
  async validateTransactions(): Promise<ValidationResult> {
    try {
      const testPhone1 = `+254TXN1${Date.now()}`;
      const testPhone2 = `+254TXN2${Date.now()}`;

      // Test transaction commit
      const result = await this.prisma.$transaction(async (tx) => {
        const user1 = await tx.user.create({
          data: {
            phone: testPhone1,
            passwordHash: '$2b$10$test.hash.for.validation.only',
            role: 'user',
            walletId: `TXTEST1${Date.now()}`,
          },
        });

        const user2 = await tx.user.create({
          data: {
            phone: testPhone2,
            passwordHash: '$2b$10$test.hash.for.validation.only',
            role: 'user',
            walletId: `TXTEST2${Date.now()}`,
          },
        });

        return { user1, user2 };
      });

      this.testUserIds.push(result.user1.id, result.user2.id);

      // Verify both users were created (transaction committed)
      const user1Exists = await this.prisma.user.findUnique({
        where: { id: result.user1.id },
      });

      const user2Exists = await this.prisma.user.findUnique({
        where: { id: result.user2.id },
      });

      if (!user1Exists || !user2Exists) {
        this.errors.push({
          phase: 'backendDatabase',
          code: 'TRANSACTION_COMMIT_FAILED',
          message: 'Transaction did not commit successfully',
          details: { user1Exists: !!user1Exists, user2Exists: !!user2Exists },
          timestamp: new Date().toISOString(),
        });

        return {
          passed: false,
          message: 'Transaction validation failed',
        };
      }

      // Test transaction rollback
      let rollbackTestUserId: string | null = null;
      try {
        await this.prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              phone: `+254ROLLBACK${Date.now()}`,
              passwordHash: '$2b$10$test.hash.for.validation.only',
              role: 'user',
              walletId: `ROLLBACK${Date.now()}`,
            },
          });

          rollbackTestUserId = user.id;

          // Force a rollback by throwing an error
          throw new Error('Intentional rollback for testing');
        });
      } catch (error) {
        // Expected to throw
      }

      // Verify user was NOT created (transaction rolled back)
      if (rollbackTestUserId) {
        const rolledBackUser = await this.prisma.user.findUnique({
          where: { id: rollbackTestUserId },
        });

        if (rolledBackUser !== null) {
          this.errors.push({
            phase: 'backendDatabase',
            code: 'TRANSACTION_ROLLBACK_FAILED',
            message: 'Transaction did not rollback successfully',
            details: { userId: rollbackTestUserId },
            timestamp: new Date().toISOString(),
          });

          // Add to cleanup list
          this.testUserIds.push(rollbackTestUserId);

          return {
            passed: false,
            message: 'Transaction rollback validation failed',
          };
        }
      }

      return {
        passed: true,
        message: 'Database transactions validated successfully',
        details: {
          commitTest: true,
          rollbackTest: true,
        },
      };
    } catch (error) {
      this.errors.push({
        phase: 'backendDatabase',
        code: 'TRANSACTION_VALIDATION_FAILED',
        message: `Transaction validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });

      return {
        passed: false,
        message: 'Transaction validation failed',
        details: error,
      };
    }
  }

  /**
   * Validate query performance
   * Requirements: 2.7
   */
  async validateQueryPerformance(): Promise<ValidationResult> {
    try {
      const startTime = Date.now();
      
      // Execute a simple query and measure time
      await this.prisma.user.findMany({
        take: 10,
      });

      const duration = Date.now() - startTime;
      const threshold = 5000; // 5 seconds

      if (duration > threshold) {
        this.warnings.push({
          phase: 'backendDatabase',
          message: `Query execution took ${duration}ms (threshold: ${threshold}ms)`,
          suggestion: 'Consider optimizing database queries or checking database performance',
        });
      }

      return {
        passed: true,
        message: 'Query performance is acceptable',
        details: { duration, threshold },
      };
    } catch (error) {
      this.errors.push({
        phase: 'backendDatabase',
        code: 'QUERY_PERFORMANCE_CHECK_FAILED',
        message: `Query performance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });

      return {
        passed: false,
        message: 'Query performance check failed',
        details: error,
      };
    }
  }

  /**
   * Clean up test data
   */
  private async cleanup(): Promise<void> {
    try {
      if (this.testUserIds.length > 0) {
        await this.prisma.user.deleteMany({
          where: {
            id: {
              in: this.testUserIds,
            },
          },
        });
      }
    } catch (error) {
      // Log cleanup error but don't fail validation
      this.warnings.push({
        phase: 'backendDatabase',
        message: `Failed to cleanup test data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Manually remove test users if necessary',
      });
    }
  }
}
