/**
 * HealthEndpointValidator - Validates system health endpoint
 * 
 * Validates:
 * - Endpoint existence (Requirements 6.1)
 * - Response structure (Requirements 6.2)
 * - Component status (Requirements 6.3, 6.4, 6.5, 6.6, 6.7)
 */

import axios, { AxiosInstance } from 'axios';
import { PhaseResult, ValidationResult, ValidationError, ValidationWarning } from '../types.js';

export class HealthEndpointValidator {
  private client: AxiosInstance;
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];

  constructor(baseURL: string, timeout: number) {
    this.client = axios.create({
      baseURL,
      timeout,
      validateStatus: () => true, // Don't throw on any status code
    });
  }

  /**
   * Execute all health endpoint validation checks
   */
  async execute(): Promise<PhaseResult> {
    this.errors = [];
    this.warnings = [];

    await this.validateEndpointExists();
    await this.validateResponseStructure();

    const status = this.errors.length > 0 ? 'FAIL' : this.warnings.length > 0 ? 'WARN' : 'PASS';

    return {
      phaseName: 'healthEndpoint',
      status,
      errors: this.errors,
      warnings: this.warnings,
      duration: 0, // Will be set by orchestrator
    };
  }

  /**
   * Validate health endpoint exists and returns 200
   * Requirements: 6.1
   */
  async validateEndpointExists(): Promise<ValidationResult> {
    try {
      const response = await this.client.get('/system/health');

      if (response.status === 200) {
        return {
          passed: true,
          message: 'Health endpoint is accessible',
          details: { status: response.status },
        };
      }

      this.errors.push({
        phase: 'healthEndpoint',
        code: 'HEALTH_ENDPOINT_NOT_OK',
        message: `Health endpoint returned status ${response.status} instead of 200`,
        details: { status: response.status },
        timestamp: new Date().toISOString(),
      });

      return {
        passed: false,
        message: 'Health endpoint not accessible',
        details: { status: response.status },
      };
    } catch (error) {
      this.errors.push({
        phase: 'healthEndpoint',
        code: 'HEALTH_ENDPOINT_UNREACHABLE',
        message: `Health endpoint unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });

      return {
        passed: false,
        message: 'Health endpoint unreachable',
        details: error,
      };
    }
  }

  /**
   * Validate health endpoint response structure
   * Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
   */
  async validateResponseStructure(): Promise<ValidationResult> {
    try {
      const response = await this.client.get('/system/health');

      if (response.status !== 200) {
        // Already reported in validateEndpointExists
        return {
          passed: false,
          message: 'Cannot validate response structure (endpoint not accessible)',
        };
      }

      const data = response.data;

      // Check required fields
      const requiredFields = ['status', 'server', 'database', 'uptime', 'version'];
      const missingFields = requiredFields.filter(field => !(field in data));

      if (missingFields.length > 0) {
        this.errors.push({
          phase: 'healthEndpoint',
          code: 'HEALTH_RESPONSE_INCOMPLETE',
          message: `Health endpoint response missing required fields: ${missingFields.join(', ')}`,
          details: { missingFields, response: data },
          timestamp: new Date().toISOString(),
        });

        return {
          passed: false,
          message: 'Health endpoint response structure incomplete',
          details: { missingFields },
        };
      }

      // Validate status field
      const validStatuses = ['healthy', 'degraded', 'unhealthy'];
      if (!validStatuses.includes(data.status)) {
        this.warnings.push({
          phase: 'healthEndpoint',
          message: `Health status '${data.status}' is not one of the expected values: ${validStatuses.join(', ')}`,
          suggestion: 'Use standard health status values: healthy, degraded, or unhealthy',
        });
      }

      // Validate component statuses
      const components = ['server', 'database'];
      for (const component of components) {
        if (data[component] && typeof data[component] === 'object') {
          if (!('status' in data[component])) {
            this.warnings.push({
              phase: 'healthEndpoint',
              message: `Component '${component}' missing status field`,
              suggestion: 'Each component should have a status field (up/down)',
            });
          }
        }
      }

      return {
        passed: true,
        message: 'Health endpoint response structure is valid',
        details: { response: data },
      };
    } catch (error) {
      // Already reported in validateEndpointExists
      return {
        passed: false,
        message: 'Cannot validate response structure',
        details: error,
      };
    }
  }
}
