/**
 * React Query hooks for all API data fetching
 * Adapted to follow-plus.loveameriafrikah.co.ke backend contract
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/services/api';
import { toast } from 'sonner';

// --- Health ---

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.getHealth(),
    retry: 2,
    staleTime: 60_000,
  });
}

// --- Wallet ---

export function useWalletBalance() {
  return useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => api.getWalletBalance(),
    retry: 1,
  });
}

export function useWalletLookup(walletNumber: string) {
  return useQuery({
    queryKey: ['wallet', 'lookup', walletNumber],
    queryFn: () => api.lookupWallet(walletNumber),
    enabled: !!walletNumber && /^(WLT|AGT)\d{7}$/.test(walletNumber),
  });
}

// --- Transactions ---

export function useTransactions(params?: { type?: string; status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => api.getTransactions(params),
    retry: 1,
  });
}

// --- Admin ---

export function useSystemStats() {
  return useQuery({
    queryKey: ['system', 'stats'],
    queryFn: () => api.getSystemStats(),
    retry: 1,
  });
}

export function useUsers(params?: { search?: string; page?: number }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => api.getUsers(params),
    retry: 1,
  });
}

export function useKycRequests() {
  return useQuery({
    queryKey: ['kyc', 'requests'],
    queryFn: () => api.getKycRequests(),
    retry: 1,
  });
}

export function useExchangeRates() {
  return useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => api.getExchangeRates(),
    retry: 1,
  });
}

export function useFeeSettings() {
  return useQuery({
    queryKey: ['fees'],
    queryFn: () => api.getFeeSettings(),
    retry: 1,
  });
}

export function useSmsSettings() {
  return useQuery({
    queryKey: ['sms-settings'],
    queryFn: () => api.getSmsSettings(),
    retry: 1,
  });
}

// --- Agent ---

export function useAgentStats() {
  return useQuery({
    queryKey: ['agent', 'stats'],
    queryFn: () => api.getAgentStats(),
    retry: 1,
  });
}

export function useCommissions() {
  return useQuery({
    queryKey: ['agent', 'commissions'],
    queryFn: () => api.getCommissions(),
    retry: 1,
  });
}

// --- Mutations ---

export function useSendMoney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { recipient: string; recipientType: 'wallet' | 'phone' | 'agent'; amount: number; pin: string }) =>
      api.sendMoney(payload),
    onSuccess: () => {
      toast.success('Money sent successfully!');
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: ApiError) => toast.error(err.message),
  });
}

export function useDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { amount: number; phone: string }) =>
      api.depositMpesa(payload),
    onSuccess: () => {
      toast.success('M-Pesa STK push sent! Check your phone.');
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: ApiError) => toast.error(err.message),
  });
}

export function useWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { amount: number; currency: string; phone: string; otp?: string }) =>
      api.confirmWithdrawal(payload.amount, payload.currency, payload.phone, payload.otp),
    onSuccess: () => {
      toast.success('Withdrawal processed!');
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: ApiError) => toast.error(err.message),
  });
}

export function useBuyAirtime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { carrier: string; phone: string; amount: number }) =>
      api.buyAirtime(payload),
    onSuccess: () => {
      toast.success('Airtime purchased!');
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: ApiError) => toast.error(err.message),
  });
}

export function useExchangeCurrency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { from: string; to: string; amount: number }) =>
      api.exchangeCurrency(payload),
    onSuccess: () => {
      toast.success('Exchange completed!');
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: ApiError) => toast.error(err.message),
  });
}

export function useAgentDepositMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { walletNumber: string; amount: number }) =>
      api.agentDeposit(payload.walletNumber, payload.amount),
    onSuccess: () => {
      toast.success('Deposit successful!');
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: ApiError) => toast.error(err.message),
  });
}

export function useAgentWithdrawMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { walletNumber: string; amount: number; pin: string }) =>
      api.agentWithdraw(payload.walletNumber, payload.amount, payload.pin),
    onSuccess: () => {
      toast.success('Withdrawal processed!');
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: ApiError) => toast.error(err.message),
  });
}

export function useUpdateExchangeRates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rates: Record<string, { buy: number; sell: number }>) =>
      api.updateExchangeRates(rates),
    onSuccess: () => {
      toast.success('Exchange rates updated!');
      qc.invalidateQueries({ queryKey: ['exchange-rates'] });
    },
    onError: (err: ApiError) => toast.error(err.message),
  });
}

export function useUpdateFees() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fees: Record<string, number>) => api.updateFeeSettings(fees),
    onSuccess: () => {
      toast.success('Fees updated!');
      qc.invalidateQueries({ queryKey: ['fees'] });
    },
    onError: (err: ApiError) => toast.error(err.message),
  });
}

export function useApproveKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.approveKyc(userId),
    onSuccess: () => {
      toast.success('KYC approved!');
      qc.invalidateQueries({ queryKey: ['kyc'] });
    },
    onError: (err: ApiError) => toast.error(err.message),
  });
}

export function useRejectKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      api.rejectKyc(userId, reason),
    onSuccess: () => {
      toast.success('KYC rejected');
      qc.invalidateQueries({ queryKey: ['kyc'] });
    },
    onError: (err: ApiError) => toast.error(err.message),
  });
}

export function useSendBulkSms() {
  return useMutation({
    mutationFn: ({ target, message }: { target: string; message: string }) =>
      api.sendBulkSms(target, message),
    onSuccess: () => toast.success('Bulk SMS sent!'),
    onError: (err: ApiError) => toast.error(err.message),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      api.changePassword(currentPassword, newPassword),
    onSuccess: () => toast.success('Password updated!'),
    onError: (err: ApiError) => toast.error(err.message),
  });
}

export function useChangePin() {
  return useMutation({
    mutationFn: ({ currentPin, newPin }: { currentPin: string; newPin: string }) =>
      api.changePin(currentPin, newPin),
    onSuccess: () => toast.success('PIN updated!'),
    onError: (err: ApiError) => toast.error(err.message),
  });
}
