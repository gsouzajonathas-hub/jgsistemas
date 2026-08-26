import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  applySession: (token: string, userData: User) => void;
  logout: () => void;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const applySession = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // Sincroniza sessão Supabase (ex.: retorno do login com Google)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.access_token) return;
      if (localStorage.getItem('token')) return;
      try {
        const res = await authAPI.supabaseSync(session.access_token);
        applySession(res.data.access_token, res.data.user);
      } catch {
        // sincronização falhou; usuário pode tentar novamente
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (!user.permissions || user.permissions.length === 0) return false;
    return user.permissions.includes(permission);
  };

  useEffect(() => {
    const handleLogout = () => setUser(null);
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, applySession, logout, loading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
