import { describe, it, expect } from 'vitest';
import { maskPhone } from './phone-masking.js';

describe('maskPhone', () => {
  it('should mask international phone number correctly', () => {
    expect(maskPhone('+254712345678')).toBe('****5678');
  });

  it('should mask local phone number correctly', () => {
    expect(maskPhone('0712345678')).toBe('****5678');
  });

  it('should mask short phone number correctly', () => {
    expect(maskPhone('1234')).toBe('****1234');
  });

  it('should handle phone numbers with less than 4 digits', () => {
    expect(maskPhone('123')).toBe('****');
    expect(maskPhone('12')).toBe('****');
    expect(maskPhone('1')).toBe('****');
  });

  it('should handle empty string', () => {
    expect(maskPhone('')).toBe('****');
  });

  it('should handle phone numbers with spaces', () => {
    expect(maskPhone('+254 712 345 678')).toBe('**** 678');
  });

  it('should handle phone numbers with dashes', () => {
    expect(maskPhone('+254-712-345-678')).toBe('****-678');
  });

  it('should always show last 4 characters regardless of format', () => {
    const phone = '+254712345678';
    const masked = maskPhone(phone);
    expect(masked.slice(-4)).toBe(phone.slice(-4));
  });
});
