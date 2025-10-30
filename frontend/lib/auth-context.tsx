'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { clearTokens, loadTokens, setAuthToken, storeTokens } from './api';

type Officer = {
  id: string;
  official_email: string;
  full_name: string;
  role: 'OFFICER' | 'MODERATOR' | 'ADMIN';
};

type Tokens = {
  access_token: string;
  refresh_token: string;
};

type AuthContextProps = {
  officer: Officer | null;
  tokens: Tokens | null;
  loading: boolean;
  login: (credentials: { service_number: string; official_email: string }) => Promise<void>;
  register: (payload: {
    service_number: string;
    official_email: string;
    full_name: string;
    rank: string;
    station: string;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = loadTokens();
    if (cached) {
      setTokens(cached);
      setAuthToken(cached.access_token);
      api
        .get('/users/me')
        .then((response) => setOfficer(response.data))
        .catch(() => clearTokens())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: { service_number: string; official_email: string }) => {
    const { data } = await api.post('/auth/login', credentials);
    setOfficer(data.officer);
    setTokens(data.tokens);
    storeTokens(data.tokens);
  };

  const register = async (payload: {
    service_number: string;
    official_email: string;
    full_name: string;
    rank: string;
    station: string;
  }) => {
    const { data } = await api.post('/auth/register', payload);
    setOfficer(data.officer);
    setTokens(data.tokens);
    storeTokens(data.tokens);
  };

  const logout = () => {
    setOfficer(null);
    setTokens(null);
    clearTokens();
  };

  const value = useMemo(
    () => ({ officer, tokens, loading, login, register, logout }),
    [officer, tokens, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
