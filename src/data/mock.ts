import { User, Transaction } from '@/types/auth';

export const mockUsers: Record<string, User> = {
  user: {
    id: '1',
    fullName: 'Laban Mwangi',
    email: 'laban@abanremit.com',
    phone: '+254712345678',
    role: 'user',
    walletNumber: 'WLT7770001',
    walletBalance: 24500.00,
    currency: 'KES',
    kycStatus: 'approved',
    createdAt: '2025-01-15',
  },
  agent: {
    id: '2',
    fullName: 'Jane Wanjiku',
    email: 'jane@abanremit.com',
    phone: '+254798765432',
    role: 'agent',
    walletNumber: 'AGT8880001',
    walletBalance: 150000.00,
    currency: 'KES',
    kycStatus: 'approved',
    floatBalance: 350000.00,
    commissionBalance: 12450.00,
    createdAt: '2024-11-20',
  },
  admin: {
    id: '3',
    fullName: 'Admin User',
    email: 'admin@abanremit.com',
    phone: '+254700000000',
    role: 'admin',
    walletNumber: 'ADM0001',
    walletBalance: 0,
    currency: 'KES',
    kycStatus: 'approved',
    createdAt: '2024-01-01',
  },
};

export const mockTransactions: Transaction[] = [
  { id: 'TXN001', type: 'deposit', amount: 5000, currency: 'KES', status: 'completed', description: 'MPESA Deposit', date: '2026-02-15 14:30', reference: 'REF001', fee: 0 },
  { id: 'TXN002', type: 'transfer', amount: 2000, currency: 'KES', status: 'completed', description: 'Send to WLT7770012', date: '2026-02-15 10:15', reference: 'REF002', recipient: 'WLT7770012', fee: 25 },
  { id: 'TXN003', type: 'airtime', amount: 500, currency: 'KES', status: 'completed', description: 'Safaricom Airtime', date: '2026-02-14 18:00', reference: 'REF003', fee: 5 },
  { id: 'TXN004', type: 'withdrawal', amount: 10000, currency: 'KES', status: 'pending', description: 'MPESA Withdrawal', date: '2026-02-14 12:00', reference: 'REF004', fee: 50 },
  { id: 'TXN005', type: 'exchange', amount: 100, currency: 'USD', status: 'completed', description: 'USD to KES Exchange', date: '2026-02-13 09:30', reference: 'REF005', fee: 150 },
  { id: 'TXN006', type: 'deposit', amount: 15000, currency: 'KES', status: 'completed', description: 'Card Deposit', date: '2026-02-12 16:45', reference: 'REF006', fee: 100 },
  { id: 'TXN007', type: 'transfer', amount: 3500, currency: 'KES', status: 'failed', description: 'Send to +254711222333', date: '2026-02-11 11:20', reference: 'REF007', fee: 0 },
  { id: 'TXN008', type: 'commission', amount: 250, currency: 'KES', status: 'completed', description: 'Deposit Commission', date: '2026-02-10 08:00', reference: 'REF008', fee: 0 },
];

export const mockAdminStats = {
  totalUsers: 12458,
  totalAgents: 342,
  totalVolume: 45_200_000,
  totalRevenue: 1_280_000,
  todayTransactions: 3421,
  activeUsers: 8934,
};

export const mockChartData = [
  { name: 'Mon', volume: 4200000, transactions: 450 },
  { name: 'Tue', volume: 5100000, transactions: 520 },
  { name: 'Wed', volume: 3800000, transactions: 410 },
  { name: 'Thu', volume: 6200000, transactions: 680 },
  { name: 'Fri', volume: 7100000, transactions: 720 },
  { name: 'Sat', volume: 5500000, transactions: 550 },
  { name: 'Sun', volume: 3200000, transactions: 340 },
];

export const mockExchangeRates = {
  USD: { buy: 128.50, sell: 131.20 },
  EUR: { buy: 139.80, sell: 142.50 },
  GBP: { buy: 162.30, sell: 165.10 },
};
