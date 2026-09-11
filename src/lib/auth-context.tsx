'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, AuthUser } from './api';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role?: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      // res may be { user: AuthUser } or AuthUser directly depending on response unwrapping
      if (res && 'user' in res) {
        setUser(res.user);
      } else if (res && 'id' in (res as object)) {
        setUser(res as unknown as AuthUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if (res?.user) {
      setUser(res.user);
    } else {
      await refreshUser();
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
  }) => {
    const res = await authApi.register(data);
    if (res?.user) {
      setUser(res.user);
    } else {
      await refreshUser();
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
