/**
 * QR Code Generation Utility
 * 
 * Generates QR codes for transaction receipts.
 * Validates Requirements: 34.3
 */

/**
 * Generate QR code content for a transaction receipt
 * @param reference - Transaction reference
 * @param amount - Transaction amount
 * @param currency - Transaction currency
 * @param date - Transaction date
 * @param hash - Verification hash
 * @returns QR code content as JSON string
 */
export function generateQRCodeContent(
  reference: string,
  amount: number,
  currency: string,
  date: Date,
  hash: string
): string {
  const qrData = {
    reference,
    amount: amount.toFixed(2),
    currency,
    date: date.toISOString(),
    hash
  };
  
  return JSON.stringify(qrData);
}

/**
 * Generate QR code as ASCII art (mock implementation)
 * In production, this would use a proper QR code library
 * @param content - Content to encode in QR code
 * @returns ASCII representation of QR code
 */
export function generateQRCodeASCII(content: string): string {
  // Mock QR code as ASCII art
  // In production, use a library like 'qrcode' to generate actual QR codes
  const lines = [
    '█████████████████████████',
    '█ ▄▄▄▄▄ █▀█ █ ▄▄▄▄▄ █',
    '█ █   █ █▀▀ █ █   █ █',
    '█ █▄▄▄█ █▀█ █ █▄▄▄█ █',
    '█▄▄▄▄▄▄▄█▄█▄█▄▄▄▄▄▄▄█',
    '█▄▄█▄▄▄▄█▄█▄█▄▄█▄▄▄▄█',
    '██ ▄▄▄▄▄ █▀█ █ ▄▄▄▄▄██',
    '█████████████████████████'
  ];
  
  return lines.join('\n') + `\nContent: ${content.substring(0, 50)}...`;
}