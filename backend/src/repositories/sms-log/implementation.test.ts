/**
 * Unit tests for SMS Log Repository Implementation
 * Validates Requirements: 36.1, 36.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SMSLogRepositoryImpl } from './implementation.js';
import { SMSLogInput } from './interface.js';

describe('SMSLogRepositoryImpl', () => {
  let repository: SMSLogRepositoryImpl;

  beforeEach(async () => {
    repository = new SMSLogRepositoryImpl();
    await repository.clearAll();
  });

  describe('createLog', () => {
    it('should create SMS log with all required fields', async () => {
      const input: SMSLogInput = {
        recipient: '+254712345678',
        message: 'Test SMS message',
        cost: 0.05,
        status: 'SENT',
        providerMessageId: 'MSG123456'
      };

      const result = await repository.createLog(input);

      expect(result.id).toBeDefined();
      expect(result.recipient).toBe(input.recipient);
      expect(result.message).toBe(input.message);
      expect(result.cost).toBe(input.cost);
      expect(result.status).toBe(input.status);
      expect(result.providerMessageId).toBe(input.providerMessageId);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should create SMS log without optional fields', async () => {
      const input: SMSLogInput = {
        recipient: '+254712345678',
        message: 'Test SMS message',
        cost: 0.05,
        status: 'PENDING'
      };

      const result = await repository.createLog(input);

      expect(result.id).toBeDefined();
      expect(result.recipient).toBe(input.recipient);
      expect(result.message).toBe(input.message);
      expect(result.cost).toBe(input.cost);
      expect(result.status).toBe(input.status);
      expect(result.providerMessageId).toBeUndefined();
      expect(result.errorMessage).toBeUndefined();
    });

    it('should create SMS log with error message for failed status', async () => {
      const input: SMSLogInput = {
        recipient: '+254712345678',
        message: 'Test SMS message',
        cost: 0.05,
        status: 'FAILED',
        errorMessage: 'Network timeout'
      };

      const result = await repository.createLog(input);

      expect(result.status).toBe('FAILED');
      expect(result.errorMessage).toBe('Network timeout');
    });

    it('should generate unique IDs for multiple logs', async () => {
      const input1: SMSLogInput = {
        recipient: '+254712345678',
        message: 'Message 1',
        cost: 0.05,
        status: 'SENT'
      };

      const input2: SMSLogInput = {
        recipient: '+254798765432',
        message: 'Message 2',
        cost: 0.05,
        status: 'SENT'
      };

      const result1 = await repository.createLog(input1);
      const result2 = await repository.createLog(input2);

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('updateStatus', () => {
    it('should update SMS log status to SENT', async () => {
      const input: SMSLogInput = {
        recipient: '+254712345678',
        message: 'Test SMS message',
        cost: 0.05,
        status: 'PENDING'
      };

      const created = await repository.createLog(input);
      const updated = await repository.updateStatus(created.id, 'SENT');

      expect(updated.id).toBe(created.id);
      expect(updated.status).toBe('SENT');
      expect(updated.recipient).toBe(created.recipient);
    });

    it('should update SMS log status to FAILED with error message', async () => {
      const input: SMSLogInput = {
        recipient: '+254712345678',
        message: 'Test SMS message',
        cost: 0.05,
        status: 'PENDING'
      };

      const created = await repository.createLog(input);
      const updated = await repository.updateStatus(created.id, 'FAILED', 'SMS gateway error');

      expect(updated.status).toBe('FAILED');
      expect(updated.errorMessage).toBe('SMS gateway error');
    });

    it('should throw error for non-existent SMS log', async () => {
      await expect(
        repository.updateStatus('non-existent-id', 'SENT')
      ).rejects.toThrow('SMS log not found: non-existent-id');
    });
  });

  describe('findByDateRange', () => {
    it('should find SMS logs within date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const input: SMSLogInput = {
        recipient: '+254712345678',
        message: 'Test SMS message',
        cost: 0.05,
        status: 'SENT'
      };

      await repository.createLog(input);

      const logs = await repository.findByDateRange({
        startDate: yesterday,
        endDate: tomorrow
      });

      expect(logs).toHaveLength(1);
      expect(logs[0].recipient).toBe(input.recipient);
    });

    it('should return empty array for date range with no logs', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const logs = await repository.findByDateRange({
        startDate: twoDaysAgo,
        endDate: yesterday
      });

      expect(logs).toHaveLength(0);
    });
  });

  describe('findByRecipient', () => {
    it('should find SMS logs for specific recipient', async () => {
      const recipient1 = '+254712345678';
      const recipient2 = '+254798765432';

      const input1: SMSLogInput = {
        recipient: recipient1,
        message: 'Message for recipient 1',
        cost: 0.05,
        status: 'SENT'
      };

      const input2: SMSLogInput = {
        recipient: recipient2,
        message: 'Message for recipient 2',
        cost: 0.05,
        status: 'SENT'
      };

      const input3: SMSLogInput = {
        recipient: recipient1,
        message: 'Another message for recipient 1',
        cost: 0.05,
        status: 'FAILED'
      };

      await repository.createLog(input1);
      await repository.createLog(input2);
      await repository.createLog(input3);

      const logs = await repository.findByRecipient(recipient1);

      expect(logs).toHaveLength(2);
      expect(logs.every(log => log.recipient === recipient1)).toBe(true);
    });

    it('should return empty array for recipient with no logs', async () => {
      const logs = await repository.findByRecipient('+254700000000');

      expect(logs).toHaveLength(0);
    });
  });

  describe('generateCostReport', () => {
    it('should generate cost report with correct statistics', async () => {
      // Create test logs
      await repository.createLog({
        recipient: '+254712345678',
        message: 'Test 1',
        cost: 1.5,
        status: 'SENT'
      });
      
      await repository.createLog({
        recipient: '+254798765432',
        message: 'Test 2',
        cost: 1.5,
        status: 'SENT'
      });
      
      await repository.createLog({
        recipient: '+254712345678',
        message: 'Test 3',
        cost: 1.5,
        status: 'FAILED'
      });
      
      const dateRange = {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      };
      
      const report = await repository.generateCostReport(dateRange);
      
      expect(report.totalMessages).toBe(3);
      expect(report.totalCost).toBe(4.5);
      expect(report.successfulMessages).toBe(2);
      expect(report.failedMessages).toBe(1);
      expect(report.successRate).toBeCloseTo(66.67, 1);
      expect(report.dateRange).toEqual(dateRange);
    });
    
    it('should return zero statistics for empty date range', async () => {
      const dateRange = {
        startDate: new Date('2020-01-01'),
        endDate: new Date('2020-01-02')
      };
      
      const report = await repository.generateCostReport(dateRange);
      
      expect(report.totalMessages).toBe(0);
      expect(report.totalCost).toBe(0);
      expect(report.successfulMessages).toBe(0);
      expect(report.failedMessages).toBe(0);
      expect(report.successRate).toBe(0);
    });
    
    it('should calculate 100% success rate when all messages sent', async () => {
      await repository.createLog({
        recipient: '+254712345678',
        message: 'Test 1',
        cost: 1.0,
        status: 'SENT'
      });
      
      await repository.createLog({
        recipient: '+254798765432',
        message: 'Test 2',
        cost: 1.0,
        status: 'SENT'
      });
      
      const dateRange = {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      
      const report = await repository.generateCostReport(dateRange);
      
      expect(report.successRate).toBe(100);
    });
    
    it('should calculate 0% success rate when all messages failed', async () => {
      await repository.createLog({
        recipient: '+254712345678',
        message: 'Test 1',
        cost: 1.0,
        status: 'FAILED',
        errorMessage: 'Error 1'
      });
      
      await repository.createLog({
        recipient: '+254798765432',
        message: 'Test 2',
        cost: 1.0,
        status: 'FAILED',
        errorMessage: 'Error 2'
      });
      
      const dateRange = {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      
      const report = await repository.generateCostReport(dateRange);
      
      expect(report.successRate).toBe(0);
      expect(report.failedMessages).toBe(2);
    });
    
    it('should only include logs within specified date range', async () => {
      // Create a log
      await repository.createLog({
        recipient: '+254712345678',
        message: 'Test 1',
        cost: 1.0,
        status: 'SENT'
      });
      
      const dateRange = {
        startDate: new Date(Date.now() + 1000), // Future start date
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      
      const report = await repository.generateCostReport(dateRange);
      
      // Should not include the log created before the start date
      expect(report.totalMessages).toBe(0);
    });
  });
});
