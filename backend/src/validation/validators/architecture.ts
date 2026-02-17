/**
 * ArchitectureValidator - Validates project structure and organization
 * 
 * Validates:
 * - Frontend structure (Requirements 7.1, 7.2, 7.3, 7.4, 7.5)
 * - Backend structure (Requirements 7.6, 7.7, 7.8, 7.9, 7.10)
 * - Database structure (Requirements 7.11, 7.12)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { PhaseResult, ValidationResult, ValidationError, ValidationWarning } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ArchitectureValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];
  private frontendPath: string;
  private backendPath: string;

  constructor(frontendPath?: string, backendPath?: string) {
    // Default paths relative to backend/src/validation/validators
    this.frontendPath = frontendPath || path.resolve(__dirname, '../../../../frontend');
    this.backendPath = backendPath || path.resolve(__dirname, '../../../');
  }

  /**
   * Execute all architecture validation checks
   */
  async execute(): Promise<PhaseResult> {
    this.errors = [];
    this.warnings = [];

    await this.validateFrontendStructure();
    await this.validateBackendStructure();
    await this.validateDatabaseStructure();

    const status = this.errors.length > 0 ? 'FAIL' : this.warnings.length > 0 ? 'WARN' : 'PASS';

    return {
      phaseName: 'architecture',
      status,
      errors: this.errors,
      warnings: this.warnings,
      duration: 0,
    };
  }

  /**
   * Validate frontend structure
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   */
  async validateFrontendStructure(): Promise<ValidationResult> {
    // Check if frontend directory exists
    if (!fs.existsSync(this.frontendPath)) {
      this.warnings.push({
        phase: 'architecture',
        message: 'Frontend directory not found',
        suggestion: 'This is expected if frontend is in a separate repository',
      });

      return {
        passed: true,
        message: 'Frontend validation skipped (directory not found)',
      };
    }

    // Required directories (at least one from each group)
    const requiredDirGroups = [
      ['components'],
      ['pages', 'app'],
      ['hooks'],
      ['contexts', 'context'],
      ['services', 'api'],
    ];

    const missingGroups: string[] = [];

    for (const group of requiredDirGroups) {
      const found = group.some(dir => {
        const possiblePaths = [
          path.join(this.frontendPath, dir),
          path.join(this.frontendPath, 'src', dir),
        ];
        return possiblePaths.some(p => fs.existsSync(p));
      });

      if (!found) {
        missingGroups.push(group.join(' or '));
      }
    }

    if (missingGroups.length > 0) {
      this.errors.push({
        phase: 'architecture',
        code: 'FRONTEND_STRUCTURE_INCOMPLETE',
        message: `Frontend missing required directories: ${missingGroups.join(', ')}`,
        details: { missingGroups },
        timestamp: new Date().toISOString(),
      });

      return {
        passed: false,
        message: 'Frontend structure incomplete',
        details: { missingGroups },
      };
    }

    return {
      passed: true,
      message: 'Frontend structure is valid',
    };
  }

  /**
   * Validate backend structure
   * Requirements: 7.6, 7.7, 7.8, 7.9, 7.10
   */
  async validateBackendStructure(): Promise<ValidationResult> {
    // Check if backend directory exists
    if (!fs.existsSync(this.backendPath)) {
      this.errors.push({
        phase: 'architecture',
        code: 'BACKEND_NOT_FOUND',
        message: 'Backend directory not found',
        details: { path: this.backendPath },
        timestamp: new Date().toISOString(),
      });

      return {
        passed: false,
        message: 'Backend directory not found',
      };
    }

    // Required directories (at least one from each group)
    const requiredDirGroups = [
      ['controllers', 'routes'],
      ['middleware'],
      ['services'],
      ['models', 'repositories'],
    ];

    const missingGroups: string[] = [];

    for (const group of requiredDirGroups) {
      const found = group.some(dir => {
        const possiblePaths = [
          path.join(this.backendPath, dir),
          path.join(this.backendPath, 'src', dir),
        ];
        return possiblePaths.some(p => fs.existsSync(p));
      });

      if (!found) {
        missingGroups.push(group.join(' or '));
      }
    }

    if (missingGroups.length > 0) {
      this.errors.push({
        phase: 'architecture',
        code: 'BACKEND_STRUCTURE_INCOMPLETE',
        message: `Backend missing required directories: ${missingGroups.join(', ')}`,
        details: { missingGroups },
        timestamp: new Date().toISOString(),
      });

      return {
        passed: false,
        message: 'Backend structure incomplete',
        details: { missingGroups },
      };
    }

    return {
      passed: true,
      message: 'Backend structure is valid',
    };
  }

  /**
   * Validate database structure
   * Requirements: 7.11, 7.12
   */
  async validateDatabaseStructure(): Promise<ValidationResult> {
    // Look for database directories in backend
    const possibleDbPaths = [
      path.join(this.backendPath, 'prisma'),
      path.join(this.backendPath, 'database'),
      path.join(this.backendPath, 'db'),
    ];

    const dbPath = possibleDbPaths.find(p => fs.existsSync(p));

    if (!dbPath) {
      this.warnings.push({
        phase: 'architecture',
        message: 'Database directory not found',
        suggestion: 'Expected one of: prisma/, database/, db/',
      });

      return {
        passed: true,
        message: 'Database validation skipped (directory not found)',
      };
    }

    // Check for migrations directory
    const migrationsPath = path.join(dbPath, 'migrations');
    if (!fs.existsSync(migrationsPath)) {
      this.warnings.push({
        phase: 'architecture',
        message: 'Migrations directory not found',
        suggestion: 'Create a migrations/ directory for database schema changes',
      });
    }

    // Check for seeds directory (optional)
    const seedsPath = path.join(dbPath, 'seeds');
    const seedPath = path.join(dbPath, 'seed');
    if (!fs.existsSync(seedsPath) && !fs.existsSync(seedPath)) {
      this.warnings.push({
        phase: 'architecture',
        message: 'Seeds directory not found',
        suggestion: 'Consider creating a seeds/ directory for database seeding',
      });
    }

    return {
      passed: true,
      message: 'Database structure is valid',
    };
  }
}
