import { describe, it, expect } from 'vitest';
import {
  normalizeForMPesa,
  normalizeForTalkSasa,
  normalizeForInstalipa,
  isValidKenyanPhone,
  validateAndNormalizeForMPesa,
  validateAndNormalizeForTalkSasa,
  validateAndNormalizeForInstalipa,
  PhoneValidationError,
} from './phone-normalization';

describe('Phone Number Normalization', () => {
  describe('normalizeForMPesa', () => {
    it('should normalize phone with +254 prefix', () => {
      expect(normalizeForMPesa('+254712345678')).toBe('254712345678');
      expect(normalizeForMPesa('+254722345678')).toBe('254722345678');
      expect(normalizeForMPesa('+254733345678')).toBe('254733345678');
    });

    it('should normalize phone with 254 prefix (no +)', () => {
      expect(normalizeForMPesa('254712345678')).toBe('254712345678');
      expect(normalizeForMPesa('254722345678')).toBe('254722345678');
    });

    it('should normalize phone with 0 prefix', () => {
      expect(normalizeForMPesa('0712345678')).toBe('254712345678');
      expect(normalizeForMPesa('0722345678')).toBe('254722345678');
      expect(normalizeForMPesa('0733345678')).toBe('254733345678');
    });

    it('should normalize phone without prefix (starting with 7)', () => {
      expect(normalizeForMPesa('712345678')).toBe('254712345678');
      expect(normalizeForMPesa('722345678')).toBe('254722345678');
    });

    it('should normalize phone without prefix (starting with 1)', () => {
      expect(normalizeForMPesa('112345678')).toBe('254112345678');
    });

    it('should handle phone with spaces', () => {
      expect(normalizeForMPesa('+254 712 345 678')).toBe('254712345678');
      expect(normalizeForMPesa('0712 345 678')).toBe('254712345678');
    });

    it('should handle phone with dashes', () => {
      expect(normalizeForMPesa('+254-712-345-678')).toBe('254712345678');
      expect(normalizeForMPesa('0712-345-678')).toBe('254712345678');
    });

    it('should handle phone with parentheses', () => {
      expect(normalizeForMPesa('+254(712)345678')).toBe('254712345678');
      expect(normalizeForMPesa('(0712)345678')).toBe('254712345678');
    });

    it('should throw error for invalid format', () => {
      expect(() => normalizeForMPesa('999123456789')).toThrow('Invalid phone number format');
      expect(() => normalizeForMPesa('555123456789')).toThrow('Invalid phone number format');
    });

    it('should throw error for empty phone', () => {
      expect(() => normalizeForMPesa('')).toThrow('Phone number cannot be empty');
    });
  });

  describe('normalizeForTalkSasa', () => {
    it('should normalize phone with +254 prefix', () => {
      expect(normalizeForTalkSasa('+254712345678')).toBe('254712345678');
      expect(normalizeForTalkSasa('+254722345678')).toBe('254722345678');
    });

    it('should normalize phone with 254 prefix (no +)', () => {
      expect(normalizeForTalkSasa('254712345678')).toBe('254712345678');
    });

    it('should normalize phone with 0 prefix', () => {
      expect(normalizeForTalkSasa('0712345678')).toBe('254712345678');
      expect(normalizeForTalkSasa('0722345678')).toBe('254722345678');
    });

    it('should normalize phone without prefix', () => {
      expect(normalizeForTalkSasa('712345678')).toBe('254712345678');
    });

    it('should handle phone with spaces and dashes', () => {
      expect(normalizeForTalkSasa('+254 712 345 678')).toBe('254712345678');
      expect(normalizeForTalkSasa('0712-345-678')).toBe('254712345678');
    });
  });

  describe('normalizeForInstalipa', () => {
    it('should normalize phone with +254 prefix', () => {
      expect(normalizeForInstalipa('+254712345678')).toBe('254712345678');
      expect(normalizeForInstalipa('+254722345678')).toBe('254722345678');
    });

    it('should normalize phone with 254 prefix (no +)', () => {
      expect(normalizeForInstalipa('254712345678')).toBe('254712345678');
    });

    it('should normalize phone with 0 prefix', () => {
      expect(normalizeForInstalipa('0712345678')).toBe('254712345678');
      expect(normalizeForInstalipa('0722345678')).toBe('254722345678');
    });

    it('should normalize phone without prefix', () => {
      expect(normalizeForInstalipa('712345678')).toBe('254712345678');
    });

    it('should handle phone with spaces and dashes', () => {
      expect(normalizeForInstalipa('+254 712 345 678')).toBe('254712345678');
      expect(normalizeForInstalipa('0712-345-678')).toBe('254712345678');
    });
  });

  describe('isValidKenyanPhone', () => {
    it('should validate correct Kenyan phone numbers', () => {
      expect(isValidKenyanPhone('254712345678')).toBe(true);
      expect(isValidKenyanPhone('254722345678')).toBe(true);
      expect(isValidKenyanPhone('254733345678')).toBe(true);
      expect(isValidKenyanPhone('254112345678')).toBe(true);
      expect(isValidKenyanPhone('+254712345678')).toBe(true);
      expect(isValidKenyanPhone('0712345678')).toBe(true);
      expect(isValidKenyanPhone('712345678')).toBe(true);
    });

    it('should reject phone numbers that are too short', () => {
      expect(isValidKenyanPhone('25471234567')).toBe(false); // 11 digits
      expect(isValidKenyanPhone('071234567')).toBe(false); // 9 digits
      expect(isValidKenyanPhone('71234567')).toBe(false); // 8 digits
    });

    it('should reject phone numbers that are too long', () => {
      expect(isValidKenyanPhone('2547123456789')).toBe(false); // 13 digits
      expect(isValidKenyanPhone('07123456789')).toBe(false); // 11 digits
      expect(isValidKenyanPhone('7123456789')).toBe(false); // 10 digits
    });

    it('should reject non-Kenyan phone numbers', () => {
      expect(isValidKenyanPhone('255712345678')).toBe(false); // Tanzania
      expect(isValidKenyanPhone('256712345678')).toBe(false); // Uganda
      expect(isValidKenyanPhone('1234567890')).toBe(false); // Invalid
    });

    it('should reject phone numbers with invalid network prefix', () => {
      expect(isValidKenyanPhone('254912345678')).toBe(false); // 9 is not valid
      expect(isValidKenyanPhone('254812345678')).toBe(false); // 8 is not valid
      expect(isValidKenyanPhone('254512345678')).toBe(false); // 5 is not valid
    });

    it('should reject phone numbers with non-digit characters', () => {
      expect(isValidKenyanPhone('254712abc678')).toBe(false);
      expect(isValidKenyanPhone('254712#45678')).toBe(false);
    });

    it('should reject empty or null phone numbers', () => {
      expect(isValidKenyanPhone('')).toBe(false);
      expect(isValidKenyanPhone('   ')).toBe(false);
    });

    it('should handle phone numbers with spaces and dashes', () => {
      expect(isValidKenyanPhone('+254 712 345 678')).toBe(true);
      expect(isValidKenyanPhone('0712-345-678')).toBe(true);
      expect(isValidKenyanPhone('254 712 345 678')).toBe(true);
    });
  });

  describe('validateAndNormalizeForMPesa', () => {
    it('should validate and normalize valid phone numbers', () => {
      expect(validateAndNormalizeForMPesa('254712345678')).toBe('254712345678');
      expect(validateAndNormalizeForMPesa('0712345678')).toBe('254712345678');
      expect(validateAndNormalizeForMPesa('+254712345678')).toBe('254712345678');
    });

    it('should throw PhoneValidationError for invalid phone numbers', () => {
      expect(() => validateAndNormalizeForMPesa('255712345678')).toThrow(PhoneValidationError);
      expect(() => validateAndNormalizeForMPesa('071234567')).toThrow(PhoneValidationError);
      expect(() => validateAndNormalizeForMPesa('999123456789')).toThrow(PhoneValidationError);
    });

    it('should include phone number in error', () => {
      try {
        validateAndNormalizeForMPesa('255712345678');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(PhoneValidationError);
        expect((error as PhoneValidationError).phone).toBe('255712345678');
      }
    });
  });

  describe('validateAndNormalizeForTalkSasa', () => {
    it('should validate and normalize valid phone numbers', () => {
      expect(validateAndNormalizeForTalkSasa('254712345678')).toBe('254712345678');
      expect(validateAndNormalizeForTalkSasa('0712345678')).toBe('254712345678');
      expect(validateAndNormalizeForTalkSasa('+254712345678')).toBe('254712345678');
    });

    it('should throw PhoneValidationError for invalid phone numbers', () => {
      expect(() => validateAndNormalizeForTalkSasa('255712345678')).toThrow(PhoneValidationError);
      expect(() => validateAndNormalizeForTalkSasa('071234567')).toThrow(PhoneValidationError);
    });
  });

  describe('validateAndNormalizeForInstalipa', () => {
    it('should validate and normalize valid phone numbers', () => {
      expect(validateAndNormalizeForInstalipa('254712345678')).toBe('254712345678');
      expect(validateAndNormalizeForInstalipa('0712345678')).toBe('254712345678');
      expect(validateAndNormalizeForInstalipa('+254712345678')).toBe('254712345678');
    });

    it('should throw PhoneValidationError for invalid phone numbers', () => {
      expect(() => validateAndNormalizeForInstalipa('255712345678')).toThrow(PhoneValidationError);
      expect(() => validateAndNormalizeForInstalipa('071234567')).toThrow(PhoneValidationError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle phone numbers with mixed formatting', () => {
      expect(normalizeForMPesa('+254 (712) 345-678')).toBe('254712345678');
      expect(normalizeForMPesa('0712 345 678')).toBe('254712345678');
    });

    it('should handle phone numbers with extra whitespace', () => {
      expect(normalizeForMPesa('  254712345678  ')).toBe('254712345678');
      expect(normalizeForMPesa('  0712345678  ')).toBe('254712345678');
    });

    it('should validate Safaricom numbers (07xx)', () => {
      expect(isValidKenyanPhone('0712345678')).toBe(true);
      expect(isValidKenyanPhone('0722345678')).toBe(true);
      expect(isValidKenyanPhone('0733345678')).toBe(true);
    });

    it('should validate Airtel numbers (01xx, 07xx)', () => {
      expect(isValidKenyanPhone('0112345678')).toBe(true);
      expect(isValidKenyanPhone('0733345678')).toBe(true);
    });

    it('should validate Telkom numbers (07xx)', () => {
      expect(isValidKenyanPhone('0772345678')).toBe(true);
    });
  });
});
