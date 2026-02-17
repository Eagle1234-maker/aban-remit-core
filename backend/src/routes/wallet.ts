import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { WalletLookupEngineImpl } from '../engines/wallet-lookup/implementation.js';
import { WalletLookupError } from '../engines/wallet-lookup/types.js';
import { requiresOTP } from '../config/withdrawal.js';
import { generateOTP, verifyOTP } from '../services/otp.js';

const router = Router();
const prisma = new PrismaClient();
const walletLookupEngine = new WalletLookupEngineImpl();

/**
 * GET /wallet/balance
 * 
 * Get wallet balance for authenticated user
 * Returns balance for all currencies
 */
router.get(
  '/balance',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      
      // Get user's wallet
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          wallets: true
        }
      });
      
      if (!user || user.wallets.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Wallet not found for user'
        });
        return;
      }
      
      // For now, return a simple balance structure
      // In production, this would query the ledger to calculate actual balances
      res.status(200).json({
        success: true,
        walletId: user.walletId,
        balances: {
          KES: 0,
          USD: 0,
          EUR: 0
        }
      });
    } catch (error) {
      console.error('Balance lookup error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve wallet balance'
      });
    }
  }
);

/**
 * GET /wallet/lookup/:walletNumber
 * 
 * Look up wallet information by wallet number
 * Returns wallet number, full name, masked phone, status, and KYC status
 * 
 * Requirements: 31.1, 31.7
 */
router.get(
  '/lookup/:walletNumber',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { walletNumber } = req.params;
      
      // Validate wallet number format
      if (!walletNumber || !/^(WLT|AGT)\d{7}$/.test(walletNumber)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid wallet number format. Expected WLT7770001 or AGT8880001'
        });
        return;
      }
      
      // Look up wallet using WalletLookupEngine
      const result = await walletLookupEngine.lookupWallet(walletNumber);
      
      // Return wallet information
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      // Handle WalletLookupError
      if (error instanceof WalletLookupError) {
        // Requirement 31.7: Return 404 for non-existent wallets
        if (error.code === 'NOT_FOUND') {
          res.status(404).json({
            error: 'Not Found',
            message: error.message
          });
          return;
        }
        
        // Return 400 for LOCKED or FROZEN wallets
        if (error.code === 'LOCKED' || error.code === 'FROZEN') {
          res.status(400).json({
            error: 'Bad Request',
            message: error.message,
            code: error.code
          });
          return;
        }
      }
      
      // Handle unexpected errors
      console.error('Wallet lookup error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to lookup wallet'
      });
    }
  }
);

export default router;

/**
 * POST /wallet/withdraw/request
 * 
 * Request a withdrawal - checks if OTP is required
 * If amount exceeds threshold, generates and sends OTP
 * 
 * Requirements: 33.2, 33.3
 */
router.post(
  '/withdraw/request',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { amount, currency, phone } = req.body;
      
      // Validate required fields
      if (amount === undefined || amount === null || !currency || !phone) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Missing required fields: amount, currency, phone'
        });
        return;
      }
      
      // Validate amount is positive
      if (amount <= 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Amount must be greater than 0'
        });
        return;
      }
      
      // Check if OTP is required for this amount
      const otpRequired = requiresOTP(amount);
      
      if (otpRequired) {
        // Generate and send OTP
        const userId = req.user!.userId;
        const otpCode = await generateOTP(userId);
        
        // TODO: Send OTP via SMS using SMS Engine
        // For now, return OTP in response (in production, only send via SMS)
        console.log(`OTP for user ${userId}: ${otpCode}`);
        
        res.status(200).json({
          success: true,
          otpRequired: true,
          message: 'OTP has been sent to your registered phone number'
        });
        return;
      }
      
      // OTP not required, proceed with withdrawal
      res.status(200).json({
        success: true,
        otpRequired: false,
        message: 'Withdrawal can proceed without OTP'
      });
    } catch (error) {
      console.error('Withdrawal request error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process withdrawal request'
      });
    }
  }
);

/**
 * POST /wallet/withdraw/confirm
 * 
 * Confirm and process withdrawal
 * Verifies OTP if required, then processes the withdrawal
 * 
 * Requirements: 33.2, 33.3
 */
router.post(
  '/withdraw/confirm',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { amount, currency, phone, otp } = req.body;
      
      // Validate required fields
      if (amount === undefined || amount === null || !currency || !phone) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Missing required fields: amount, currency, phone'
        });
        return;
      }
      
      // Validate amount is positive
      if (amount <= 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Amount must be greater than 0'
        });
        return;
      }
      
      // Check if OTP is required for this amount
      const otpRequired = requiresOTP(amount);
      
      if (otpRequired) {
        // Verify OTP is provided
        if (!otp) {
          res.status(400).json({
            error: 'Bad Request',
            message: 'OTP is required for this withdrawal amount'
          });
          return;
        }
        
        // Verify OTP
        const userId = req.user!.userId;
        const isValid = await verifyOTP(userId, otp);
        
        if (!isValid) {
          res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid or expired OTP'
          });
          return;
        }
      }
      
      // TODO: Process withdrawal using Transaction Engine
      // For now, return success response
      res.status(200).json({
        success: true,
        message: 'Withdrawal processed successfully',
        transactionId: 'TXN' + Date.now(),
        amount,
        currency,
        phone
      });
    } catch (error) {
      console.error('Withdrawal confirmation error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process withdrawal'
      });
    }
  }
);
