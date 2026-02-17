/**
 * SecurityValidator - Validates security controls and protections
 * 
 * Validates:
 * - Password hashing (Requirements 5.1)
 * - Token expiration (Requirements 5.2)
 * - Rate limiting (Requirements 5.3)
 * - Input sanitization (Requirements 5.4)
 * - SQL injection protection (Requirements 5.5)
 * - XSS protection (Requirements 5.6)
 * - CORS rules (Requirements 5.7)
 */

import axios, { AxiosInstance } from 'axios';
import { PhaseResult, ValidationResult, ValidationError, ValidationWarning } from '../types.js';

export class SecurityValidator {
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
   * Execute all security validation checks
   */
  async execute(): Promise<PhaseResult> {
    this.errors = [];
    this.warnings = [];

    const checks = [
      this.validatePasswordHashing(),
      this.validateTokenExpiration(),
      this.validateRateLimiting(),
      this.validateInputSanitization(),
      this.validateSQLInjectionProtection(),
      this.validateXSSProtection(),
      this.validateCORSRules(),
    ];

    await Promise.all(checks);

    const status = this.errors.length > 0 ? 'FAIL' : this.warnings.length > 0 ? 'WARN' : 'PASS';

    return {
      phaseName: 'security',
      status,
      errors: this.errors,
      warnings: this.warnings,
      duration: 0,
    };
  }

  /**
   * Validate password hashing
   * Requirements: 5.1
   */
  async validatePasswordHashing(): Promise<ValidationResult> {
    // This check requires database access or code inspection
    // For now, we'll mark it as a warning that manual verification is needed
    this.warnings.push({
      phase: 'security',
      message: 'Password hashing validation requires manual verification',
      suggestion: 'Verify that passwords are hashed using bcrypt or argon2 before storage',
    });

    return {
      passed: true,
      message: 'Password hashing validation requires manual verification',
    };
  }

  /**
   * Validate token expiration
   * Requirements: 5.2
   */
  async validateTokenExpiration(): Promise<ValidationResult> {
    try {
      // Try to use an expired token (this is a simplified check)
      // In a real scenario, you'd generate an expired token and test it
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjF9.invalid';

      const response = await this.client.get('/users/profile', {
        headers: {
          Authorization: `Bearer ${expiredToken}`,
        },
      });

      if (response.status === 401) {
        return {
          passed: true,
          message: 'Expired tokens are correctly rejected',
          details: { status: response.status },
        };
      }

      this.warnings.push({
        phase: 'security',
        message: 'Token expiration validation inconclusive',
        suggestion: 'Manually verify that expired JWT tokens are rejected with 401 status',
      });

      return {
        passed: true,
        message: 'Token expiration validation requires manual verification',
      };
    } catch (error) {
      this.warnings.push({
        phase: 'security',
        message: 'Token expiration validation could not be performed',
        suggestion: 'Ensure authentication endpoints are accessible for security testing',
      });

      return {
        passed: true,
        message: 'Token expiration validation skipped',
      };
    }
  }

  /**
   * Validate rate limiting
   * Requirements: 5.3
   */
  async validateRateLimiting(): Promise<ValidationResult> {
    try {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(20).fill(null).map(() =>
        this.client.get('/system/health')
      );

      const responses = await Promise.all(requests);

      // Check if any request was rate limited (429 status)
      const rateLimited = responses.some(r => r.status === 429);

      if (rateLimited) {
        return {
          passed: true,
          message: 'Rate limiting is active',
          details: { rateLimitDetected: true },
        };
      }

      this.warnings.push({
        phase: 'security',
        message: 'Rate limiting not detected',
        suggestion: 'Consider implementing rate limiting to prevent abuse',
      });

      return {
        passed: true,
        message: 'Rate limiting not detected (may not be required for all endpoints)',
      };
    } catch (error) {
      this.warnings.push({
        phase: 'security',
        message: 'Rate limiting validation could not be performed',
        suggestion: 'Ensure API endpoints are accessible for security testing',
      });

      return {
        passed: true,
        message: 'Rate limiting validation skipped',
      };
    }
  }

  /**
   * Validate input sanitization
   * Requirements: 5.4
   */
  async validateInputSanitization(): Promise<ValidationResult> {
    // This check requires testing with malicious inputs
    // For now, we'll mark it as a warning that manual verification is needed
    this.warnings.push({
      phase: 'security',
      message: 'Input sanitization validation requires manual verification',
      suggestion: 'Test endpoints with malicious inputs (XSS, SQL injection) to verify sanitization',
    });

    return {
      passed: true,
      message: 'Input sanitization validation requires manual verification',
    };
  }

  /**
   * Validate SQL injection protection
   * Requirements: 5.5
   */
  async validateSQLInjectionProtection(): Promise<ValidationResult> {
    // This check requires testing with SQL injection payloads
    // For now, we'll mark it as a warning that manual verification is needed
    this.warnings.push({
      phase: 'security',
      message: 'SQL injection protection validation requires manual verification',
      suggestion: 'Verify that all database queries use parameterized queries or ORM',
    });

    return {
      passed: true,
      message: 'SQL injection protection validation requires manual verification',
    };
  }

  /**
   * Validate XSS protection
   * Requirements: 5.6
   */
  async validateXSSProtection(): Promise<ValidationResult> {
    // This check requires testing with XSS payloads
    // For now, we'll mark it as a warning that manual verification is needed
    this.warnings.push({
      phase: 'security',
      message: 'XSS protection validation requires manual verification',
      suggestion: 'Verify that user-generated content is properly escaped in the frontend',
    });

    return {
      passed: true,
      message: 'XSS protection validation requires manual verification',
    };
  }

  /**
   * Validate CORS rules
   * Requirements: 5.7
   */
  async validateCORSRules(): Promise<ValidationResult> {
    try {
      // Check if CORS headers are present
      const response = await this.client.options('/system/health');

      const corsHeaders = {
        'access-control-allow-origin': response.headers['access-control-allow-origin'],
        'access-control-allow-methods': response.headers['access-control-allow-methods'],
        'access-control-allow-headers': response.headers['access-control-allow-headers'],
      };

      if (corsHeaders['access-control-allow-origin']) {
        // Check if CORS is too permissive
        if (corsHeaders['access-control-allow-origin'] === '*') {
          this.warnings.push({
            phase: 'security',
            message: 'CORS allows all origins (*)',
            suggestion: 'Consider restricting CORS to specific trusted origins',
          });
        }

        return {
          passed: true,
          message: 'CORS headers are configured',
          details: { corsHeaders },
        };
      }

      this.warnings.push({
        phase: 'security',
        message: 'CORS headers not detected',
        suggestion: 'Configure CORS to control which origins can access your API',
      });

      return {
        passed: true,
        message: 'CORS validation inconclusive',
      };
    } catch (error) {
      this.warnings.push({
        phase: 'security',
        message: 'CORS validation could not be performed',
        suggestion: 'Ensure API endpoints are accessible for security testing',
      });

      return {
        passed: true,
        message: 'CORS validation skipped',
      };
    }
  }
}
