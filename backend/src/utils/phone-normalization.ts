/**
 * Phone Number Normalization Utilities
 * 
 * Provides functions to normalize and validate Kenyan phone numbers
 * for different API providers (M-Pesa, TalkSasa, Instalipa).
 */

/**
 * Normalize phone number for M-Pesa Daraja API
 * M-Pesa requires format: 254XXXXXXXXX (12 digits, no + or leading 0)
 * 
 * @param phone - Phone number in any format
 * @returns Normalized phone number in format 254XXXXXXXXX
 * @throws Error if phone number is invalid
 */
export function normalizeForMPesa(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  
  // Handle different input formats
  if (cleaned.startsWith('254')) {
    // Already in correct format
    return cleaned;
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    // Remove leading 0 and add 254 (e.g., 0712345678 -> 254712345678)
    return '254' + cleaned.substring(1);
  } else if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) {
    // Add 254 prefix (e.g., 712345678 -> 254712345678)
    return '254' + cleaned;
  }
  
  throw new Error(`Invalid phone number format for M-Pesa: ${phone}`);
}

/**
 * Normalize phone number for TalkSasa SMS API
 * TalkSasa accepts format: 254XXXXXXXXX (12 digits, no +)
 * 
 * @param phone - Phone number in any format
 * @returns Normalized phone number in format 254XXXXXXXXX
 * @throws Error if phone number is invalid
 */
export function normalizeForTalkSasa(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  
  // Handle different input formats
  if (cleaned.startsWith('254')) {
    // Already in correct format
    return cleaned;
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    // Remove leading 0 and add 254
    return '254' + cleaned.substring(1);
  } else if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) {
    // Add 254 prefix
    return '254' + cleaned;
  }
  
  throw new Error(`Invalid phone number format for TalkSasa: ${phone}`);
}

/**
 * Normalize phone number for Instalipa Airtime API
 * Instalipa requires format: 254XXXXXXXXX (12 digits, no + or leading 0)
 * 
 * @param phone - Phone number in any format
 * @returns Normalized phone number in format 254XXXXXXXXX
 * @throws Error if phone number is invalid
 */
export function normalizeForInstalipa(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  
  // Handle different input formats
  if (cleaned.startsWith('254')) {
    // Already in correct format
    return cleaned;
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    // Remove leading 0 and add 254
    return '254' + cleaned.substring(1);
  } else if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) {
    // Add 254 prefix
    return '254' + cleaned;
  }
  
  throw new Error(`Invalid phone number format for Instalipa: ${phone}`);
}

/**
 * Validate if phone number is a valid Kenyan phone number
 * Valid Kenyan numbers:
 * - Start with 254 (country code)
 * - Followed by 7, 1, or 0 (network prefix)
 * - Total length: 12 digits (254 + 9 digits)
 * 
 * @param phone - Phone number to validate
 * @returns true if valid Kenyan phone number, false otherwise
 */
export function isValidKenyanPhone(phone: string): boolean {
  try {
    const cleaned = cleanPhoneNumber(phone);
    
    // Normalize to 254 format
    let normalized: string;
    if (cleaned.startsWith('254')) {
      normalized = cleaned;
    } else if (cleaned.startsWith('0')) {
      normalized = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      normalized = '254' + cleaned;
    } else {
      return false;
    }
    
    // Check length (must be exactly 12 digits)
    if (normalized.length !== 12) {
      return false;
    }
    
    // Check that it starts with 254
    if (!normalized.startsWith('254')) {
      return false;
    }
    
    // Check that the next digit is valid (7, 1, or 0)
    const networkPrefix = normalized.charAt(3);
    if (networkPrefix !== '7' && networkPrefix !== '1' && networkPrefix !== '0') {
      return false;
    }
    
    // Check that all characters are digits
    if (!/^\d+$/.test(normalized)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean phone number by removing spaces, dashes, parentheses, and + sign
 * 
 * @param phone - Phone number to clean
 * @returns Cleaned phone number with only digits
 */
function cleanPhoneNumber(phone: string): string {
  if (!phone) {
    throw new Error('Phone number cannot be empty');
  }
  
  // Remove all non-digit characters except +
  let cleaned = phone.trim().replace(/[\s\-\(\)]/g, '');
  
  // Remove + sign if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  if (cleaned.length === 0) {
    throw new Error('Phone number cannot be empty after cleaning');
  }
  
  return cleaned;
}

/**
 * Validation error for phone numbers
 */
export class PhoneValidationError extends Error {
  constructor(message: string, public readonly phone: string) {
    super(message);
    this.name = 'PhoneValidationError';
  }
}

/**
 * Validate and normalize phone number for M-Pesa
 * Throws PhoneValidationError if invalid
 * 
 * @param phone - Phone number to validate and normalize
 * @returns Normalized phone number
 * @throws PhoneValidationError if invalid
 */
export function validateAndNormalizeForMPesa(phone: string): string {
  if (!isValidKenyanPhone(phone)) {
    throw new PhoneValidationError(
      `Invalid Kenyan phone number: ${phone}. Must be in format 254XXXXXXXXX, 0XXXXXXXXX, or 7XXXXXXXXX`,
      phone
    );
  }
  return normalizeForMPesa(phone);
}

/**
 * Validate and normalize phone number for TalkSasa
 * Throws PhoneValidationError if invalid
 * 
 * @param phone - Phone number to validate and normalize
 * @returns Normalized phone number
 * @throws PhoneValidationError if invalid
 */
export function validateAndNormalizeForTalkSasa(phone: string): string {
  if (!isValidKenyanPhone(phone)) {
    throw new PhoneValidationError(
      `Invalid Kenyan phone number: ${phone}. Must be in format 254XXXXXXXXX, 0XXXXXXXXX, or 7XXXXXXXXX`,
      phone
    );
  }
  return normalizeForTalkSasa(phone);
}

/**
 * Validate and normalize phone number for Instalipa
 * Throws PhoneValidationError if invalid
 * 
 * @param phone - Phone number to validate and normalize
 * @returns Normalized phone number
 * @throws PhoneValidationError if invalid
 */
export function validateAndNormalizeForInstalipa(phone: string): string {
  if (!isValidKenyanPhone(phone)) {
    throw new PhoneValidationError(
      `Invalid Kenyan phone number: ${phone}. Must be in format 254XXXXXXXXX, 0XXXXXXXXX, or 7XXXXXXXXX`,
      phone
    );
  }
  return normalizeForInstalipa(phone);
}
