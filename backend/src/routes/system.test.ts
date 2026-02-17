/**
 * System Routes Tests
 * 
 * Tests for system health endpoint
 * Validates Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import systemRoutes from './system.js';
import * as db from '../utils/db.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/system', systemRoutes);

describe('GET /system/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 status for healthy state', async () => {
    // Mock successful database query
    vi.spyOn(db.pool, 'query').mockResolvedValue({
      rows: [{ '?column?': 1 }],
      command: 'SELECT',
      rowCount: 1,
      oid: 0,
      fields: []
    } as any);

    const response = await request(app).get('/system/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });

  it('should include server status in response', async () => {
    vi.spyOn(db.pool, 'query').mockResolvedValue({
      rows: [{ '?column?': 1 }],
      command: 'SELECT',
      rowCount: 1,
      oid: 0,
      fields: []
    } as any);

    const response = await request(app).get('/system/health');

    expect(response.body.server).toBeDefined();
    expect(response.body.server.status).toBe('up');
  });

  it('should include database connection status in response', async () => {
    vi.spyOn(db.pool, 'query').mockResolvedValue({
      rows: [{ '?column?': 1 }],
      command: 'SELECT',
      rowCount: 1,
      oid: 0,
      fields: []
    } as any);

    const response = await request(app).get('/system/health');

    expect(response.body.database).toBeDefined();
    expect(response.body.database.status).toBe('up');
    expect(response.body.database.latency).toBeGreaterThanOrEqual(0);
  });

  it('should include Redis connection status in response', async () => {
    vi.spyOn(db.pool, 'query').mockResolvedValue({
      rows: [{ '?column?': 1 }],
      command: 'SELECT',
      rowCount: 1,
      oid: 0,
      fields: []
    } as any);

    const response = await request(app).get('/system/health');

    expect(response.body.redis).toBeDefined();
    expect(response.body.redis.status).toBeDefined();
  });

  it('should include system uptime in response', async () => {
    vi.spyOn(db.pool, 'query').mockResolvedValue({
      rows: [{ '?column?': 1 }],
      command: 'SELECT',
      rowCount: 1,
      oid: 0,
      fields: []
    } as any);

    const response = await request(app).get('/system/health');

    expect(response.body.uptime).toBeDefined();
    expect(typeof response.body.uptime).toBe('number');
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should include application version in response', async () => {
    vi.spyOn(db.pool, 'query').mockResolvedValue({
      rows: [{ '?column?': 1 }],
      command: 'SELECT',
      rowCount: 1,
      oid: 0,
      fields: []
    } as any);

    const response = await request(app).get('/system/health');

    expect(response.body.version).toBeDefined();
    expect(typeof response.body.version).toBe('string');
  });

  it('should return unhealthy status when database is down', async () => {
    // Mock database connection failure
    vi.spyOn(db.pool, 'query').mockRejectedValue(new Error('Connection refused'));

    const response = await request(app).get('/system/health');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('unhealthy');
    expect(response.body.database.status).toBe('down');
    expect(response.body.database.message).toContain('Connection refused');
  });

  it('should return response structure matching schema', async () => {
    vi.spyOn(db.pool, 'query').mockResolvedValue({
      rows: [{ '?column?': 1 }],
      command: 'SELECT',
      rowCount: 1,
      oid: 0,
      fields: []
    } as any);

    const response = await request(app).get('/system/health');

    // Verify all required fields are present
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('server');
    expect(response.body).toHaveProperty('database');
    expect(response.body).toHaveProperty('redis');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('version');

    // Verify component status structure
    expect(response.body.server).toHaveProperty('status');
    expect(response.body.database).toHaveProperty('status');
    expect(response.body.redis).toHaveProperty('status');
  });
});
