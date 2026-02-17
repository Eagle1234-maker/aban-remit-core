/**
 * Masks a phone number showing only the last 4 digits
 * @param phone - Full phone number (e.g., "+254712345678")
 * @returns Masked phone number (e.g., "****5678")
 * 
 * Requirements: 31.2
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) {
    return '****';
  }
  return '****' + phone.slice(-4);
}
