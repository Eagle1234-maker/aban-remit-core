/**
 * Admin Routes Tests
 * 
 * Tests for admin endpoints including SMS cost reporting.
 * Validates Requirements: 36.3, 36.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import adminRouter, { setSMSLogRepository } from './admin.js';
import { SMSLogRepositoryImpl } from '../repositories/sms-log/implementation.js';

describe('Admin Routes', () => {
  let app: Express;
  let smsLogRepository: SMSLogRepositoryImpl;
  
  beforeEach(async () => {
    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/admin', adminRouter);
    
    // Create and set SMS log repository
    smsLogRepository = new SMSLogRepositoryImpl();
    setSMSLogRepository(smsLogRepository);
    await smsLogRepository.clearAll();
  });
  
  describe('GET /admin/reports/sms-costs', () => {
    it('should return SMS cost report for valid date range', async () => {
      // Create test SMS logs
      await smsLogRepository.createLog({
        recipient: '+254712345678',
        message: 'Test 1',
        cost: 1.5,
        status: 'SENT'
      });
      
      await smsLogRepository.createLog({
        recipient: '+254798765432',
        message: 'Test 2',
        cost: 1.5,
        status: 'SENT'
      });
      
      await smsLogRepository.createLog({
        recipient: '+254712345678',
        message: 'Test 3',
        cost: 1.5,
        status: 'FAILED'
      });
      
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      const response = await request(app)
        .get('/admin/reports/sms-costs')
        .query({ startDate, endDate });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalMessages).toBe(3);
      expect(response.body.data.totalCost).toBe(4.5);
      expect(response.body.data.successfulMessages).toBe(2);
      expect(response.body.data.failedMessages).toBe(1);
      expect(response.body.data.successRate).toBeCloseTo(66.67, 1);
    });
    
    it('should return 400 if startDate is missing', async () => {
      const endDate = new Date().toISOString();
      
      const response = await request(app)
        .get('/admin/reports/sms-costs')
        .query({ endDate });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required parameters');
    });
    
    it('should return 400 if endDate is missing', async () => {
      const startDate = new Date().toISOString();
      
      const response = await request(app)
        .get('/admin/reports/sms-costs')
        .query({ startDate });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required parameters');
    });
    
    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/admin/reports/sms-costs')
        .query({ startDate: 'invalid-date', endDate: '2024-01-01' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid date format');
    });
    
    it('should return 400 if startDate is after endDate', async () => {
      const startDate = new Date('2024-12-31').toISOString();
      const endDate = new Date('2024-01-01').toISOString();
      
      const response = await request(app)
        .get('/admin/reports/sms-costs')
        .query({ startDate, endDate });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid date range');
    });
    
    it('should return empty report for date range with no SMS logs', async () => {
      const startDate = new Date('2020-01-01').toISOString();
      const endDate = new Date('2020-01-02').toISOString();
      
      const response = await request(app)
        .get('/admin/reports/sms-costs')
        .query({ startDate, endDate });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalMessages).toBe(0);
      expect(response.body.data.totalCost).toBe(0);
      expect(response.body.data.successRate).toBe(0);
    });
    
    it('should support date filtering', async () => {
      // Create logs
      await smsLogRepository.createLog({
        recipient: '+254712345678',
        message: 'Test 1',
        cost: 1.0,
        status: 'SENT'
      });
      
      // Query with future date range (should not include the log)
      const startDate = new Date(Date.now() + 1000).toISOString();
      const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      const response = await request(app)
        .get('/admin/reports/sms-costs')
        .query({ startDate, endDate });
      
      expect(response.status).toBe(200);
      expect(response.body.data.totalMessages).toBe(0);
    });
  });
});
