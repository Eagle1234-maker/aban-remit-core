/**
 * Core types for the System Readiness Validation tool
 */

export interface ValidationResult {
  passed: boolean;
  message: string;
  details?: any;
}

export interface PhaseResult {
  phaseName: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  errors: ValidationError[];
  warnings: ValidationWarning[];
  duration: number;
}

export interface ValidationError {
  phase: string;
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ValidationWarning {
  phase: string;
  message: string;
  suggestion?: string;
}

export interface ValidationConfig {
  api: {
    baseURL: string;
    timeout: number;
  };
  database: {
    connectionString: string;
  };
  redis?: {
    host: string;
    port: number;
  };
  testCredentials: {
    username: string;
    password: string;
  };
  autoFix: {
    enabled: boolean;
    createMissingPages: boolean;
    fixBrokenAPIs: boolean;
  };
  output: {
    filePath: string;
    format: 'json' | 'text' | 'both';
  };
  phases: {
    frontendBackend: boolean;
    backendDatabase: boolean;
    realTime: boolean;
    pageCompleteness: boolean;
    security: boolean;
    healthEndpoint: boolean;
    architecture: boolean;
    postgresqlProduction: boolean;
  };
  postgresql?: {
    expectedDatabase: string;
    expectedUser: string;
    minPostgresVersion: string;
  };
}

export interface ValidationReport {
  timestamp: string;
  productionReady: boolean;
  summary: {
    totalPhases: number;
    passedPhases: number;
    failedPhases: number;
    warnings: number;
  };
  phases: {
    frontendBackend: PhaseStatus;
    backendDatabase: PhaseStatus;
    realTime: PhaseStatus;
    pageCompleteness: PhaseStatus;
    security: PhaseStatus;
    healthEndpoint: PhaseStatus;
    architecture: PhaseStatus;
    postgresqlProduction: PhaseStatus;
  };
  missingPages: string[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
  autoFixChanges?: AutoFixChange[];
}

export interface PhaseStatus {
  status: 'OK' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

export interface AutoFixChange {
  type: 'CREATE_FILE' | 'UPDATE_FILE' | 'ADD_ROUTE' | 'ADD_NAVIGATION';
  path: string;
  description: string;
}

export interface AutoFixError {
  operation: string;
  path: string;
  error: string;
}

export interface CLIOptions {
  configPath?: string;
  outputPath?: string;
  autoFix?: boolean;
  verbose?: boolean;
  phases?: string[];
}
