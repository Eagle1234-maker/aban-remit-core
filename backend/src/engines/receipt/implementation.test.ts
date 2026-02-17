/**
 * Unit tests for Receipt Engine Implementation
 * Validates Requirements: 34.1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReceiptEngineImpl } from './implementation.js';

describe('ReceiptEngineImpl', () => {
  let receiptEngine: ReceiptEngineImpl;

  beforeEach(() => {
    receiptEngine = new ReceiptEngineImpl();
  });

  describe('generateReceipt', () => {
    it('should generate receipt with PDF buffer and verification hash', async () => {
      const reference = 'TXN123456789';
      
      const result = await receiptEngine.generateReceipt(reference);
      
      expect(result.pdfBuffer).toBeInstanceOf(Buffer);
      expect(result.pdfBuffer.length).toBeGreaterThan(0);
      expect(result.filename).toMatch(/^receipt_TXN123456789_\d+\.pdf$/);
      expect(result.verificationHash).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex
    });

    it('should generate different filenames for same reference', async () => {
      const reference = 'TXN123456789';
      
      const result1 = await receiptEngine.generateReceipt(reference);
      // Add small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      const result2 = await receiptEngine.generateReceipt(reference);
      
      expect(result1.filename).not.toBe(result2.filename);
    });

    it('should generate PDF buffer with all required fields', async () => {
      const reference = 'TXN987654321';
      
      const result = await receiptEngine.generateReceipt(reference);
      const pdfContent = result.pdfBuffer.toString('utf-8');
      
      // Requirement 34.2: Include all required fields
      // Requirement 34.3: Include QR code containing transaction reference
      expect(pdfContent).toContain(reference);
      expect(pdfContent).toContain('ABAN REMIT');
      expect(pdfContent).toContain('TRANSACTION RECEIPT');
      expect(pdfContent).toContain('SENDER DETAILS');
      expect(pdfContent).toContain('RECEIVER DETAILS');
      expect(pdfContent).toContain('TRANSACTION DETAILS');
      expect(pdfContent).toContain('Amount:');
      expect(pdfContent).toContain('Fee:');
      expect(pdfContent).toContain('Net Amount:');
      expect(pdfContent).toContain('Currency:');
      expect(pdfContent).toContain('Status:');
      expect(pdfContent).toContain('Provider Reference:');
      expect(pdfContent).toContain('VERIFICATION:');
      expect(pdfContent).toContain('QR CODE:');
      expect(pdfContent).toContain('█'); // QR code ASCII art
    });

    it('should include verification hash in PDF content', async () => {
      const reference = 'TXN555666777';
      
      const result = await receiptEngine.generateReceipt(reference);
      const pdfContent = result.pdfBuffer.toString('utf-8');
      
      expect(pdfContent).toContain(result.verificationHash);
    });
  });

  describe('verifyReceipt', () => {
    it('should return true for valid hash format', async () => {
      const reference = 'TXN123456789';
      const validHash = 'a'.repeat(64); // 64-character hex string
      
      const isValid = await receiptEngine.verifyReceipt(reference, validHash);
      
      expect(isValid).toBe(true);
    });

    it('should return false for invalid hash format', async () => {
      const reference = 'TXN123456789';
      const invalidHash = 'invalid-hash';
      
      const isValid = await receiptEngine.verifyReceipt(reference, invalidHash);
      
      expect(isValid).toBe(false);
    });

    it('should return false for empty hash', async () => {
      const reference = 'TXN123456789';
      const emptyHash = '';
      
      const isValid = await receiptEngine.verifyReceipt(reference, emptyHash);
      
      expect(isValid).toBe(false);
    });

    it('should return false for short hash', async () => {
      const reference = 'TXN123456789';
      const shortHash = 'abc123';
      
      const isValid = await receiptEngine.verifyReceipt(reference, shortHash);
      
      expect(isValid).toBe(false);
    });
  });
});