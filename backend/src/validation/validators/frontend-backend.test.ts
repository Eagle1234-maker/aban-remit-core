/**
 * Unit tests for FrontendBackendValidator
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { FrontendBackendValidator } from './frontend-backend.js';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('FrontendBackendValidator', () => {
  let validator: FrontendBackendValidator;
  const baseURL = 'http://localhost:3000';
  const timeout = 5000;
  const testCredentials = {
    username: 'test@example.com',
    password: 'TestPassword123!',
  };

  // Mock axios instance
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    validator = new FrontendBackendValidator(baseURL, timeout, testCredentials);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateAPIConnectivity', () => {
    it('should pass when API is reachable with 200 status', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: {},
      });

      const result = await validator.validateAPIConnectivity();

      expect(result.passed).toBe(true);
      expect(result.message).toBe('API is reachable');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/');
    });

    it('should pass when API returns 404 (server is responding)', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        status: 404,
        data: {},
      });

      const result = await validator.validateAPIConnectivity();

      expect(result.passed).toBe(true);
      expect(result.message).toBe('API is reachable');
    });

    it('should fail when API returns 500+ status', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        status: 500,
        data: {},
      });

      const result = await validator.validateAPIConnectivity();

      expect(result.passed).toBe(false);
      expect(result.message).toBe('API is not reachable');
    });

    it('should fail when API connection fails', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      const result = await validator.validateAPIConnectivity();

      expect(result.passed).toBe(false);
      expect(result.message).toBe('API connection failed');
    });
  });

  describe('validateAuthEndpoints', () => {
    it('should pass when login endpoint returns 200 with token', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: {
          token: 'test-jwt-token',
          user: { id: 1, email: 'test@example.com' },
        },
      });

      const result = await validator.validateAuthEndpoints();

      expect(result.passed).toBe(true);
      expect(result.message).toBe('Authentication endpoints are functional');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', {
        email: testCredentials.username,
        password: testCredentials.password,
      });
    });

    it('should pass when login endpoint returns 201 with accessToken', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        status: 201,
        data: {
          accessToken: 'test-jwt-token',
          user: { id: 1, email: 'test@example.com' },
        },
      });

      const result = await validator.validateAuthEndpoints();

      expect(result.passed).toBe(true);
      expect(result.message).toBe('Authentication endpoints are functional');
    });

    it('should fail when login endpoint returns 401', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        status: 401,
        data: { error: 'Invalid credentials' },
      });

      const result = await validator.validateAuthEndpoints();

      expect(result.passed).toBe(false);
      expect(result.message).toBe('Login endpoint validation failed');
    });

    it('should fail when login endpoint throws error', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Connection refused'));

      const result = await validator.validateAuthEndpoints();

      expect(result.passed).toBe(false);
      expect(result.message).toBe('Authentication endpoint validation failed');
    });
  });

  describe('validateProtectedRoutes', () => {
    it('should pass when protected route returns 401 for unauthorized request', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        status: 401,
        data: { error: 'Unauthorized' },
      });

      const result = await validator.validateProtectedRoutes();

      expect(result.passed).toBe(true);
      expect(result.message).toBe('Protected routes correctly reject unauthorized requests');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/wallet/balance');
    });

    it('should pass when protected route returns 403 for unauthorized request', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        status: 403,
        data: { error: 'Forbidden' },
      });

      const result = await validator.validateProtectedRoutes();

      expect(result.passed).toBe(true);
      expect(result.message).toBe('Protected routes correctly reject unauthorized requests');
    });

    it('should fail when protected route returns 200 without authentication', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: { balance: 1000 },
      });

      const result = await validator.validateProtectedRoutes();

      expect(result.passed).toBe(false);
      expect(result.message).toBe('Protected routes are not properly secured');
    });

    it('should fail when protected route check throws error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      const result = await validator.validateProtectedRoutes();

      expect(result.passed).toBe(false);
      expect(result.message).toBe('Protected route validation failed');
    });
  });

  describe('validateTokenStorage', () => {
    it('should pass when token can be used for authenticated requests', async () => {
      // Mock login response
      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: {
          token: 'test-jwt-token-12345',
          user: { id: 1, email: 'test@example.com' },
        },
      });

      // Mock authenticated request
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: { balance: 1000 },
      });

      const result = await validator.validateTokenStorage();

      expect(result.passed).toBe(true);
      expect(result.message).toBe('Token can be stored and used for authenticated requests');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/wallet/balance', {
        headers: {
          Authorization: 'Bearer test-jwt-token-12345',
        },
      });
    });

    it('should handle case when login does not return token', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: {
          user: { id: 1, email: 'test@example.com' },
          // No token field
        },
      });

      const result = await validator.validateTokenStorage();

      expect(result.passed).toBe(false);
      expect(result.message).toBe('Token storage validation skipped (no token available)');
    });

    it('should pass with warnings when authenticated request returns non-200', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: {
          token: 'test-jwt-token',
        },
      });

      mockAxiosInstance.get.mockResolvedValue({
        status: 404,
        data: { error: 'Not found' },
      });

      const result = await validator.validateTokenStorage();

      expect(result.passed).toBe(true);
      expect(result.message).toBe('Token storage validation completed with warnings');
    });

    it('should fail when token storage validation throws error', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Login failed'));

      const result = await validator.validateTokenStorage();

      expect(result.passed).toBe(false);
      expect(result.message).toBe('Token storage validation failed');
    });
  });

  describe('validateHealthEndpoint', () => {
    it('should pass when health endpoint returns 200', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: {
          status: 'healthy',
          uptime: 12345,
        },
      });

      const result = await validator.validateHealthEndpoint();

      expect(result.passed).toBe(true);
      expect(result.message).toBe('Health endpoint is accessible');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
    });

    it('should fail when health endpoint returns non-200 status', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        status: 503,
        data: { error: 'Service unavailable' },
      });

      const result = await validator.validateHealthEndpoint();

      expect(result.passed).toBe(false);
      expect(result.message).toBe('Health endpoint validation failed');
    });

    it('should fail when health endpoint throws error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Connection timeout'));

      const result = await validator.validateHealthEndpoint();

      expect(result.passed).toBe(false);
      expect(result.message).toBe('Health endpoint check failed');
    });
  });

  describe('execute', () => {
    it('should return PASS status when all checks pass', async () => {
      // Mock all successful responses
      let getCallCount = 0;
      mockAxiosInstance.get.mockImplementation((url: string, config?: any) => {
        if (url === '/') {
          return Promise.resolve({ status: 200, data: {} });
        }
        if (url === '/wallet/balance') {
          // First call: unauthorized (for protected route check)
          // Second call: authorized (for token storage check)
          getCallCount++;
          if (getCallCount === 1 || !config?.headers?.Authorization) {
            return Promise.resolve({ status: 401, data: {} });
          }
          return Promise.resolve({ status: 200, data: { balance: 1000 } });
        }
        if (url === '/health') {
          return Promise.resolve({ status: 200, data: { status: 'healthy' } });
        }
        return Promise.resolve({ status: 404, data: {} });
      });

      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: { token: 'test-token' },
      });

      const result = await validator.execute();

      expect(result.phaseName).toBe('frontendBackend');
      expect(result.status).toBe('PASS');
      expect(result.errors).toHaveLength(0);
    });

    it('should return FAIL status when any check fails', async () => {
      // Mock API connectivity failure
      mockAxiosInstance.get.mockRejectedValue(new Error('Connection failed'));
      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: { token: 'test-token' },
      });

      const result = await validator.execute();

      expect(result.phaseName).toBe('frontendBackend');
      expect(result.status).toBe('FAIL');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return WARN status when there are warnings but no errors', async () => {
      // Mock responses that generate warnings
      mockAxiosInstance.get.mockImplementation((url: string) => {
        if (url === '/') {
          return Promise.resolve({ status: 200, data: {} });
        }
        if (url === '/wallet/balance') {
          return Promise.resolve({ status: 401, data: {} });
        }
        if (url === '/health') {
          return Promise.resolve({ status: 200, data: {} });
        }
        return Promise.resolve({ status: 404, data: {} });
      });

      // Login returns no token (generates warning)
      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: { user: { id: 1 } }, // No token
      });

      const result = await validator.execute();

      expect(result.phaseName).toBe('frontendBackend');
      expect(result.status).toBe('WARN');
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

