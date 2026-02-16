import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '@/types/auth';
import { mockUsers } from '@/data/mock';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  pendingVerification: boolean;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);

  const login = useCallback(async (_email: string, _password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));
    setUser(mockUsers.user);
    return true;
  }, []);

  const register = useCallback(async (_data: RegisterData): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 800));
    setPendingVerification(true);
    return true;
  }, []);

  const verifyOtp = useCallback(async (_otp: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 800));
    setPendingVerification(false);
    setUser(mockUsers.user);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setPendingVerification(false);
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    const roleKey = role === 'superadmin' ? 'admin' : role;
    const mockUser = mockUsers[roleKey];
    if (mockUser) {
      setUser({ ...mockUser, role });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, verifyOtp, logout, switchRole, pendingVerification }}>
      {children}
    </AuthContext.Provider>
  );
};
