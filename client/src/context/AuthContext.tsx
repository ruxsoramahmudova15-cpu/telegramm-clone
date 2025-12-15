import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  sendOTP: (phone: string, displayName?: string) => Promise<{ success: boolean; message: string; isNewUser?: boolean; errors?: string[] }>;
  verifyOTP: (phone: string, code: string) => Promise<{ success: boolean; message: string; errors?: string[] }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await authApi.getMe();
          if (response.success && response.user) {
            setUser(response.user);
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const sendOTP = async (phone: string, displayName?: string) => {
    try {
      const response = await authApi.sendOTP(phone, displayName);
      return { success: response.success, message: response.message, isNewUser: response.isNewUser, errors: response.errors };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Xatolik yuz berdi';
      const errors = error.response?.data?.errors;
      return { success: false, message, errors };
    }
  };

  const verifyOTP = async (phone: string, code: string) => {
    try {
      const response = await authApi.verifyOTP(phone, code);
      if (response.success && response.token && response.user) {
        localStorage.setItem('token', response.token);
        setToken(response.token);
        setUser(response.user);
      }
      return { success: response.success, message: response.message, errors: response.errors };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Xatolik yuz berdi';
      const errors = error.response?.data?.errors;
      return { success: false, message, errors };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, sendOTP, verifyOTP, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
