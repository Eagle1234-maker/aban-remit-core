import { Router, Request, Response } from 'express';
import { MPESALogRepositoryImpl } from '../repositories/mpesa-log/implementation.js';
import { generateDepositSMS } from '../utils/sms-templates.js';

const router = Router();

// Factory function to get repository instance (allows for dependency injection in tests)
let mpesaLogRepositoryFactory = () => new MPESALogRepositoryImpl();

// Export function to override repository factory for testing
export function setMPESALogRepositoryFactory(factory: () => MPESALogRepositoryImpl) {
  mpesaLogRepositoryFactory = factory;
}

/**
 * POST /deposits/mpesa/callback
 * 
 * MPESA STK Push callback handler
 * Processes MPESA deposit confirmations with idempotency checking
 * 
 * Requirements: 32.1, 32.4, 32.5
 */
router.post(
  '/mpesa/callback',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const payload = req.body;
      const mpesaLogRepository = mpesaLogRepositoryFactory();
      
      // Extract MPESA receipt, sender phone, amount from callback
      // Requirement 32.1: Extract MPESA receipt number, sender phone, amount, and raw payload
      const mpesaReceipt = extractMPESAReceipt(payload);
      const senderPhone = extractSenderPhone(payload);
      const amount = extractAmount(payload);
      
      if (!mpesaReceipt || !senderPhone || !amount) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid MPESA callback payload: missing required fields'
        });
        return;
      }
      
      // Check for duplicate receipt before processing
      // Requirement 32.4: Check for duplicate MPESA receipt numbers to ensure idempotency
      const existingLog = await mpesaLogRepository.findByReceipt(mpesaReceipt);
      
      if (existingLog) {
        // Requirement 32.5: Return existing transaction if duplicate receipt found
        console.log(`Duplicate MPESA receipt detected: ${mpesaReceipt}`);
        
        // TODO: Fetch and return the existing transaction
        // For now, return success to acknowledge the callback
        res.status(200).json({
          success: true,
          message: 'Transaction already processed',
          receipt: mpesaReceipt
        });
        return;
      }
      
      // Log all MPESA deposits to mpesa_logs table
      // Requirement 32.2: Store MPESA deposit data in mpesa_logs table
      const mpesaLog = await mpesaLogRepository.createLog({
        receipt: mpesaReceipt,
        phone: senderPhone,
        amount,
        rawPayload: payload
      });
      
      console.log(`MPESA deposit logged: ${mpesaLog.id}, receipt: ${mpesaReceipt}`);
      
      // TODO: Create transaction and ledger entries
      // TODO: Fetch wallet and calculate new balance
      
      // Generate SMS notification with format from Requirement 32.6
      // Format: "ABAN REMIT: Deposit of KES X received from 2547XXXXXXX. MPESA Ref: XXX New Balance: KES Y."
      // Note: This will be sent once transaction and ledger entries are created
      // For now, we prepare the SMS message for logging purposes
      const mockNewBalance = 5000; // TODO: Calculate actual new balance from ledger
      const smsMessage = generateDepositSMS(amount, senderPhone, mpesaReceipt, mockNewBalance);
      console.log(`SMS to be sent: ${smsMessage}`);
      
      // TODO: Send SMS notification using SMS Engine
      
      res.status(200).json({
        success: true,
        message: 'Deposit processed successfully',
        receipt: mpesaReceipt
      });
    } catch (error) {
      console.error('MPESA callback error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process MPESA callback'
      });
    }
  }
);

/**
 * Extract MPESA receipt from callback payload
 * Handles different MPESA callback formats
 */
function extractMPESAReceipt(payload: any): string | null {
  // MPESA STK Push callback structure varies
  // Common fields: TransID, MpesaReceiptNumber, TransactionID
  return payload?.Body?.stkCallback?.CallbackMetadata?.Item?.find(
    (item: any) => item.Name === 'MpesaReceiptNumber'
  )?.Value || payload?.TransID || payload?.MpesaReceiptNumber || null;
}

/**
 * Extract sender phone from callback payload
 */
function extractSenderPhone(payload: any): string | null {
  return payload?.Body?.stkCallback?.CallbackMetadata?.Item?.find(
    (item: any) => item.Name === 'PhoneNumber'
  )?.Value || payload?.MSISDN || payload?.PhoneNumber || null;
}

/**
 * Extract amount from callback payload
 */
function extractAmount(payload: any): number | null {
  const amountValue = payload?.Body?.stkCallback?.CallbackMetadata?.Item?.find(
    (item: any) => item.Name === 'Amount'
  )?.Value || payload?.TransAmount || payload?.Amount;
  
  if (amountValue === null || amountValue === undefined) {
    return null;
  }
  
  return typeof amountValue === 'string' ? parseFloat(amountValue) : amountValue;
}

export default router;
