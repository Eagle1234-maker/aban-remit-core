/**
 * Unit tests for Fraud Protection Utilities
 * Validates Requirements: 35.1, 35.2, 35.3
 */

import { describe, it, expect } from 'vitest';
import { validateTransfer, validateWalletStatus, FraudError, ValidationError } from './fraud-protection.js';

describe('Fraud Protection', () => {
  describe('validateTransfer', () => {
    it('should allow transfer between different wallets', () => {
      expect(() => {
        validateTransfer('WLT7770001', 'WLT7770002');
      }).not.toThrow();
    });

    it('should allow transfer between user and agent wallets', () => {
      expect(() => {
        validateTransfer('WLT7770001', 'AGT8880001');
      }).not.toThrow();
    });

    it('should throw FraudError for same wallet transfer', () => {
      expect(() => {
        validateTransfer('WLT7770001', 'WLT7770001');
      }).toThrow(FraudError);
    });

    it('should throw FraudError with correct message for self-transfer', () => {
      expect(() => {
        validateTransfer('WLT7770001', 'WLT7770001');
      }).toThrow('Cannot transfer to the same wallet');
    });

    it('should throw FraudError with SELF_TRANSFER code', () => {
      try {
        validateTransfer('WLT7770001', 'WLT7770001');
      } catch (error) {
        expect(error).toBeInstanceOf(FraudError);
        expect((error as FraudError).code).toBe('SELF_TRANSFER');
      }
    });

    it('should prevent agent self-transfer', () => {
      expect(() => {
        validateTransfer('AGT8880001', 'AGT8880001');
      }).toThrow(FraudError);
    });

    it('should handle empty wallet IDs', () => {
      expect(() => {
        validateTransfer('', '');
      }).toThrow(FraudError);
    });

    it('should handle null wallet IDs', () => {
      expect(() => {
        validateTransfer(null as any, null as any);
      }).toThrow(FraudError);
    });
  });

  describe('validateWalletStatus', () => {
    it('should allow ACTIVE wallet for SEND operation', () => {
      const wallet = { id: 'WLT7770001', state: 'ACTIVE' };
      
      expect(() => {
        validateWalletStatus(wallet, 'SEND');
      }).not.toThrow();
    });

    it('should allow ACTIVE wallet for RECEIVE operation', () => {
      const wallet = { id: 'WLT7770001', state: 'ACTIVE' };
      
      expect(() => {
        validateWalletStatus(wallet, 'RECEIVE');
      }).not.toThrow();
    });

    it('should throw ValidationError for LOCKED wallet', () => {
      const wallet = { id: 'WLT7770001', state: 'LOCKED' };
      
      expect(() => {
        validateWalletStatus(wallet, 'SEND');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for FROZEN wallet', () => {
      const wallet = { id: 'WLT7770001', state: 'FROZEN' };
      
      expect(() => {
        validateWalletStatus(wallet, 'RECEIVE');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for SUSPENDED wallet', () => {
      const wallet = { id: 'WLT7770001', state: 'SUSPENDED' };
      
      expect(() => {
        validateWalletStatus(wallet, 'SEND');
      }).toThrow(ValidationError);
    });

    it('should include wallet ID in error message', () => {
      const wallet = { id: 'WLT7770001', state: 'LOCKED' };
      
      expect(() => {
        validateWalletStatus(wallet, 'SEND');
      }).toThrow('Wallet WLT7770001 is LOCKED, cannot SEND');
    });

    it('should include operation in error message', () => {
      const wallet = { id: 'WLT7770001', state: 'FROZEN' };
      
      expect(() => {
        validateWalletStatus(wallet, 'RECEIVE');
      }).toThrow('cannot RECEIVE');
    });

    it('should handle different wallet states', () => {
      const states = ['LOCKED', 'FROZEN', 'SUSPENDED', 'INACTIVE'];
      
      states.forEach(state => {
        const wallet = { id: 'WLT7770001', state };
        
        expect(() => {
          validateWalletStatus(wallet, 'SEND');
        }).toThrow(ValidationError);
      });
    });
  });
});