import { describe, it, expect } from 'vitest';
import {
  generateDepositSMS,
  generateWithdrawalSMS,
  generateTransferSentSMS,
  generateTransferReceivedSMS,
  smsTemplates
} from './sms-templates.js';

describe('SMS Templates', () => {
  describe('generateDepositSMS', () => {
    it('should generate correct deposit SMS with masked phone', () => {
      const sms = generateDepositSMS(1000, '+254712345678', 'ABC123XYZ', 5000);
      
      expect(sms).toBe('ABAN REMIT: Deposit of KES 1000.00 received from ****5678. MPESA Ref: ABC123XYZ New Balance: KES 5000.00.');
    });

    it('should format amounts with 2 decimal places', () => {
      const sms = generateDepositSMS(1000.5, '+254712345678', 'ABC123', 5000.75);
      
      expect(sms).toContain('KES 1000.50');
      expect(sms).toContain('KES 5000.75');
    });

    it('should mask sender phone number', () => {
      const sms = generateDepositSMS(500, '0712345678', 'REF456', 2500);
      
      expect(sms).toContain('****5678');
      expect(sms).not.toContain('0712345678');
    });

    it('should include MPESA reference', () => {
      const sms = generateDepositSMS(1000, '+254712345678', 'MPESA123', 5000);
      
      expect(sms).toContain('MPESA Ref: MPESA123');
    });

    it('should include new balance', () => {
      const sms = generateDepositSMS(1000, '+254712345678', 'ABC123', 5000);
      
      expect(sms).toContain('New Balance: KES 5000.00');
    });

    it('should start with ABAN REMIT prefix', () => {
      const sms = generateDepositSMS(1000, '+254712345678', 'ABC123', 5000);
      
      expect(sms).toMatch(/^ABAN REMIT:/);
    });
  });

  describe('generateWithdrawalSMS', () => {
    it('should generate correct withdrawal SMS', () => {
      const sms = generateWithdrawalSMS(1000, 50, 'TXN123', 4000);
      
      expect(sms).toBe('ABAN REMIT: You have withdrawn KES 1000.00. Fee: KES 50.00 Reference: TXN123 Available Balance: KES 4000.00.');
    });

    it('should format amounts with 2 decimal places', () => {
      const sms = generateWithdrawalSMS(1000.5, 25.75, 'TXN456', 3500.25);
      
      expect(sms).toContain('KES 1000.50');
      expect(sms).toContain('Fee: KES 25.75');
      expect(sms).toContain('KES 3500.25');
    });

    it('should include transaction reference', () => {
      const sms = generateWithdrawalSMS(1000, 50, 'TXN789', 4000);
      
      expect(sms).toContain('Reference: TXN789');
    });

    it('should include fee amount', () => {
      const sms = generateWithdrawalSMS(1000, 50, 'TXN123', 4000);
      
      expect(sms).toContain('Fee: KES 50.00');
    });

    it('should start with ABAN REMIT prefix', () => {
      const sms = generateWithdrawalSMS(1000, 50, 'TXN123', 4000);
      
      expect(sms).toMatch(/^ABAN REMIT:/);
    });
  });

  describe('generateTransferSentSMS', () => {
    it('should generate correct transfer sent SMS', () => {
      const sms = generateTransferSentSMS(500, 'WLT7770002', 10, 2000);
      
      expect(sms).toBe('ABAN REMIT: You sent KES 500.00 to WLT7770002. Fee: KES 10.00 New Balance: KES 2000.00.');
    });

    it('should format amounts with 2 decimal places', () => {
      const sms = generateTransferSentSMS(500.5, 'WLT7770002', 10.25, 2000.75);
      
      expect(sms).toContain('KES 500.50');
      expect(sms).toContain('Fee: KES 10.25');
      expect(sms).toContain('KES 2000.75');
    });

    it('should include recipient identifier', () => {
      const sms = generateTransferSentSMS(500, 'WLT7770002', 10, 2000);
      
      expect(sms).toContain('to WLT7770002');
    });
  });

  describe('generateTransferReceivedSMS', () => {
    it('should generate correct transfer received SMS', () => {
      const sms = generateTransferReceivedSMS(500, 'WLT7770001', 3000);
      
      expect(sms).toBe('ABAN REMIT: You received KES 500.00 from WLT7770001. New Balance: KES 3000.00.');
    });

    it('should format amounts with 2 decimal places', () => {
      const sms = generateTransferReceivedSMS(500.5, 'WLT7770001', 3000.75);
      
      expect(sms).toContain('KES 500.50');
      expect(sms).toContain('KES 3000.75');
    });

    it('should include sender identifier', () => {
      const sms = generateTransferReceivedSMS(500, 'WLT7770001', 3000);
      
      expect(sms).toContain('from WLT7770001');
    });
  });

  describe('smsTemplates object', () => {
    it('should export all template functions', () => {
      expect(smsTemplates.deposit).toBe(generateDepositSMS);
      expect(smsTemplates.withdrawal).toBe(generateWithdrawalSMS);
      expect(smsTemplates.transferSent).toBe(generateTransferSentSMS);
      expect(smsTemplates.transferReceived).toBe(generateTransferReceivedSMS);
    });

    it('should work when called through smsTemplates object', () => {
      const sms = smsTemplates.deposit(1000, '+254712345678', 'ABC123', 5000);
      
      expect(sms).toContain('ABAN REMIT');
      expect(sms).toContain('****5678');
      expect(sms).toContain('ABC123');
    });
  });
});
