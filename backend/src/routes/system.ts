/**
 * System Routes
 * 
 * System health and monitoring endpoints.
 * Validates Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import { Router, Request, Response } from 'express';
import { pool } from '../utils/db.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = Router();

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Track server start time for uptime calculation
const serverStartTime = Date.now();

interface ComponentStatus {
  status: 'up' | 'down';
  latency?: number;
  message?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  server: ComponentStatus;
  database: ComponentStatus;
  redis: ComponentStatus;
  uptime: number;
  version: string;
}

/**
 * GET /system/health
 * 
 * Comprehensive system health check endpoint
 * Returns status of all system components
 * 
 * Requirements:
 * - 6.1: Expose GET /system/health endpoint
 * - 6.2: Return HTTP 200 for healthy state
 * - 6.3: Include server status
 * - 6.4: Include database connection status
 * - 6.5: Include Redis connection status
 * - 6.6: Include system uptime
 * - 6.7: Include application version
 */
router.get('/health', async (req: Request, res: Response) => {
  const healthResponse: HealthResponse = {
    status: 'healthy',
    server: { status: 'up' },
    database: { status: 'down' },
    redis: { status: 'down', message: 'Not configured' },
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    version: getApplicationVersion()
  };

  // Check database connection
  try {
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;
    
    healthResponse.database = {
      status: 'up',
      latency: dbLatency
    };
  } catch (error) {
    healthResponse.database = {
      status: 'down',
      message: error instanceof Error ? error.message : 'Database connection failed'
    };
    healthResponse.status = 'unhealthy';
  }

  // Check Redis connection (if configured)
  if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
    try {
      // TODO: Implement Redis health check when Redis is integrated
      healthResponse.redis = {
        status: 'down',
        message: 'Redis health check not implemented'
      };
      if (healthResponse.status === 'healthy') {
        healthResponse.status = 'degraded';
      }
    } catch (error) {
      healthResponse.redis = {
        status: 'down',
        message: error instanceof Error ? error.message : 'Redis connection failed'
      };
      if (healthResponse.status === 'healthy') {
        healthResponse.status = 'degraded';
      }
    }
  }

  // Always return 200 for graceful degradation
  // Frontend can check the status field to determine actual health
  res.status(200).json(healthResponse);
});

/**
 * Get application version from package.json
 */
function getApplicationVersion(): string {
  try {
    // Navigate up from routes directory to backend root
    const packageJsonPath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version || '0.0.0';
  } catch (error) {
    return 'unknown';
  }
}

export default router;
