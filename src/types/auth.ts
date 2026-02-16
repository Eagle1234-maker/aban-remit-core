export type UserRole = 'user' | 'agent' | 'admin' | 'superadmin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  walletNumber: string;
  walletBalance: number;
  currency: string;
  kycStatus: 'pending' | 'approved' | 'rejected';
  floatBalance?: number;
  commissionBalance?: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'airtime' | 'exchange' | 'commission';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  date: string;
  reference: string;
  recipient?: string;
  fee?: number;
}
