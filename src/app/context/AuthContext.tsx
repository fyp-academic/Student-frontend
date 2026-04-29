import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  initials?: string;
  profile_image_url?: string;
  department?: string;
  enrolled_courses?: number;
  registration_number?: string;
  degree_programme_id?: string;
  year_of_study?: number;
  education_level?: string;
  nationality?: string;
  college_id?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: Record<string, unknown>) => Promise<void>;
  resendVerification: (email?: string) => Promise<void>;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]   = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    if (token) {
      authApi.me()
        .then((res) => {
          const u = res.data.data ?? res.data;
          setUser(u);
          localStorage.setItem('auth_user', JSON.stringify(u));
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res  = await authApi.login(email, password);
    const data = res.data;
    const t    = data.token ?? data.access_token;
    const u    = data.user  ?? data.data;
    localStorage.setItem('auth_token', t);
    localStorage.setItem('auth_user',  JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const register = async (data: Record<string, unknown>) => {
    const res = await authApi.register(data);
    return res.data;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    await authApi.forgotPassword(email);
  };

  const resetPassword = async (data: Record<string, unknown>) => {
    await authApi.resetPassword(data);
  };

  const resendVerification = async (email?: string) => {
    await authApi.resendVerification(email);
  };

  const verifyEmailCode = async (email: string, code: string) => {
    await authApi.verifyEmailCode(email, code);
  };

  return (
    <AuthContext.Provider value={{
      user, token, isAuthenticated: !!token, isLoading,
      login, register, logout,
      forgotPassword, resetPassword, resendVerification, verifyEmailCode
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
