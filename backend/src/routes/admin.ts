/**
 * Admin Routes
 * 
 * Admin-only endpoints for system management and reporting.
 * Validates Requirements: 36.3, 36.4
 */

import { Router, Request, Response } from 'express';
import { SMSLogRepository } from '../repositories/sms-log/interface.js';
import { SMSLogRepositoryImpl } from '../repositories/sms-log/implementation.js';

// Singleton instance for the repository
let smsLogRepositoryInstance: SMSLogRepository = new SMSLogRepositoryImpl();

/**
 * Set the SMS log repository instance (for testing)
 */
export function setSMSLogRepository(repository: SMSLogRepository): void {
  smsLogRepositoryInstance = repository;
}

/**
 * Get the SMS log repository instance
 */
export function getSMSLogRepository(): SMSLogRepository {
  return smsLogRepositoryInstance;
}

const router = Router();

/**
 * GET /admin/reports/sms-costs
 * 
 * Generate SMS cost report for a date range
 * Requires ADMIN role
 * 
 * Query parameters:
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 * 
 * Returns:
 * - totalMessages: Total number of SMS sent
 * - totalCost: Total cost in KES
 * - successfulMessages: Number of successfully sent messages
 * - failedMessages: Number of failed messages
 * - successRate: Success rate percentage
 * - dateRange: The requested date range
 */
router.get('/reports/sms-costs', async (req: Request, res: Response) => {
  try {
    // TODO: Add authentication middleware to verify ADMIN role
    // For now, we'll proceed without authentication
    
    const { startDate, endDate } = req.query;
    
    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both startDate and endDate are required'
      });
    }
    
    // Parse dates
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Dates must be in ISO format (YYYY-MM-DD)'
      });
    }
    
    if (start > end) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: 'startDate must be before or equal to endDate'
      });
    }
    
    // Generate cost report
    const report = await getSMSLogRepository().generateCostReport({
      startDate: start,
      endDate: end
    });
    
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating SMS cost report:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate SMS cost report'
    });
  }
});

export default router;
