/**
 * Report Generator Tests
 * 
 * Tests for validation report generation
 * Validates Requirements: 8.1-8.11, 9.5, 9.6
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReportGenerator } from './report-generator';
import { PhaseResult, AutoFixChange } from './types';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('ReportGenerator', () => {
  let generator: ReportGenerator;
  
  beforeEach(() => {
    generator = new ReportGenerator();
  });
  
  describe('generateReport', () => {
    it('should generate a complete report with all required fields', () => {
      const results: PhaseResult[] = [
        {
          phaseName: 'Frontend-Backend Connection',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 100
        },
        {
          phaseName: 'Backend-Database Connection',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 150
        }
      ];
      
      const report = generator.generateReport(results);
      
      // Requirement 8.1: Report contains all validation results
      expect(report).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.productionReady).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.phases).toBeDefined();
      expect(report.missingPages).toBeDefined();
      expect(report.errors).toBeDefined();
      expect(report.warnings).toBeDefined();
    });

    it('should include frontend status in report', () => {
      const results: PhaseResult[] = [
        {
          phaseName: 'Frontend-Backend Connection',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 100
        }
      ];
      
      const report = generator.generateReport(results);
      
      // Requirement 8.2: Include frontend status
      expect(report.phases.frontendBackend).toBeDefined();
      expect(report.phases.frontendBackend.status).toBe('OK');
    });
    
    it('should include backend status in report', () => {
      const results: PhaseResult[] = [
        {
          phaseName: 'Backend-Database Connection',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 150
        }
      ];
      
      const report = generator.generateReport(results);
      
      // Requirement 8.3: Include backend status
      expect(report.phases.backendDatabase).toBeDefined();
      expect(report.phases.backendDatabase.status).toBe('OK');
    });
    
    it('should include database status in report', () => {
      const results: PhaseResult[] = [
        {
          phaseName: 'Backend-Database Connection',
          status: 'FAIL',
          errors: [{
            phase: 'Backend-Database Connection',
            code: 'DB_CONNECTION_FAILED',
            message: 'Database connection failed',
            timestamp: new Date().toISOString()
          }],
          warnings: [],
          duration: 50
        }
      ];
      
      const report = generator.generateReport(results);
      
      // Requirement 8.4: Include database status
      expect(report.phases.backendDatabase).toBeDefined();
      expect(report.phases.backendDatabase.status).toBe('FAIL');
    });

    it('should include real-time functionality status in report', () => {
      const results: PhaseResult[] = [
        {
          phaseName: 'Real-Time Functionality',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 200
        }
      ];
      
      const report = generator.generateReport(results);
      
      // Requirement 8.5: Include real-time status
      expect(report.phases.realTime).toBeDefined();
      expect(report.phases.realTime.status).toBe('OK');
    });
    
    it('should include security validation status in report', () => {
      const results: PhaseResult[] = [
        {
          phaseName: 'Security Validation',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 300
        }
      ];
      
      const report = generator.generateReport(results);
      
      // Requirement 8.6: Include security status
      expect(report.phases.security).toBeDefined();
      expect(report.phases.security.status).toBe('OK');
    });
    
    it('should list all missing pages discovered during audit', () => {
      const results: PhaseResult[] = [
        {
          phaseName: 'Page Completeness',
          status: 'FAIL',
          errors: [{
            phase: 'Page Completeness',
            code: 'MISSING_PAGES',
            message: 'Missing required pages',
            details: {
              missingRoutes: ['/dashboard', '/admin/users', '/agent/deposit']
            },
            timestamp: new Date().toISOString()
          }],
          warnings: [],
          duration: 100
        }
      ];
      
      const report = generator.generateReport(results);
      
      // Requirement 8.7: List all missing pages
      expect(report.missingPages).toBeDefined();
      expect(report.missingPages).toContain('/dashboard');
      expect(report.missingPages).toContain('/admin/users');
      expect(report.missingPages).toContain('/agent/deposit');
    });

    it('should list all errors encountered during validation', () => {
      const results: PhaseResult[] = [
        {
          phaseName: 'Frontend-Backend Connection',
          status: 'FAIL',
          errors: [{
            phase: 'Frontend-Backend Connection',
            code: 'API_UNREACHABLE',
            message: 'API endpoint unreachable',
            timestamp: new Date().toISOString()
          }],
          warnings: [],
          duration: 50
        },
        {
          phaseName: 'Backend-Database Connection',
          status: 'FAIL',
          errors: [{
            phase: 'Backend-Database Connection',
            code: 'DB_CONNECTION_FAILED',
            message: 'Database connection failed',
            timestamp: new Date().toISOString()
          }],
          warnings: [],
          duration: 50
        }
      ];
      
      const report = generator.generateReport(results);
      
      // Requirement 8.8: List all errors
      expect(report.errors).toBeDefined();
      expect(report.errors.length).toBe(2);
      expect(report.errors[0].code).toBe('API_UNREACHABLE');
      expect(report.errors[1].code).toBe('DB_CONNECTION_FAILED');
    });
    
    it('should include production readiness indicator', () => {
      const results: PhaseResult[] = [
        {
          phaseName: 'Frontend-Backend Connection',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 100
        }
      ];
      
      const report = generator.generateReport(results);
      
      // Requirement 8.9: Include production readiness indicator
      expect(report.productionReady).toBeDefined();
      expect(typeof report.productionReady).toBe('boolean');
    });

    it('should set production readiness to NO when any validation phase fails', () => {
      const results: PhaseResult[] = [
        {
          phaseName: 'Frontend-Backend Connection',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 100
        },
        {
          phaseName: 'Backend-Database Connection',
          status: 'FAIL',
          errors: [{
            phase: 'Backend-Database Connection',
            code: 'DB_CONNECTION_FAILED',
            message: 'Database connection failed',
            timestamp: new Date().toISOString()
          }],
          warnings: [],
          duration: 50
        }
      ];
      
      const report = generator.generateReport(results);
      
      // Requirement 8.10: Set production readiness to NO when any phase fails
      expect(report.productionReady).toBe(false);
    });
    
    it('should set production readiness to YES when all validation phases pass', () => {
      const results: PhaseResult[] = [
        {
          phaseName: 'Frontend-Backend Connection',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 100
        },
        {
          phaseName: 'Backend-Database Connection',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 150
        },
        {
          phaseName: 'Security Validation',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 200
        }
      ];
      
      const report = generator.generateReport(results);
      
      // Requirement 8.11: Set production readiness to YES when all phases pass
      expect(report.productionReady).toBe(true);
    });

    it('should include auto-fix changes when provided', () => {
      const results: PhaseResult[] = [
        {
          phaseName: 'Page Completeness',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 100
        }
      ];
      
      const autoFixChanges: AutoFixChange[] = [
        {
          type: 'CREATE_FILE',
          path: '/pages/dashboard.tsx',
          description: 'Created missing dashboard page'
        },
        {
          type: 'ADD_ROUTE',
          path: '/routes/index.ts',
          description: 'Added dashboard route'
        }
      ];
      
      const report = generator.generateReport(results, autoFixChanges);
      
      expect(report.autoFixChanges).toBeDefined();
      expect(report.autoFixChanges?.length).toBe(2);
      expect(report.autoFixChanges?.[0].type).toBe('CREATE_FILE');
    });
  });
  
  describe('saveToFile', () => {
    const testDir = join(process.cwd(), 'test-output');
    const testFilePath = join(testDir, 'test-report.json');
    
    beforeEach(() => {
      // Create test directory if it doesn't exist
      if (!existsSync(testDir)) {
        mkdirSync(testDir, { recursive: true });
      }
    });
    
    afterEach(() => {
      // Clean up test file
      if (existsSync(testFilePath)) {
        unlinkSync(testFilePath);
      }
    });
    
    it('should save report to JSON file', () => {
      const results: PhaseResult[] = [
        {
          phaseName: 'Frontend-Backend Connection',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 100
        }
      ];
      
      const report = generator.generateReport(results);
      generator.saveToFile(report, testFilePath);
      
      // Requirement 9.6: Save report to file
      expect(existsSync(testFilePath)).toBe(true);
    });
    
    it('should throw error when file path is invalid', () => {
      const results: PhaseResult[] = [
        {
          phaseName: 'Frontend-Backend Connection',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 100
        }
      ];
      
      const report = generator.generateReport(results);
      
      expect(() => {
        generator.saveToFile(report, '/invalid/path/report.json');
      }).toThrow();
    });
  });
  
  describe('printToConsole', () => {
    it('should print report to console without errors', () => {
      const results: PhaseResult[] = [
        {
          phaseName: 'Frontend-Backend Connection',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 100
        }
      ];
      
      const report = generator.generateReport(results);
      
      // Requirement 9.5: Print report to console
      expect(() => {
        generator.printToConsole(report);
      }).not.toThrow();
    });
    
    it('should print report with verbose mode', () => {
      const results: PhaseResult[] = [
        {
          phaseName: 'Frontend-Backend Connection',
          status: 'PASS',
          errors: [],
          warnings: [{
            phase: 'Frontend-Backend Connection',
            message: 'Slow API response',
            suggestion: 'Consider optimizing API endpoints'
          }],
          duration: 100
        }
      ];
      
      const report = generator.generateReport(results);
      
      expect(() => {
        generator.printToConsole(report, true);
      }).not.toThrow();
    });
  });
});
