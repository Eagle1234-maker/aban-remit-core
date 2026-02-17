/**
 * Report Generator
 * 
 * Generates comprehensive validation reports from phase results
 * Validates Requirements: 8.1-8.11, 9.5, 9.6
 */

import { writeFileSync } from 'fs';
import { PhaseResult, ValidationReport, PhaseStatus, AutoFixChange } from './types.js';

export class ReportGenerator {
  /**
   * Generate a comprehensive validation report from phase results
   * Requirements: 8.1-8.11
   */
  generateReport(results: PhaseResult[], autoFixChanges?: AutoFixChange[]): ValidationReport {
    const timestamp = new Date().toISOString();
    
    // Calculate summary statistics
    const totalPhases = results.length;
    const passedPhases = results.filter(r => r.status === 'PASS').length;
    const failedPhases = results.filter(r => r.status === 'FAIL').length;
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
    
    // Determine production readiness (all phases must pass)
    const productionReady = failedPhases === 0;
    
    // Aggregate all errors and warnings
    const allErrors = results.flatMap(r => r.errors);
    const allWarnings = results.flatMap(r => r.warnings);
    
    // Extract missing pages from page completeness phase
    const missingPages = this.extractMissingPages(results);
    
    // Build phase status map
    const phases = {
      frontendBackend: this.getPhaseStatus(results, 'Frontend-Backend Connection'),
      backendDatabase: this.getPhaseStatus(results, 'Backend-Database Connection'),
      realTime: this.getPhaseStatus(results, 'Real-Time Functionality'),
      pageCompleteness: this.getPhaseStatus(results, 'Page Completeness'),
      security: this.getPhaseStatus(results, 'Security Validation'),
      healthEndpoint: this.getPhaseStatus(results, 'Health Endpoint'),
      architecture: this.getPhaseStatus(results, 'Architecture Validation')
    };
    
    return {
      timestamp,
      productionReady,
      summary: {
        totalPhases,
        passedPhases,
        failedPhases,
        warnings: totalWarnings
      },
      phases,
      missingPages,
      errors: allErrors,
      warnings: allWarnings,
      autoFixChanges
    };
  }
  
  /**
   * Get status for a specific phase
   */
  private getPhaseStatus(results: PhaseResult[], phaseName: string): PhaseStatus {
    const phase = results.find(r => r.phaseName === phaseName);
    
    if (!phase) {
      return {
        status: 'WARN',
        message: 'Phase not executed'
      };
    }
    
    return {
      status: phase.status === 'PASS' ? 'OK' : phase.status === 'FAIL' ? 'FAIL' : 'WARN',
      message: this.getPhaseMessage(phase),
      details: phase.errors.length > 0 ? phase.errors : undefined
    };
  }
  
  /**
   * Generate a human-readable message for a phase
   */
  private getPhaseMessage(phase: PhaseResult): string {
    if (phase.status === 'PASS') {
      return `All checks passed (${phase.duration}ms)`;
    } else if (phase.status === 'FAIL') {
      return `${phase.errors.length} error(s) detected`;
    } else {
      return `${phase.warnings.length} warning(s) detected`;
    }
  }
  
  /**
   * Extract missing pages from page completeness phase results
   */
  private extractMissingPages(results: PhaseResult[]): string[] {
    const pagePhase = results.find(r => r.phaseName === 'Page Completeness');
    
    if (!pagePhase || !pagePhase.errors) {
      return [];
    }
    
    // Extract missing pages from error details
    const missingPages: string[] = [];
    for (const error of pagePhase.errors) {
      if (error.details && Array.isArray(error.details.missingRoutes)) {
        missingPages.push(...error.details.missingRoutes);
      }
    }
    
    return missingPages;
  }
  
  /**
   * Save report to a JSON file
   * Requirement: 9.6
   */
  saveToFile(report: ValidationReport, path: string): void {
    try {
      const json = JSON.stringify(report, null, 2);
      writeFileSync(path, json, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save report to ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Print report to console with color coding
   * Requirement: 9.5
   */
  printToConsole(report: ValidationReport, verbose: boolean = false): void {
    console.log('\n' + '='.repeat(60));
    console.log('SYSTEM READINESS VALIDATION REPORT');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Production Ready: ${report.productionReady ? '✓ YES' : '✗ NO'}`);
    console.log('');
    
    // Summary
    console.log('SUMMARY');
    console.log('-'.repeat(60));
    console.log(`Total Phases: ${report.summary.totalPhases}`);
    console.log(`Passed: ${report.summary.passedPhases}`);
    console.log(`Failed: ${report.summary.failedPhases}`);
    console.log(`Warnings: ${report.summary.warnings}`);
    console.log('');
    
    // Phase Results
    console.log('PHASE RESULTS');
    console.log('-'.repeat(60));
    this.printPhaseStatus('Frontend-Backend', report.phases.frontendBackend);
    this.printPhaseStatus('Backend-Database', report.phases.backendDatabase);
    this.printPhaseStatus('Real-Time', report.phases.realTime);
    this.printPhaseStatus('Page Completeness', report.phases.pageCompleteness);
    this.printPhaseStatus('Security', report.phases.security);
    this.printPhaseStatus('Health Endpoint', report.phases.healthEndpoint);
    this.printPhaseStatus('Architecture', report.phases.architecture);
    console.log('');
    
    // Missing Pages
    if (report.missingPages.length > 0) {
      console.log('MISSING PAGES');
      console.log('-'.repeat(60));
      report.missingPages.forEach(page => console.log(`  - ${page}`));
      console.log('');
    }
    
    // Errors
    if (report.errors.length > 0) {
      console.log('ERRORS');
      console.log('-'.repeat(60));
      report.errors.forEach(error => {
        console.log(`  [${error.phase}] ${error.code}: ${error.message}`);
        if (verbose && error.details) {
          console.log(`    Details: ${JSON.stringify(error.details, null, 2)}`);
        }
      });
      console.log('');
    }
    
    // Warnings
    if (report.warnings.length > 0 && verbose) {
      console.log('WARNINGS');
      console.log('-'.repeat(60));
      report.warnings.forEach(warning => {
        console.log(`  [${warning.phase}] ${warning.message}`);
        if (warning.suggestion) {
          console.log(`    Suggestion: ${warning.suggestion}`);
        }
      });
      console.log('');
    }
    
    // Auto-Fix Changes
    if (report.autoFixChanges && report.autoFixChanges.length > 0) {
      console.log('AUTO-FIX CHANGES');
      console.log('-'.repeat(60));
      report.autoFixChanges.forEach(change => {
        console.log(`  [${change.type}] ${change.path}`);
        console.log(`    ${change.description}`);
      });
      console.log('');
    }
    
    console.log('='.repeat(60));
  }
  
  /**
   * Print a single phase status
   */
  private printPhaseStatus(name: string, status: PhaseStatus): void {
    const icon = status.status === 'OK' ? '✓' : status.status === 'FAIL' ? '✗' : '⚠';
    console.log(`  ${icon} ${name}: ${status.message}`);
  }
}
