/**
 * ValidationOrchestrator - Coordinates execution of all validation phases
 * 
 * Responsibilities:
 * - Register and manage validation phases
 * - Execute phases sequentially with error handling
 * - Aggregate results from all phases
 * - Continue execution even if individual phases fail
 */

import { PhaseResult, ValidationReport, ValidationError, ValidationWarning } from './types';

export interface ValidationPhase {
  name: string;
  execute(): Promise<PhaseResult>;
}

export class ValidationOrchestrator {
  private phases: Map<string, ValidationPhase> = new Map();
  private results: PhaseResult[] = [];

  /**
   * Register a validation phase
   * @param phase The validation phase to register
   */
  registerPhase(phase: ValidationPhase): void {
    this.phases.set(phase.name, phase);
  }

  /**
   * Run all registered phases sequentially
   * Continues execution even if individual phases fail
   * @returns Complete validation report
   */
  async runAllPhases(): Promise<ValidationReport> {
    this.results = [];

    for (const [name, phase] of this.phases) {
      try {
        const result = await this.runPhaseWithErrorHandling(phase);
        this.results.push(result);
      } catch (error) {
        // This should not happen as runPhaseWithErrorHandling catches all errors
        // But we add a safety net just in case
        const errorResult: PhaseResult = {
          phaseName: name,
          status: 'FAIL',
          errors: [{
            phase: name,
            code: 'UNEXPECTED_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: error,
            timestamp: new Date().toISOString()
          }],
          warnings: [],
          duration: 0
        };
        this.results.push(errorResult);
      }
    }

    return this.getReport();
  }

  /**
   * Run a specific phase by name
   * @param phaseName Name of the phase to run
   * @returns Phase result
   */
  async runPhase(phaseName: string): Promise<PhaseResult> {
    const phase = this.phases.get(phaseName);
    
    if (!phase) {
      throw new Error(`Phase not found: ${phaseName}`);
    }

    const result = await this.runPhaseWithErrorHandling(phase);
    
    // Update or add result
    const existingIndex = this.results.findIndex(r => r.phaseName === phaseName);
    if (existingIndex >= 0) {
      this.results[existingIndex] = result;
    } else {
      this.results.push(result);
    }

    return result;
  }

  /**
   * Execute a phase with comprehensive error handling
   * Ensures that phase failures don't crash the orchestrator
   * @param phase The phase to execute
   * @returns Phase result (always succeeds, errors captured in result)
   */
  private async runPhaseWithErrorHandling(phase: ValidationPhase): Promise<PhaseResult> {
    const startTime = Date.now();

    try {
      const result = await phase.execute();
      const duration = Date.now() - startTime;
      
      return {
        ...result,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        phaseName: phase.name,
        status: 'FAIL',
        errors: [{
          phase: phase.name,
          code: 'PHASE_EXECUTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error,
          timestamp: new Date().toISOString()
        }],
        warnings: [],
        duration
      };
    }
  }

  /**
   * Get aggregated validation report from all executed phases
   * @returns Complete validation report
   */
  getReport(): ValidationReport {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];
    
    let passedPhases = 0;
    let failedPhases = 0;
    let warningPhases = 0;

    // Aggregate results
    for (const result of this.results) {
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);

      if (result.status === 'PASS') {
        passedPhases++;
      } else if (result.status === 'FAIL') {
        failedPhases++;
      } else if (result.status === 'WARN') {
        warningPhases++;
      }
    }

    // Production ready only if all phases pass (no failures)
    const productionReady = failedPhases === 0 && this.results.length > 0;

    // Build phase status map
    const phaseStatusMap: Record<string, any> = {};
    for (const result of this.results) {
      phaseStatusMap[result.phaseName] = {
        status: result.status,
        message: this.getPhaseMessage(result),
        details: {
          duration: result.duration,
          errorCount: result.errors.length,
          warningCount: result.warnings.length
        }
      };
    }

    return {
      timestamp: new Date().toISOString(),
      productionReady,
      summary: {
        totalPhases: this.results.length,
        passedPhases,
        failedPhases,
        warnings: allWarnings.length
      },
      phases: {
        frontendBackend: phaseStatusMap['frontendBackend'] || { status: 'WARN', message: 'Not executed' },
        backendDatabase: phaseStatusMap['backendDatabase'] || { status: 'WARN', message: 'Not executed' },
        realTime: phaseStatusMap['realTime'] || { status: 'WARN', message: 'Not executed' },
        pageCompleteness: phaseStatusMap['pageCompleteness'] || { status: 'WARN', message: 'Not executed' },
        security: phaseStatusMap['security'] || { status: 'WARN', message: 'Not executed' },
        healthEndpoint: phaseStatusMap['healthEndpoint'] || { status: 'WARN', message: 'Not executed' },
        architecture: phaseStatusMap['architecture'] || { status: 'WARN', message: 'Not executed' },
        postgresqlProduction: phaseStatusMap['postgresqlProduction'] || { status: 'WARN', message: 'Not executed' }
      },
      missingPages: [],
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Generate a human-readable message for a phase result
   * @param result Phase result
   * @returns Summary message
   */
  private getPhaseMessage(result: PhaseResult): string {
    if (result.status === 'PASS') {
      return `Phase completed successfully in ${result.duration}ms`;
    } else if (result.status === 'FAIL') {
      return `Phase failed with ${result.errors.length} error(s)`;
    } else {
      return `Phase completed with ${result.warnings.length} warning(s)`;
    }
  }

  /**
   * Clear all results (useful for testing)
   */
  clearResults(): void {
    this.results = [];
  }

  /**
   * Get list of registered phase names
   */
  getRegisteredPhases(): string[] {
    return Array.from(this.phases.keys());
  }
}
