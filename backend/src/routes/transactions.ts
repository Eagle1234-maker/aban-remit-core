/**
 * Transaction Routes
 * 
 * Handles transaction-related endpoints including receipt generation.
 * Validates Requirements: 34.1, 34.7
 */

import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { ReceiptEngineImpl } from '../engines/receipt/implementation.js';

const router = Router();
const receiptEngine = new ReceiptEngineImpl();

/**
 * GET /transactions/:reference/receipt
 * 
 * Generate and return PDF receipt for a transaction
 * 
 * Requirements: 34.1, 34.7
 */
router.get(
  '/:reference/receipt',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { reference } = req.params;
      
      // Validate transaction reference format
      if (!reference || reference.trim() === '' || !/^TXN\w+$/.test(reference)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid transaction reference format'
        });
        return;
      }
      
      // TODO: Verify user has access to this transaction
      // For now, allow any authenticated user to access any receipt
      
      try {
        // Generate receipt using ReceiptEngine
        const receipt = await receiptEngine.generateReceipt(reference);
        
        // Set appropriate headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${receipt.filename}"`);
        res.setHeader('Content-Length', receipt.pdfBuffer.length);
        
        // Return PDF buffer
        res.status(200).send(receipt.pdfBuffer);
      } catch (receiptError) {
        // Handle case where transaction doesn't exist
        console.error('Receipt generation error:', receiptError);
        
        // Requirement 34.7: Return 404 for non-existent transactions
        res.status(404).json({
          error: 'Not Found',
          message: 'Transaction not found or receipt not available'
        });
      }
    } catch (error) {
      console.error('Transaction receipt error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to generate receipt'
      });
    }
  }
);

export default router;