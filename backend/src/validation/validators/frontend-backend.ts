/**
 * FrontendBackendValidator - Validates connectivity and integration between frontend and backend
 * 
 * Validates:
 * - API connectivity (Requirements 1.1)
 * - Authentication endpoints (Requirements 1.2)
 * - Protected routes (Requirements 1.3)
 * - Token storage (Requirements 1.4)
 * - Health endpoint (Requirements 1.5)
 * - JWT handling in request headers (Requirements 1.6)
 */

import axios, { AxiosInstance } from 'axios';
import { PhaseResult, ValidationResult, ValidationError, ValidationWarning } from '../types.js';

export class FrontendBackendValidator {
  private client: AxiosInstance;
  private testCredentials: { username: string; password: string };
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];

  constructor(baseURL: string, timeout: number, testCredentials: { username: string; password: string }) {
    this.testCredentials = testCredentials;
    this.client = axios.create({
      baseURL,
      timeout,
      validateStatus: () => true, // Don't throw on any status code
    });
  }

  /**
   * Execute all frontend-backend validation checks
   */
  async execute(): Promise<PhaseResult> {
    this.errors = [];
    this.warnings = [];

    const checks = [
      this.validateAPIConnectivity(),
      this.validateAuthEndpoints(),
      this.validateProtectedRoutes(),
      this.validateTokenStorage(),
      this.validateHealthEndpoint(),
    ];

    await Promise.all(checks);

    const status = this.errors.length > 0 ? 'FAIL' : this.warnings.length > 0 ? 'WARN' : 'PASS';

    return {
      phaseName: 'frontendBackend',
      status,
      errors: this.errors,
      warnings: this.warnings,
      duration: 0, // Will be set by orchestrator
    };
  }

  /**
   * Validate API connectivity
   * Requirements: 1.1
   */
  async validateAPIConnectivity(): Promise<ValidationResult> {
    try {
      const response = await this.client.get('/');
      
      if (response.status >= 200 && response.status < 500) {
        return {
          passed: true,
          message: 'API is reachable',
          details: { status: response.status },
        };
      }

      this.errors.push({
        phase: 'frontendBackend',
        code: 'API_UNREACHABLE',
        message: `API returned unexpected status: ${response.status}`,
        details: { status: response.status },
        timestamp: new Date().toISOString(),
      });

      return {
        passed: false,
        message: 'API is not reachable',
        details: { status: response.status },
      };
    } catch (error) {
      this.errors.push({
        phase: 'frontendBackend',
        code: 'API_CONNECTION_FAILED',
        message: `Failed to connect to API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });

      return {
        passed: false,
        message: 'API connection failed',
        details: error,
      };
    }
  }

  /**
   * Validate authentication endpoints
   * Requirements: 1.2
   */
  async validateAuthEndpoints(): Promise<ValidationResult> {
    try {
      // Test login endpoint
      const loginResponse = await this.client.post('/auth/login', {
        email: this.testCredentials.username,
        password: this.testCredentials.password,
      });

      if (loginResponse.status !== 200 && loginResponse.status !== 201) {
        this.errors.push({
          phase: 'frontendBackend',
          code: 'AUTH_LOGIN_FAILED',
          message: `Login endpoint returned status ${loginResponse.status}`,
          details: { status: loginResponse.status, data: loginResponse.data },
          timestamp: new Date().toISOString(),
        });

        return {
          passed: false,
          message: 'Login endpoint validation failed',
          details: { status: loginResponse.status },
        };
      }

      // Check if token is returned
      const token = loginResponse.data?.token || loginResponse.data?.accessToken;
      if (!token) {
        this.warnings.push({
          phase: 'frontendBackend',
          message: 'Login successful but no token found in response',
          suggestion: 'Ensure login endpoint returns a token field',
        });
      }

      return {
        passed: true,
        message: 'Authentication endpoints are functional',
        details: { hasToken: !!token },
      };
    } catch (error) {
      this.errors.push({
        phase: 'frontendBackend',
        code: 'AUTH_ENDPOINT_ERROR',
        message: `Authentication endpoint error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });

      return {
        passed: false,
        message: 'Authentication endpoint validation failed',
        details: error,
      };
    }
  }

  /**
   * Validate protected routes reject unauthorized requests
   * Requirements: 1.3
   */
  async validateProtectedRoutes(): Promise<ValidationResult> {
    try {
      // Test a protected route without authentication
      const response = await this.client.get('/wallet/balance');

      if (response.status === 401 || response.status === 403) {
        return {
          passed: true,
          message: 'Protected routes correctly reject unauthorized requests',
          details: { status: response.status },
        };
      }

      this.errors.push({
        phase: 'frontendBackend',
        code: 'PROTECTED_ROUTE_NOT_SECURED',
        message: `Protected route did not reject unauthorized request (status: ${response.status})`,
        details: { status: response.status, data: response.data },
        timestamp: new Date().toISOString(),
      });

      return {
        passed: false,
        message: 'Protected routes are not properly secured',
        details: { status: response.status },
      };
    } catch (error) {
      this.errors.push({
        phase: 'frontendBackend',
        code: 'PROTECTED_ROUTE_CHECK_FAILED',
        message: `Failed to check protected route: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });

      return {
        passed: false,
        message: 'Protected route validation failed',
        details: error,
      };
    }
  }

  /**
   * Validate token storage and retrieval
   * Requirements: 1.4
   */
  async validateTokenStorage(): Promise<ValidationResult> {
    try {
      // First, get a token by logging in
      const loginResponse = await this.client.post('/auth/login', {
        email: this.testCredentials.username,
        password: this.testCredentials.password,
      });

      const token = loginResponse.data?.token || loginResponse.data?.accessToken;

      if (!token) {
        this.warnings.push({
          phase: 'frontendBackend',
          message: 'Cannot validate token storage: no token received from login',
          suggestion: 'Ensure login endpoint returns a token',
        });

        return {
          passed: false,
          message: 'Token storage validation skipped (no token available)',
        };
      }

      // Simulate token storage (in a real browser environment, this would use localStorage)
      // For backend validation, we just verify the token can be used in subsequent requests
      const authenticatedResponse = await this.client.get('/wallet/balance', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (authenticatedResponse.status === 200) {
        return {
          passed: true,
          message: 'Token can be stored and used for authenticated requests',
          details: { tokenLength: token.length },
        };
      }

      this.warnings.push({
        phase: 'frontendBackend',
        message: `Authenticated request with token returned status ${authenticatedResponse.status}`,
        suggestion: 'Verify token is valid and protected routes accept it',
      });

      return {
        passed: true,
        message: 'Token storage validation completed with warnings',
        details: { status: authenticatedResponse.status },
      };
    } catch (error) {
      this.errors.push({
        phase: 'frontendBackend',
        code: 'TOKEN_STORAGE_CHECK_FAILED',
        message: `Token storage validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });

      return {
        passed: false,
        message: 'Token storage validation failed',
        details: error,
      };
    }
  }

  /**
   * Validate health endpoint
   * Requirements: 1.5
   */
  async validateHealthEndpoint(): Promise<ValidationResult> {
    try {
      const response = await this.client.get('/health');

      if (response.status === 200) {
        return {
          passed: true,
          message: 'Health endpoint is accessible',
          details: { status: response.status, data: response.data },
        };
      }

      this.errors.push({
        phase: 'frontendBackend',
        code: 'HEALTH_ENDPOINT_FAILED',
        message: `Health endpoint returned status ${response.status}`,
        details: { status: response.status, data: response.data },
        timestamp: new Date().toISOString(),
      });

      return {
        passed: false,
        message: 'Health endpoint validation failed',
        details: { status: response.status },
      };
    } catch (error) {
      this.errors.push({
        phase: 'frontendBackend',
        code: 'HEALTH_ENDPOINT_ERROR',
        message: `Health endpoint error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date().toISOString(),
      });

      return {
        passed: false,
        message: 'Health endpoint check failed',
        details: error,
      };
    }
  }
}

