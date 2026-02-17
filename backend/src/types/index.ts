// Core type definitions for Aban Remit Core Backend

export type Currency = 'KES' | 'USD' | 'EUR';

export type WalletState = 'ACTIVE' | 'LOCKED' | 'FROZEN' | 'SUSPENDED';

export type KYCStatus = 'VERIFIED' | 'PENDING' | 'UNVERIFIED';

export type WalletType = 'USER' | 'AGENT';

export interface Wallet {
  id: string; // WLT7770001 or AGT8880001
  ownerId: string;
  type: WalletType;
  state: WalletState;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  phone: string;
  passwordHash: string;
  role: 'USER' | 'AGENT' | 'ADMIN';
  walletId: string;
  fullName?: string;
  kycStatus?: KYCStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface WithdrawalConfig {
  otpThreshold: number; // Amount above which OTP is required (in KES)
  otpExpiry: number; // Seconds (default: 300)
}
