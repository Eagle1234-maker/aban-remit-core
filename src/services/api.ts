/**
 * API Client for Aban Remit Backend
 * Adapted to match follow-plus.loveameriafrikah.co.ke contract
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://follow-plus.loveameriafrikah.co.ke';

interface TokenPair {
  token: string;
  refreshToken?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // --- Token Management ---

  getTokens(): TokenPair | null {
    const token = localStorage.getItem('aban_token');
    if (!token) return null;
    const refreshToken = localStorage.getItem('aban_refresh_token') || undefined;
    return { token, refreshToken };
  }

  setTokens(tokens: TokenPair) {
    localStorage.setItem('aban_token', tokens.token);
    if (tokens.refreshToken) {
      localStorage.setItem('aban_refresh_token', tokens.refreshToken);
    }
  }

  clearTokens() {
    localStorage.removeItem('aban_token');
    localStorage.removeItem('aban_refresh_token');
    localStorage.removeItem('aban_user');
  }

  getStoredUser() {
    const raw = localStorage.getItem('aban_user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  setStoredUser(user: any) {
    localStorage.setItem('aban_user', JSON.stringify(user));
  }

  // --- HTTP Methods ---

  private async request<T = any>(
    method: string,
    path: string,
    body?: any,
    options?: { skipAuth?: boolean; responseType?: 'json' | 'blob' }
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!options?.skipAuth) {
      const tokens = this.getTokens();
      if (tokens) {
        headers['Authorization'] = `Bearer ${tokens.token}`;
      }
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle 401 — session expired, force logout
    if (res.status === 401 && !options?.skipAuth) {
      this.clearTokens();
      window.location.href = '/login';
      throw new ApiError(401, 'Session expired. Please log in again.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new ApiError(res.status, err.error || err.message || 'Request failed', err);
    }

    if (options?.responseType === 'blob') return res.blob() as any;
    return res.json();
  }

  // --- Public HTTP helpers ---

  get<T = any>(path: string, options?: { skipAuth?: boolean }) {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T = any>(path: string, body?: any, options?: { skipAuth?: boolean }) {
    return this.request<T>('POST', path, body, options);
  }

  put<T = any>(path: string, body?: any) {
    return this.request<T>('PUT', path, body);
  }

  patch<T = any>(path: string, body?: any) {
    return this.request<T>('PATCH', path, body);
  }

  delete<T = any>(path: string) {
    return this.request<T>('DELETE', path);
  }

  // --- Health ---

  async getHealth() {
    return this.get('/health', { skipAuth: true });
  }

  // --- Auth endpoints (matches backend contract) ---

  async login(phone: string, password: string) {
    const data = await this.post('/auth/login', { phone, password }, { skipAuth: true });
    if (data.token) {
      this.setTokens({ token: data.token, refreshToken: data.refreshToken });
    }
    if (data.user) {
      this.setStoredUser(data.user);
    }
    return data;
  }

  async register(payload: { phone: string; password: string; role?: string; fullName?: string; email?: string }) {
    const data = await this.post('/auth/register', payload, { skipAuth: true });
    if (data.token) {
      this.setTokens({ token: data.token, refreshToken: data.refreshToken });
    }
    if (data.user) {
      this.setStoredUser(data.user);
    }
    return data;
  }

  async logout() {
    this.clearTokens();
  }

  // --- OTP (matches backend: /auth/request-otp, /auth/verify-otp) ---

  async requestOtp(method: 'sms' | 'email') {
    return this.post('/auth/request-otp', { method }, { skipAuth: true });
  }

  async verifyOtp(otp: string) {
    const data = await this.post('/auth/verify-otp', { otp }, { skipAuth: true });
    if (data.token) {
      this.setTokens({ token: data.token, refreshToken: data.refreshToken });
    }
    if (data.user) {
      this.setStoredUser(data.user);
    }
    return data;
  }

  // --- Wallet (matches backend: GET /wallet/balance) ---

  async getWalletBalance() {
    return this.get('/wallet/balance');
  }

  // --- Withdraw (matches backend: POST /wallet/withdraw/request, /wallet/withdraw/confirm) ---

  async requestWithdrawal(amount: number, currency: string, phone: string) {
    return this.post('/wallet/withdraw/request', { amount, currency, phone });
  }

  async confirmWithdrawal(amount: number, currency: string, phone: string, otp?: string) {
    return this.post('/wallet/withdraw/confirm', { amount, currency, phone, otp });
  }

  // --- M-Pesa Deposit (matches backend: POST /wallet/deposit/mpesa) ---

  async depositMpesa(payload: { amount: number; phone: string }) {
    return this.post('/wallet/deposit/mpesa', payload);
  }

  // --- Transfer (if available) ---

  async sendMoney(payload: { recipient: string; recipientType: 'wallet' | 'phone' | 'agent'; amount: number; pin: string }) {
    return this.post('/wallet/transfer', payload);
  }

  // --- Airtime ---

  async buyAirtime(payload: { carrier: string; phone: string; amount: number }) {
    return this.post('/wallet/airtime', payload);
  }

  // --- Exchange ---

  async exchangeCurrency(payload: { from: string; to: string; amount: number }) {
    return this.post('/wallet/exchange', payload);
  }

  // --- Security ---

  async changePassword(currentPassword: string, newPassword: string) {
    return this.post('/auth/change-password', { currentPassword, newPassword });
  }

  async changePin(currentPin: string, newPin: string) {
    return this.post('/auth/change-pin', { currentPin, newPin });
  }

  // --- KYC Upload ---

  async submitKyc(formData: FormData) {
    const tokens = this.getTokens();
    const res = await fetch(`${this.baseUrl}/auth/kyc`, {
      method: 'POST',
      headers: tokens ? { Authorization: `Bearer ${tokens.token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new ApiError(res.status, err.error || err.message, err);
    }
    return res.json();
  }

  // --- Profile ---

  async updateProfile(data: { country?: string; city?: string }) {
    return this.patch('/auth/profile', data);
  }

  // --- Transactions (may or may not exist on this backend) ---

  async getTransactions(params?: { type?: string; status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.type && params.type !== 'all') query.set('type', params.type);
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return this.get(`/transactions${qs ? `?${qs}` : ''}`);
  }

  // --- Admin endpoints (may or may not exist) ---

  async getSystemStats() { return this.get('/system/stats'); }
  async getUsers(params?: { search?: string; page?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    return this.get(`/system/users?${query.toString()}`);
  }
  async getKycRequests() { return this.get('/system/kyc'); }
  async approveKyc(userId: string) { return this.post(`/system/kyc/${userId}/approve`); }
  async rejectKyc(userId: string, reason?: string) { return this.post(`/system/kyc/${userId}/reject`, { reason }); }
  async getExchangeRates() { return this.get('/system/exchange-rates'); }
  async updateExchangeRates(rates: Record<string, { buy: number; sell: number }>) { return this.put('/system/exchange-rates', { rates }); }
  async getFeeSettings() { return this.get('/system/fees'); }
  async updateFeeSettings(fees: Record<string, number>) { return this.put('/system/fees', fees); }
  async getSmsSettings() { return this.get('/system/sms-settings'); }
  async sendBulkSms(target: string, message: string) { return this.post('/system/sms/bulk', { target, message }); }

  // --- Agent ---

  async agentDeposit(walletNumber: string, amount: number) { return this.post('/deposits/agent', { walletNumber, amount }); }
  async agentWithdraw(walletNumber: string, amount: number, pin: string) { return this.post('/wallet/withdraw/agent', { walletNumber, amount, pin }); }
  async getCommissions() { return this.get('/wallet/commissions'); }
  async getAgentStats() { return this.get('/wallet/agent-stats'); }

  // --- Wallet lookup ---

  async lookupWallet(walletNumber: string) { return this.get(`/wallet/lookup/${walletNumber}`); }

  // --- Statement ---

  async downloadStatement(fromDate: string, toDate: string) {
    return this.request('GET', `/transactions/statement?from=${fromDate}&to=${toDate}`, undefined, { responseType: 'blob' });
  }

  async toggle2fa(enabled: boolean) { return this.post('/auth/2fa', { enabled }); }
  async getTransactionReceipt(reference: string) {
    return this.request('GET', `/transactions/${reference}/receipt`, undefined, { responseType: 'blob' });
  }
  async updateSmsSettings(settings: any) { return this.put('/system/sms-settings', settings); }
  async updateUserStatus(userId: string, status: string) { return this.patch(`/system/users/${userId}/status`, { status }); }
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

export const api = new ApiClient(API_BASE_URL);
