/**
 * Transfer Flow Orchestrator Tests
 * 
 * Tests for the standardized 9-step transfer flow.
 * Validates Requirements: 37.1, 37.3, 37.4, 37.5, 37.6, 37.7
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransferOrchestrator, TransferRequest } from './transfer-orchestrator.js';
import { WalletLookupEngine, WalletLookupResult } from '../engines/wallet-lookup/interface.js';
import { SMSEngineImpl } from '../engines/sms/implementation.js';
import { ReceiptEngineImpl } from '../engines/receipt/implementation.js';
import { SMSLogRepositoryImpl } from '../repositories/sms-log/implementation.js';

// Mock wallet lookup engine
class MockWalletLookupEngine implements WalletLookupEngine {
  async lookupWallet(walletNumber: string): Promise<WalletLookupResult | null> {
    if (walletNumber === 'WLT9999999') {
      return null; // Simulate non-existent wallet
    }
    
    return {
      walletNumber,
      fullName: 'John Doe',
      maskedPhone: '****5678',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED'
    };
  }
}

describe('TransferOrchestrator', () => {
  let orchestrator: TransferOrchestrator;
  let walletLookupEngine: MockWalletLookupEngine;
  let smsEngine: SMSEngineImpl;
  let receiptEngine: ReceiptEngineImpl;
  
  beforeEach(() => {
    walletLookupEngine = new MockWalletLookupEngine();
    const smsLogRepository = new SMSLogRepositoryImpl();
    smsEngine = new SMSEngineImpl(smsLogRepository);
    receiptEngine = new ReceiptEngineImpl();
    
    orchestrator = new TransferOrchestrator(
      walletLookupEngine,
      smsEngine,
      receiptEngine
    );
  });
  
  describe('executeTransfer', () => {
    it('should successfully execute complete transfer flow', async () => {
      const request: TransferRequest = {
        senderWalletId: 'WLT7770001',
        receiverWalletNumber: 'WLT7770002',
        amount: 1000,
        currency: 'KES',
        pin: '1234'
      };
      
      const result = await orchestrator.executeTransfer(request);
      
      expect(result.success).toBe(true);
      expect(result.transactionId).toBeDefined();
      expect(result.transactionReference).toBeDefined();
      expect(result.amount).toBe(1000);
      expect(result.fee).toBe(10); // 1% of 1000
      expect(result.totalAmount).toBe(1010);
      expect(result.receiptUrl).toBeDefined();
    });
    
    it('should fail if receiver wallet not found', async () => {
      const request: TransferRequest = {
        senderWalletId: 'WLT7770001',
        receiverWalletNumber: 'WLT9999999', // Non-existent
        amount: 1000,
        currency: 'KES',
        pin: '1234'
      };
      
      const result = await orchestrator.executeTransfer(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Receiver wallet not found');
      expect(result.step).toBe('lookup');
    });
    
    it('should fail if PIN is invalid', async () => {
      const request: TransferRequest = {
        senderWalletId: 'WLT7770001',
        receiverWalletNumber: 'WLT7770002',
        amount: 1000,
        currency: 'KES',
        pin: 'invalid' // Invalid PIN
      };
      
      const result = await orchestrator.executeTransfer(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid PIN');
      expect(result.step).toBe('pin_validation');
    });
    
    it('should fail if PIN is not 4 digits', async () => {
      const request: TransferRequest = {
        senderWalletId: 'WLT7770001',
        receiverWalletNumber: 'WLT7770002',
        amount: 1000,
        currency: 'KES',
        pin: '12' // Too short
      };
      
      const result = await orchestrator.executeTransfer(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid PIN');
    });
    
    it('should calculate fee correctly', async () => {
      const request: TransferRequest = {
        senderWalletId: 'WLT7770001',
        receiverWalletNumber: 'WLT7770002',
        amount: 5000,
        currency: 'KES',
        pin: '1234'
      };
      
      const result = await orchestrator.executeTransfer(request);
      
      expect(result.success).toBe(true);
      expect(result.fee).toBe(50); // 1% of 5000
      expect(result.totalAmount).toBe(5050);
    });
    
    it('should send SMS notifications to both parties', async () => {
      const sendSpy = vi.spyOn(smsEngine, 'sendTransactionNotification');
      
      const request: TransferRequest = {
        senderWalletId: 'WLT7770001',
        receiverWalletNumber: 'WLT7770002',
        amount: 1000,
        currency: 'KES',
        pin: '1234'
      };
      
      await orchestrator.executeTransfer(request);
      
      // Should send 2 SMS: one to sender, one to receiver
      expect(sendSpy).toHaveBeenCalledTimes(2);
    });
    
    it('should generate receipt URL', async () => {
      const request: TransferRequest = {
        senderWalletId: 'WLT7770001',
        receiverWalletNumber: 'WLT7770002',
        amount: 1000,
        currency: 'KES',
        pin: '1234'
      };
      
      const result = await orchestrator.executeTransfer(request);
      
      expect(result.success).toBe(true);
      expect(result.receiptUrl).toMatch(/^\/transactions\/REF-\d+\/receipt$/);
    });
    
    it('should handle errors gracefully', async () => {
      // Force an error by mocking wallet lookup to throw
      vi.spyOn(walletLookupEngine, 'lookupWallet').mockRejectedValue(new Error('Database error'));
      
      const request: TransferRequest = {
        senderWalletId: 'WLT7770001',
        receiverWalletNumber: 'WLT7770002',
        amount: 1000,
        currency: 'KES',
        pin: '1234'
      };
      
      const result = await orchestrator.executeTransfer(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});
