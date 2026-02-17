/**
 * Unit tests for Verification Hash Utility
 * Validates Requirements: 34.4
 */

import { describe, it, expect } from 'vitest';
import { calculateVerificationHash } from './verification-hash.js';

describe('calculateVerificationHash', () => {
  it('should generate SHA256 hash for transaction data', () => {
    const reference = 'TXN123456789';
    const amount = 1000.50;
    const createdAt = new Date('2024-01-15T10:30:00.000Z');
    
    const hash = calculateVerificationHash(reference, amount, createdAt);
    
    expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex format
    expect(hash.length).toBe(64);
  });

  it('should generate consistent hash for same input', () => {
    const reference = 'TXN123456789';
    const amount = 1000.50;
    const createdAt = new Date('2024-01-15T10:30:00.000Z');
    
    const hash1 = calculateVerificationHash(reference, amount, createdAt);
    const hash2 = calculateVerificationHash(reference, amount, createdAt);
    
    expect(hash1).toBe(hash2);
  });

  it('should generate different hash for different reference', () => {
    const amount = 1000.50;
    const createdAt = new Date('2024-01-15T10:30:00.000Z');
    
    const hash1 = calculateVerificationHash('TXN123456789', amount, createdAt);
    const hash2 = calculateVerificationHash('TXN987654321', amount, createdAt);
    
    expect(hash1).not.toBe(hash2);
  });

  it('should generate different hash for different amount', () => {
    const reference = 'TXN123456789';
    const createdAt = new Date('2024-01-15T10:30:00.000Z');
    
    const hash1 = calculateVerificationHash(reference, 1000.50, createdAt);
    const hash2 = calculateVerificationHash(reference, 2000.75, createdAt);
    
    expect(hash1).not.toBe(hash2);
  });

  it('should generate different hash for different timestamp', () => {
    const reference = 'TXN123456789';
    const amount = 1000.50;
    
    const hash1 = calculateVerificationHash(reference, amount, new Date('2024-01-15T10:30:00.000Z'));
    const hash2 = calculateVerificationHash(reference, amount, new Date('2024-01-15T11:30:00.000Z'));
    
    expect(hash1).not.toBe(hash2);
  });

  it('should handle decimal amounts correctly', () => {
    const reference = 'TXN123456789';
    const createdAt = new Date('2024-01-15T10:30:00.000Z');
    
    const hash1 = calculateVerificationHash(reference, 1000.5, createdAt);
    const hash2 = calculateVerificationHash(reference, 1000.50, createdAt);
    
    expect(hash1).toBe(hash2); // Should be same as JavaScript treats 1000.5 === 1000.50
  });

  it('should handle zero amount', () => {
    const reference = 'TXN123456789';
    const amount = 0;
    const createdAt = new Date('2024-01-15T10:30:00.000Z');
    
    const hash = calculateVerificationHash(reference, amount, createdAt);
    
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash.length).toBe(64);
  });

  it('should handle large amounts', () => {
    const reference = 'TXN123456789';
    const amount = 999999999.99;
    const createdAt = new Date('2024-01-15T10:30:00.000Z');
    
    const hash = calculateVerificationHash(reference, amount, createdAt);
    
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash.length).toBe(64);
  });
});