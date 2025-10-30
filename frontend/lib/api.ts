import axios from 'axios';

type Tokens = {
  access_token: string;
  refresh_token: string;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api',
});

export const setAuthToken = (token?: string) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const storeTokens = (tokens: Tokens) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('nhh_tokens', JSON.stringify(tokens));
  setAuthToken(tokens.access_token);
};

export const clearTokens = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('nhh_tokens');
  setAuthToken(undefined);
};

export const loadTokens = (): Tokens | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('nhh_tokens');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Tokens;
    if (parsed.access_token) {
      setAuthToken(parsed.access_token);
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

export default api;
