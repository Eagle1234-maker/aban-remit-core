import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole } from '@/types/auth';
import { api, ApiError } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
  requestOtp: (method: 'sms' | 'email') => Promise<boolean>;
  logout: () => void;
  pendingVerification: boolean;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: 'user' | 'agent';
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

function mapApiUser(apiUser: any): User {
  return {
    id: apiUser.id,
    fullName: apiUser.fullName || apiUser.phone,
    email: apiUser.email || '',
    phone: apiUser.phone,
    role: (apiUser.role?.toLowerCase() || 'user') as UserRole,
    walletNumber: apiUser.walletId || '',
    walletBalance: apiUser.walletBalance ?? 0,
    currency: apiUser.currency || 'KES',
    kycStatus: (apiUser.kycStatus?.toLowerCase() || 'pending') as 'pending' | 'approved' | 'rejected',
    createdAt: apiUser.createdAt || '',
    floatBalance: apiUser.floatBalance,
    commissionBalance: apiUser.commissionBalance,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingVerification, setPendingVerification] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      const tokens = api.getTokens();
      if (!tokens) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await api.getMe();
        setUser(mapApiUser(data.user));
      } catch {
        api.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.getMe();
      setUser(mapApiUser(data.user));
    } catch {
      // silent
    }
  }, []);

  const login = useCallback(async (phone: string, password: string): Promise<boolean> => {
    try {
      const data = await api.login(phone, password);
      setUser(mapApiUser(data.user));
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      return false;
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    try {
      await api.register({
        phone: data.phone,
        password: data.password,
        role: data.role,
        fullName: data.fullName,
        email: data.email,
      });
      setPendingVerification(true);
      return true;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      return false;
    }
  }, []);

  const requestOtp = useCallback(async (method: 'sms' | 'email'): Promise<boolean> => {
    try {
      await api.requestOtp(method);
      return true;
    } catch {
      return false;
    }
  }, []);

  const verifyOtp = useCallback(async (otp: string): Promise<boolean> => {
    try {
      const data = await api.verifyOtp(otp);
      setPendingVerification(false);
      if (data.user) {
        setUser(mapApiUser(data.user));
      } else {
        await refreshUser();
      }
      return true;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      return false;
    }
  }, [refreshUser]);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
    setPendingVerification(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      verifyOtp,
      requestOtp,
      logout,
      pendingVerification,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
