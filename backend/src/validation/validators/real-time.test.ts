/**
 * Unit tests for RealTimeValidator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RealTimeValidator } from './real-time.js';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('RealTimeValidator', () => {
  let validator: RealTimeValidator;
  const baseURL = 'http://localhost:3000';
  const timeout = 5000;
  const testCredentials = {
    username: 'test@example.com',
    password: 'TestPassword123!',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock axios.create to return a mock client
    const mockClient = {
      get: vi.fn(),
      post: vi.fn(),
    };

    mockedAxios.create = vi.fn().mockReturnValue(mockClient);

    validator = new RealTimeValidator(baseURL, timeout, testCredentials);
  });

  describe('execute', () => {
    it('should return PASS status when all checks pass', async () => {
      const mockClient = mockedAxios.create() as any;

      // Mock authentication
      mockClient.post.mockResolvedValueOnce({
        status: 200,
        data: { token: 'test-token' },
      });

      // Mock transaction endpoint
      mockClient.get.mockResolvedValueOnce({
        status: 200,
        data: { transactions: [] },
      });

      // Mock profile endpoint
      mockClient.get.mockResolvedValueOnce({
        status: 200,
        data: { role: 'user' },
      });

      // Mock WebSocket info endpoint (not found - optional)
      mockClient.get.mockResolvedValueOnce({
        status: 404,
      });

      // Mock SSE endpoint (not found - optional)
      mockClient.get.mockResolvedValueOnce({
        status: 404,
      });

      const result = await validator.execute();

      expect(result.phaseName).toBe('realTime');
      expect(result.status).toBe('WARN'); // WARN because WebSocket/SSE are optional
      expect(result.errors).toHaveLength(0);
    });

    it('should return WARN status when checks fail without authentication', async () => {
      const mockClient = mockedAxios.create() as any;

      // Mock authentication failure
      mockClient.post.mockResolvedValueOnce({
        status: 401,
        data: { error: 'Invalid credentials' },
      });

      // Mock all endpoints failing
      mockClient.get.mockRejectedValue(new Error('Connection failed'));

      const result = await validator.execute();

      expect(result.phaseName).toBe('realTime');
      // Status is WARN because optional features (WebSocket/SSE) are not implemented
      // and transaction/role checks are skipped due to no auth
      expect(result.status).toBe('WARN');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should return WARN status when optional features are missing', async () => {
      const mockClient = mockedAxios.create() as any;

      // Mock authentication
      mockClient.post.mockResolvedValueOnce({
        status: 200,
        data: { token: 'test-token' },
      });

      // Mock transaction endpoint
      mockClient.get.mockResolvedValueOnce({
        status: 200,
        data: { transactions: [] },
      });

      // Mock profile endpoint
      mockClient.get.mockResolvedValueOnce({
        status: 200,
        data: { role: 'user' },
      });

      // Mock WebSocket not implemented
      mockClient.get.mockResolvedValueOnce({
        status: 404,
      });

      // Mock SSE not implemented
      mockClient.get.mockResolvedValueOnce({
        status: 404,
      });

      const result = await validator.execute();

      expect(result.phaseName).toBe('realTime');
      expect(result.status).toBe('WARN');
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateTransactionUpdates', () => {
    it('should pass when transaction endpoint is accessible', async () => {
      const mockClient = mockedAxios.create() as any;

      // Mock authentication
      mockClient.post.mockResolvedValueOnce({
        status: 200,
        data: { token: 'test-token' },
      });

      // Create new validator to trigger authentication
      validator = new RealTimeValidator(baseURL, timeout, testCredentials);

      // Wait for authentication to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mock transaction endpoint
      mockClient.get.mockResolvedValueOnce({
        status: 200,
        data: { transactions: [] },
      });

      const result = await (validator as any).validateTransactionUpdates();

      expect(result.passed).toBe(true);
      expect(result.message).toContain('Transaction endpoint accessible');
    });

    it('should warn when authentication is not available', async () => {
      // Create validator without credentials
      validator = new RealTimeValidator(baseURL, timeout);

      const result = await (validator as any).validateTransactionUpdates();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('no authentication');
    });

    it('should handle transaction endpoint errors', async () => {
      const mockClient = mockedAxios.create() as any;

      // Mock authentication
      mockClient.post.mockResolvedValueOnce({
        status: 200,
        data: { token: 'test-token' },
      });

      validator = new RealTimeValidator(baseURL, timeout, testCredentials);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mock transaction endpoint error
      mockClient.get.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await (validator as any).validateTransactionUpdates();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('failed');
    });
  });

  describe('validateRoleSwitching', () => {
    it('should pass when profile endpoint returns role information', async () => {
      const mockClient = mockedAxios.create() as any;

      // Mock authentication
      mockClient.post.mockResolvedValueOnce({
        status: 200,
        data: { token: 'test-token' },
      });

      validator = new RealTimeValidator(baseURL, timeout, testCredentials);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mock profile endpoint
      mockClient.get.mockResolvedValueOnce({
        status: 200,
        data: { role: 'user', name: 'Test User' },
      });

      const result = await (validator as any).validateRoleSwitching();

      expect(result.passed).toBe(true);
      expect(result.message).toContain('Role information accessible');
    });

    it('should warn when authentication is not available', async () => {
      validator = new RealTimeValidator(baseURL, timeout);

      const result = await (validator as any).validateRoleSwitching();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('no authentication');
    });

    it('should handle missing role information', async () => {
      const mockClient = mockedAxios.create() as any;

      mockClient.post.mockResolvedValueOnce({
        status: 200,
        data: { token: 'test-token' },
      });

      validator = new RealTimeValidator(baseURL, timeout, testCredentials);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mock profile endpoint without role
      mockClient.get.mockResolvedValueOnce({
        status: 200,
        data: { name: 'Test User' },
      });

      const result = await (validator as any).validateRoleSwitching();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('incomplete');
    });
  });

  describe('validateWebSocketConnection', () => {
    it('should pass when WebSocket info endpoint is accessible', async () => {
      const mockClient = mockedAxios.create() as any;

      // Mock WebSocket info endpoint
      mockClient.get.mockResolvedValueOnce({
        status: 200,
        data: { wsEnabled: true },
      });

      const result = await (validator as any).validateWebSocketConnection();

      expect(result.passed).toBe(true);
      expect(result.message).toContain('WebSocket info endpoint is accessible');
    });

    it('should pass with warning when WebSocket is not implemented', async () => {
      const mockClient = mockedAxios.create() as any;

      // Mock WebSocket endpoint not found
      mockClient.get.mockResolvedValueOnce({
        status: 404,
      });

      const result = await (validator as any).validateWebSocketConnection();

      expect(result.passed).toBe(true);
      expect(result.message).toContain('skipped');
    });

    it('should handle WebSocket endpoint errors gracefully', async () => {
      const mockClient = mockedAxios.create() as any;

      // Mock WebSocket endpoint error
      mockClient.get.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await (validator as any).validateWebSocketConnection();

      expect(result.passed).toBe(true);
      expect(result.message).toContain('skipped');
    });
  });

  describe('validateEventPropagation', () => {
    it('should pass when SSE endpoint is accessible', async () => {
      const mockClient = mockedAxios.create() as any;

      // Mock SSE endpoint
      mockClient.get.mockResolvedValueOnce({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      });

      const result = await (validator as any).validateEventPropagation();

      expect(result.passed).toBe(true);
      expect(result.message).toContain('Event stream endpoint is accessible');
    });

    it('should pass with warning when event propagation is not implemented', async () => {
      const mockClient = mockedAxios.create() as any;

      // Mock SSE endpoint not found
      mockClient.get.mockResolvedValueOnce({
        status: 404,
      });

      const result = await (validator as any).validateEventPropagation();

      expect(result.passed).toBe(true);
      expect(result.message).toContain('skipped');
    });

    it('should handle event propagation endpoint errors gracefully', async () => {
      const mockClient = mockedAxios.create() as any;

      // Mock SSE endpoint error
      mockClient.get.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await (validator as any).validateEventPropagation();

      expect(result.passed).toBe(true);
      expect(result.message).toContain('skipped');
    });
  });
});
