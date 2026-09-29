'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, usersAPI } from '@/services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,            setUser]            = useState(null);
  const [token,           setToken]           = useState(null);
  const [isLoading,       setIsLoading]       = useState(true);
  const [error,           setError]           = useState('');

  const isAuthenticated = !!token;

  // Load JWT & profile on mount
  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('b12_token') : null;
    if (savedToken) {
      setToken(savedToken);
      usersAPI.getProfile(savedToken)
        .then(data => { if (data?.user) setUser(data.user); })
        .catch(() => {
          localStorage.removeItem('b12_token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password) => {
    setIsLoading(true); setError('');
    try {
      const data = await authAPI.register(email, password);
      if (data?.token) {
        localStorage.setItem('b12_token', data.token);
        setToken(data.token);
        setUser(data.user || { email });
        return { success: true };
      }
      throw new Error(data?.error || 'Registration failed');
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true); setError('');
    try {
      const data = await authAPI.login(email, password);
      if (data?.token) {
        localStorage.setItem('b12_token', data.token);
        setToken(data.token);
        setUser(data.user || { email });
        return { success: true };
      }
      throw new Error(data?.error || 'Login failed');
    } catch (err) {
      const msg = err.message || 'Login failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(token); } catch {}
    localStorage.removeItem('b12_token');
    setToken(null);
    setUser(null);
    setError('');
  }, [token]);

  const clearError = useCallback(() => setError(''), []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, error, register, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
