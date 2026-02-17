import { maskPhone } from './phone-masking.js';

/**
 * SMS template functions for transaction notifications
 * Requirements: 32.6, 33.1
 */

export interface SMSTemplates {
  deposit: (amount: number, senderPhone: string, mpesaRef: string, newBalance: number) => string;
  withdrawal: (amount: number, fee: number, reference: string, newBalance: number) => string;
  transferSent: (amount: number, recipient: string, fee: number, newBalance: number) => string;
  transferReceived: (amount: number, sender: string, newBalance: number) => string;
}

/**
 * Generate deposit SMS notification
 * Format: "ABAN REMIT: Deposit of KES X received from 2547XXXXXXX. MPESA Ref: XXX New Balance: KES Y."
 * 
 * @param amount - Deposit amount
 * @param senderPhone - Sender's phone number (will be masked)
 * @param mpesaRef - MPESA receipt/reference number
 * @param newBalance - New wallet balance after deposit
 * @returns Formatted SMS message
 * 
 * Requirements: 32.6
 */
export function generateDepositSMS(
  amount: number,
  senderPhone: string,
  mpesaRef: string,
  newBalance: number
): string {
  const maskedPhone = maskPhone(senderPhone);
  return `ABAN REMIT: Deposit of KES ${amount.toFixed(2)} received from ${maskedPhone}. MPESA Ref: ${mpesaRef} New Balance: KES ${newBalance.toFixed(2)}.`;
}

/**
 * Generate withdrawal SMS notification
 * Format: "ABAN REMIT: You have withdrawn KES X. Fee: KES Y Reference: TXN123 Available Balance: KES Z."
 * 
 * @param amount - Withdrawal amount
 * @param fee - Transaction fee
 * @param reference - Transaction reference
 * @param newBalance - New wallet balance after withdrawal
 * @returns Formatted SMS message
 * 
 * Requirements: 33.1
 */
export function generateWithdrawalSMS(
  amount: number,
  fee: number,
  reference: string,
  newBalance: number
): string {
  return `ABAN REMIT: You have withdrawn KES ${amount.toFixed(2)}. Fee: KES ${fee.toFixed(2)} Reference: ${reference} Available Balance: KES ${newBalance.toFixed(2)}.`;
}

/**
 * Generate transfer sent SMS notification
 * 
 * @param amount - Transfer amount
 * @param recipient - Recipient identifier
 * @param fee - Transaction fee
 * @param newBalance - New wallet balance after transfer
 * @returns Formatted SMS message
 */
export function generateTransferSentSMS(
  amount: number,
  recipient: string,
  fee: number,
  newBalance: number
): string {
  return `ABAN REMIT: You sent KES ${amount.toFixed(2)} to ${recipient}. Fee: KES ${fee.toFixed(2)} New Balance: KES ${newBalance.toFixed(2)}.`;
}

/**
 * Generate transfer received SMS notification
 * 
 * @param amount - Transfer amount
 * @param sender - Sender identifier
 * @param newBalance - New wallet balance after receiving transfer
 * @returns Formatted SMS message
 */
export function generateTransferReceivedSMS(
  amount: number,
  sender: string,
  newBalance: number
): string {
  return `ABAN REMIT: You received KES ${amount.toFixed(2)} from ${sender}. New Balance: KES ${newBalance.toFixed(2)}.`;
}

// Export templates object for convenience
export const smsTemplates: SMSTemplates = {
  deposit: generateDepositSMS,
  withdrawal: generateWithdrawalSMS,
  transferSent: generateTransferSentSMS,
  transferReceived: generateTransferReceivedSMS
};
