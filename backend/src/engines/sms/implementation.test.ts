/**
 * SMS Engine Implementation Tests
 * 
 * Tests for SMS sending and logging functionality.
 * Validates Requirements: 36.1, 36.2, 36.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SMSEngineImpl } from './implementation.js';
import { SMSLogRepositoryImpl } from '../../repositories/sms-log/implementation.js';

describe('SMSEngineImpl', () => {
  let smsEngine: SMSEngineImpl;
  let smsLogRepository: SMSLogRepositoryImpl;
  
  beforeEach(() => {
    smsLogRepository = new SMSLogRepositoryImpl();
    smsEngine = new SMSEngineImpl(smsLogRepository, 1.5);
  });
  
  describe('sendSMS', () => {
    it('should send SMS and log with SENT status for valid phone', async () => {
      const recipient = '+254712345678';
      const message = 'Test message';
      
      const result = await smsEngine.sendSMS(recipient, message);
      
      expect(result.recipient).toBe(recipient);
      expect(result.message).toBe(message);
      expect(result.status).toBe('SENT');
      expect(result.cost).toBe(1.5);
      expect(result.providerMessageId).toBeDefined();
      expect(result.providerMessageId).toMatch(/^SMS-/);
      expect(result.errorMessage).toBeUndefined();
    });
    
    it('should send SMS and log with FAILED status for invalid phone', async () => {
      const recipient = '+1234567890'; // Invalid format
      const message = 'Test message';
      
      const result = await smsEngine.sendSMS(recipient, message);
      
      expect(result.recipient).toBe(recipient);
      expect(result.message).toBe(message);
      expect(result.status).toBe('FAILED');
      expect(result.cost).toBe(1.5);
      expect(result.providerMessageId).toBeUndefined();
      expect(result.errorMessage).toBe('Invalid phone number format');
    });
    
    it('should log all SMS attempts to repository', async () => {
      const recipient = '+254712345678';
      const message = 'Test message';
      
      await smsEngine.sendSMS(recipient, message);
      
      const logs = await smsLogRepository.findByRecipient(recipient);
      expect(logs).toHaveLength(1);
      expect(logs[0].recipient).toBe(recipient);
      expect(logs[0].message).toBe(message);
      expect(logs[0].status).toBe('SENT');
      expect(logs[0].cost).toBe(1.5);
    });
    
    it('should log multiple SMS attempts', async () => {
      await smsEngine.sendSMS('+254712345678', 'Message 1');
      await smsEngine.sendSMS('+254798765432', 'Message 2');
      await smsEngine.sendSMS('+254712345678', 'Message 3');
      
      const logs1 = await smsLogRepository.findByRecipient('+254712345678');
      const logs2 = await smsLogRepository.findByRecipient('+254798765432');
      
      expect(logs1).toHaveLength(2);
      expect(logs2).toHaveLength(1);
    });
  });
  
  describe('sendOTP', () => {
    it('should send OTP SMS with correct format', async () => {
      const recipient = '+254712345678';
      const code = '123456';
      
      const result = await smsEngine.sendOTP(recipient, code);
      
      expect(result.recipient).toBe(recipient);
      expect(result.message).toBe('Your ABAN verification code is 123456. Valid for 5 minutes.');
      expect(result.status).toBe('SENT');
      expect(result.cost).toBe(1.5);
    });
    
    it('should log OTP SMS attempts', async () => {
      const recipient = '+254712345678';
      const code = '123456';
      
      await smsEngine.sendOTP(recipient, code);
      
      const logs = await smsLogRepository.findByRecipient(recipient);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('verification code');
      expect(logs[0].message).toContain(code);
    });
  });
  
  describe('sendTransactionNotification', () => {
    it('should send transaction notification SMS', async () => {
      const recipient = '+254712345678';
      const message = 'ABAN REMIT: Deposit of KES 1000 received. New Balance: KES 5000.';
      
      const result = await smsEngine.sendTransactionNotification(recipient, message);
      
      expect(result.recipient).toBe(recipient);
      expect(result.message).toBe(message);
      expect(result.status).toBe('SENT');
      expect(result.cost).toBe(1.5);
    });
    
    it('should log transaction notification attempts', async () => {
      const recipient = '+254712345678';
      const message = 'ABAN REMIT: Withdrawal of KES 500. New Balance: KES 4500.';
      
      await smsEngine.sendTransactionNotification(recipient, message);
      
      const logs = await smsLogRepository.findByRecipient(recipient);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe(message);
      expect(logs[0].status).toBe('SENT');
    });
  });
  
  describe('SMS cost tracking', () => {
    it('should use configured SMS cost per message', async () => {
      const customCostEngine = new SMSEngineImpl(smsLogRepository, 2.5);
      
      const result = await customCostEngine.sendSMS('+254712345678', 'Test');
      
      expect(result.cost).toBe(2.5);
    });
    
    it('should default to 1.0 KES per message if not specified', async () => {
      const defaultCostEngine = new SMSEngineImpl(smsLogRepository);
      
      const result = await defaultCostEngine.sendSMS('+254712345678', 'Test');
      
      expect(result.cost).toBe(1.0);
    });
  });
  
  describe('error handling', () => {
    it('should log failed SMS with error message', async () => {
      const recipient = '+1234567890'; // Invalid format
      const message = 'Test message';
      
      const result = await smsEngine.sendSMS(recipient, message);
      
      expect(result.status).toBe('FAILED');
      expect(result.errorMessage).toBeDefined();
      
      const logs = await smsLogRepository.findByRecipient(recipient);
      expect(logs).toHaveLength(1);
      expect(logs[0].status).toBe('FAILED');
      expect(logs[0].errorMessage).toBe('Invalid phone number format');
    });
  });
});
