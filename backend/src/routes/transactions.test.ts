/**
 * Unit tests for Transaction Routes
 * Validates Requirements: 34.1, 34.7
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import transactionRouter from './transactions.js';

// Mock authentication middleware
vi.mock('../middleware/auth.js', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { userId: 'test-user-123', role: 'USER' };
    next();
  },
  AuthenticatedRequest: class {}
}));

describe('Transaction Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/transactions', transactionRouter);
  });

  describe('GET /transactions/:reference/receipt', () => {
    it('should generate and return PDF receipt for valid transaction', async () => {
      const reference = 'TXN123456789';
      
      const response = await request(app)
        .get(`/transactions/${reference}/receipt`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="receipt_TXN123456789_\d+\.pdf"/);
      expect(response.headers['content-length']).toBeDefined();
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should include transaction reference in PDF content', async () => {
      const reference = 'TXN987654321';
      
      const response = await request(app)
        .get(`/transactions/${reference}/receipt`);
      
      expect(response.status).toBe(200);
      const pdfContent = response.body.toString('utf-8');
      expect(pdfContent).toContain(reference);
      expect(pdfContent).toContain('ABAN REMIT');
    });

    it('should return 400 for invalid transaction reference format', async () => {
      const invalidReference = 'INVALID123';
      
      const response = await request(app)
        .get(`/transactions/${invalidReference}/receipt`);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('Invalid transaction reference format');
    });

    it('should return 400 for empty transaction reference', async () => {
      const response = await request(app)
        .get('/transactions/ /receipt'); // Space as reference
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 for transaction reference with invalid characters', async () => {
      const invalidReference = 'TXN-123-456';
      
      const response = await request(app)
        .get(`/transactions/${invalidReference}/receipt`);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should set correct PDF headers', async () => {
      const reference = 'TXN555666777';
      
      const response = await request(app)
        .get(`/transactions/${reference}/receipt`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.pdf');
      expect(response.headers['content-length']).toBeDefined();
      expect(parseInt(response.headers['content-length'])).toBeGreaterThan(0);
    });

    it('should handle different transaction reference formats', async () => {
      const references = ['TXN123', 'TXN123456789', 'TXNABC123DEF'];
      
      for (const reference of references) {
        const response = await request(app)
          .get(`/transactions/${reference}/receipt`);
        
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('application/pdf');
      }
    });

    it('should include verification hash in receipt', async () => {
      const reference = 'TXN888999000';
      
      const response = await request(app)
        .get(`/transactions/${reference}/receipt`);
      
      expect(response.status).toBe(200);
      const pdfContent = response.body.toString('utf-8');
      expect(pdfContent).toMatch(/Hash: [a-f0-9]{64}/); // SHA256 hash pattern
    });

    it('should include QR code in receipt', async () => {
      const reference = 'TXN111222333';
      
      const response = await request(app)
        .get(`/transactions/${reference}/receipt`);
      
      expect(response.status).toBe(200);
      const pdfContent = response.body.toString('utf-8');
      expect(pdfContent).toContain('QR CODE:');
      expect(pdfContent).toContain('█'); // QR code ASCII art
    });
  });
});