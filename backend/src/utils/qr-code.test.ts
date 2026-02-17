/**
 * Unit tests for QR Code Generation Utility
 * Validates Requirements: 34.3
 */

import { describe, it, expect } from 'vitest';
import { generateQRCodeContent, generateQRCodeASCII } from './qr-code.js';

describe('QR Code Generation', () => {
  describe('generateQRCodeContent', () => {
    it('should generate JSON content with all required fields', () => {
      const reference = 'TXN123456789';
      const amount = 1000.50;
      const currency = 'KES';
      const date = new Date('2024-01-15T10:30:00.000Z');
      const hash = 'abc123def456';
      
      const content = generateQRCodeContent(reference, amount, currency, date, hash);
      const parsed = JSON.parse(content);
      
      expect(parsed.reference).toBe(reference);
      expect(parsed.amount).toBe('1000.50');
      expect(parsed.currency).toBe(currency);
      expect(parsed.date).toBe(date.toISOString());
      expect(parsed.hash).toBe(hash);
    });

    it('should format amount with 2 decimal places', () => {
      const content = generateQRCodeContent('TXN123', 1000, 'KES', new Date(), 'hash');
      const parsed = JSON.parse(content);
      
      expect(parsed.amount).toBe('1000.00');
    });

    it('should handle decimal amounts correctly', () => {
      const content = generateQRCodeContent('TXN123', 1000.5, 'KES', new Date(), 'hash');
      const parsed = JSON.parse(content);
      
      expect(parsed.amount).toBe('1000.50');
    });

    it('should include ISO date format', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const content = generateQRCodeContent('TXN123', 1000, 'KES', date, 'hash');
      const parsed = JSON.parse(content);
      
      expect(parsed.date).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should generate valid JSON', () => {
      const content = generateQRCodeContent('TXN123', 1000, 'KES', new Date(), 'hash');
      
      expect(() => JSON.parse(content)).not.toThrow();
    });
  });

  describe('generateQRCodeASCII', () => {
    it('should generate ASCII art QR code', () => {
      const content = 'test content';
      
      const ascii = generateQRCodeASCII(content);
      
      expect(ascii).toContain('█');
      expect(ascii).toContain('▄');
      expect(ascii).toContain('Content: test content');
    });

    it('should truncate long content in display', () => {
      const longContent = 'a'.repeat(100);
      
      const ascii = generateQRCodeASCII(longContent);
      
      expect(ascii).toContain('Content: ' + 'a'.repeat(50) + '...');
    });

    it('should include QR code pattern', () => {
      const ascii = generateQRCodeASCII('test');
      
      // Should contain QR code-like pattern
      expect(ascii).toMatch(/█+/);
      expect(ascii).toContain('\n');
    });

    it('should handle empty content', () => {
      const ascii = generateQRCodeASCII('');
      
      expect(ascii).toContain('Content: ...');
      expect(ascii).toContain('█');
    });
  });
});