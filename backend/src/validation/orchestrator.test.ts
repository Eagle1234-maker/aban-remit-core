/**
 * Unit tests for ValidationOrchestrator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationOrchestrator, ValidationPhase } from './orchestrator';
import { PhaseResult } from './types';

describe('ValidationOrchestrator', () => {
  let orchestrator: ValidationOrchestrator;

  beforeEach(() => {
    orchestrator = new ValidationOrchestrator();
  });

  describe('Phase Registration', () => {
    it('should register a validation phase', () => {
      const mockPhase: ValidationPhase = {
        name: 'testPhase',
        execute: async () => ({
          phaseName: 'testPhase',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 0
        })
      };

      orchestrator.registerPhase(mockPhase);
      const registeredPhases = orchestrator.getRegisteredPhases();

      expect(registeredPhases).toContain('testPhase');
      expect(registeredPhases.length).toBe(1);
    });

    it('should register multiple phases', () => {
      const phase1: ValidationPhase = {
        name: 'phase1',
        execute: async () => ({
          phaseName: 'phase1',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 0
        })
      };

      const phase2: ValidationPhase = {
        name: 'phase2',
        execute: async () => ({
          phaseName: 'phase2',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 0
        })
      };

      orchestrator.registerPhase(phase1);
      orchestrator.registerPhase(phase2);

      const registeredPhases = orchestrator.getRegisteredPhases();
      expect(registeredPhases).toContain('phase1');
      expect(registeredPhases).toContain('phase2');
      expect(registeredPhases.length).toBe(2);
    });
  });

  describe('Sequential Phase Execution', () => {
    it('should execute all phases sequentially', async () => {
      const executionOrder: string[] = [];

      const phase1: ValidationPhase = {
        name: 'phase1',
        execute: async () => {
          executionOrder.push('phase1');
          return {
            phaseName: 'phase1',
            status: 'PASS',
            errors: [],
            warnings: [],
            duration: 0
          };
        }
      };

      const phase2: ValidationPhase = {
        name: 'phase2',
        execute: async () => {
          executionOrder.push('phase2');
          return {
            phaseName: 'phase2',
            status: 'PASS',
            errors: [],
            warnings: [],
            duration: 0
          };
        }
      };

      orchestrator.registerPhase(phase1);
      orchestrator.registerPhase(phase2);

      await orchestrator.runAllPhases();

      expect(executionOrder).toEqual(['phase1', 'phase2']);
    });

    it('should continue execution even if a phase fails', async () => {
      const executionOrder: string[] = [];

      const failingPhase: ValidationPhase = {
        name: 'failingPhase',
        execute: async () => {
          executionOrder.push('failingPhase');
          return {
            phaseName: 'failingPhase',
            status: 'FAIL',
            errors: [{
              phase: 'failingPhase',
              code: 'TEST_ERROR',
              message: 'Test error',
              timestamp: new Date().toISOString()
            }],
            warnings: [],
            duration: 0
          };
        }
      };

      const successPhase: ValidationPhase = {
        name: 'successPhase',
        execute: async () => {
          executionOrder.push('successPhase');
          return {
            phaseName: 'successPhase',
            status: 'PASS',
            errors: [],
            warnings: [],
            duration: 0
          };
        }
      };

      orchestrator.registerPhase(failingPhase);
      orchestrator.registerPhase(successPhase);

      const report = await orchestrator.runAllPhases();

      expect(executionOrder).toEqual(['failingPhase', 'successPhase']);
      expect(report.summary.totalPhases).toBe(2);
      expect(report.summary.failedPhases).toBe(1);
      expect(report.summary.passedPhases).toBe(1);
    });

    it('should handle phase execution exceptions gracefully', async () => {
      const throwingPhase: ValidationPhase = {
        name: 'throwingPhase',
        execute: async () => {
          throw new Error('Unexpected error');
        }
      };

      const normalPhase: ValidationPhase = {
        name: 'normalPhase',
        execute: async () => ({
          phaseName: 'normalPhase',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 0
        })
      };

      orchestrator.registerPhase(throwingPhase);
      orchestrator.registerPhase(normalPhase);

      const report = await orchestrator.runAllPhases();

      expect(report.summary.totalPhases).toBe(2);
      expect(report.summary.failedPhases).toBe(1);
      expect(report.summary.passedPhases).toBe(1);
      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.errors[0].code).toBe('PHASE_EXECUTION_FAILED');
    });
  });

  describe('Result Aggregation', () => {
    it('should aggregate results from all phases', async () => {
      const phase1: ValidationPhase = {
        name: 'phase1',
        execute: async () => ({
          phaseName: 'phase1',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 100
        })
      };

      const phase2: ValidationPhase = {
        name: 'phase2',
        execute: async () => ({
          phaseName: 'phase2',
          status: 'FAIL',
          errors: [{
            phase: 'phase2',
            code: 'ERROR_1',
            message: 'Error message',
            timestamp: new Date().toISOString()
          }],
          warnings: [{
            phase: 'phase2',
            message: 'Warning message'
          }],
          duration: 200
        })
      };

      orchestrator.registerPhase(phase1);
      orchestrator.registerPhase(phase2);

      const report = await orchestrator.runAllPhases();

      expect(report.summary.totalPhases).toBe(2);
      expect(report.summary.passedPhases).toBe(1);
      expect(report.summary.failedPhases).toBe(1);
      expect(report.errors.length).toBe(1);
      expect(report.warnings.length).toBe(1);
      expect(report.productionReady).toBe(false);
    });

    it('should set productionReady to true when all phases pass', async () => {
      const phase1: ValidationPhase = {
        name: 'phase1',
        execute: async () => ({
          phaseName: 'phase1',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 100
        })
      };

      const phase2: ValidationPhase = {
        name: 'phase2',
        execute: async () => ({
          phaseName: 'phase2',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 200
        })
      };

      orchestrator.registerPhase(phase1);
      orchestrator.registerPhase(phase2);

      const report = await orchestrator.runAllPhases();

      expect(report.productionReady).toBe(true);
      expect(report.summary.failedPhases).toBe(0);
    });

    it('should set productionReady to false when any phase fails', async () => {
      const passingPhase: ValidationPhase = {
        name: 'passingPhase',
        execute: async () => ({
          phaseName: 'passingPhase',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 100
        })
      };

      const failingPhase: ValidationPhase = {
        name: 'failingPhase',
        execute: async () => ({
          phaseName: 'failingPhase',
          status: 'FAIL',
          errors: [{
            phase: 'failingPhase',
            code: 'ERROR',
            message: 'Failed',
            timestamp: new Date().toISOString()
          }],
          warnings: [],
          duration: 100
        })
      };

      orchestrator.registerPhase(passingPhase);
      orchestrator.registerPhase(failingPhase);

      const report = await orchestrator.runAllPhases();

      expect(report.productionReady).toBe(false);
    });

    it('should include phase details in the report', async () => {
      const phase: ValidationPhase = {
        name: 'testPhase',
        execute: async () => ({
          phaseName: 'testPhase',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 150
        })
      };

      orchestrator.registerPhase(phase);
      const report = await orchestrator.runAllPhases();

      expect(report.timestamp).toBeDefined();
      expect(report.phases).toBeDefined();
    });
  });

  describe('Single Phase Execution', () => {
    it('should run a specific phase by name', async () => {
      const phase1: ValidationPhase = {
        name: 'phase1',
        execute: async () => ({
          phaseName: 'phase1',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 0
        })
      };

      const phase2: ValidationPhase = {
        name: 'phase2',
        execute: async () => ({
          phaseName: 'phase2',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 0
        })
      };

      orchestrator.registerPhase(phase1);
      orchestrator.registerPhase(phase2);

      const result = await orchestrator.runPhase('phase1');

      expect(result.phaseName).toBe('phase1');
      expect(result.status).toBe('PASS');
    });

    it('should throw error when running non-existent phase', async () => {
      await expect(orchestrator.runPhase('nonExistent')).rejects.toThrow('Phase not found: nonExistent');
    });

    it('should update results when running a phase individually', async () => {
      const phase: ValidationPhase = {
        name: 'testPhase',
        execute: async () => ({
          phaseName: 'testPhase',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 0
        })
      };

      orchestrator.registerPhase(phase);
      await orchestrator.runPhase('testPhase');

      const report = orchestrator.getReport();
      expect(report.summary.totalPhases).toBe(1);
    });
  });

  describe('Report Generation', () => {
    it('should generate report with correct structure', async () => {
      const phase: ValidationPhase = {
        name: 'testPhase',
        execute: async () => ({
          phaseName: 'testPhase',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 100
        })
      };

      orchestrator.registerPhase(phase);
      await orchestrator.runAllPhases();

      const report = orchestrator.getReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('productionReady');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('phases');
      expect(report).toHaveProperty('missingPages');
      expect(report).toHaveProperty('errors');
      expect(report).toHaveProperty('warnings');
    });

    it('should handle empty results gracefully', () => {
      const report = orchestrator.getReport();

      expect(report.summary.totalPhases).toBe(0);
      expect(report.productionReady).toBe(false);
      expect(report.errors).toEqual([]);
      expect(report.warnings).toEqual([]);
    });
  });

  describe('Utility Methods', () => {
    it('should clear results', async () => {
      const phase: ValidationPhase = {
        name: 'testPhase',
        execute: async () => ({
          phaseName: 'testPhase',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 0
        })
      };

      orchestrator.registerPhase(phase);
      await orchestrator.runAllPhases();

      let report = orchestrator.getReport();
      expect(report.summary.totalPhases).toBe(1);

      orchestrator.clearResults();
      report = orchestrator.getReport();
      expect(report.summary.totalPhases).toBe(0);
    });

    it('should return list of registered phases', () => {
      const phase1: ValidationPhase = {
        name: 'phase1',
        execute: async () => ({
          phaseName: 'phase1',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 0
        })
      };

      const phase2: ValidationPhase = {
        name: 'phase2',
        execute: async () => ({
          phaseName: 'phase2',
          status: 'PASS',
          errors: [],
          warnings: [],
          duration: 0
        })
      };

      orchestrator.registerPhase(phase1);
      orchestrator.registerPhase(phase2);

      const phases = orchestrator.getRegisteredPhases();
      expect(phases).toEqual(['phase1', 'phase2']);
    });
  });
});
