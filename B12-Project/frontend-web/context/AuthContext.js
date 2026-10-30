'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, usersAPI } from '@/services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const isAuthenticated = !!token;

  const buildUserData = (backendUser, profile) => {
    return {
      id: backendUser?.id || profile?.user_id,
      email: backendUser?.email || '',
      name: profile?.name || '',
      age: profile?.age ? String(profile.age) : '',
      gender: profile?.gender || '',
      dietType: profile?.diet_type || '',
    };
  };

  // Load JWT & profile on mount
  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('b12_token') : null;
    if (savedToken) {
      setToken(savedToken);
      usersAPI.getProfile()
        .then(data => {
          if (data?.user) {
            setUser(buildUserData(data.user, data.profile));
          }
        })
        .catch(() => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('b12_token');
            localStorage.removeItem('b12_app_state');
          }
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password, extraData = {}) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await authAPI.register(email, password, extraData);
      if (data?.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('b12_token', data.token);
        }
        setToken(data.token);

        let mergedUser = {
          id: data.user?.id,
          email: data.user?.email || email,
          name: extraData.name || '',
          age: extraData.age ? String(extraData.age) : '',
          gender: extraData.gender || '',
          dietType: extraData.dietType || '',
        };

        try {
          const profileData = await usersAPI.getProfile();
          if (profileData?.user) {
            mergedUser = buildUserData(profileData.user, profileData.profile);
          }
        } catch {}

        setUser(mergedUser);
        return { success: true, user: mergedUser };
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
    setIsLoading(true);
    setError('');
    try {
      const data = await authAPI.login(email, password);
      if (data?.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('b12_token', data.token);
        }
        setToken(data.token);

        let mergedUser = {
          id: data.user?.id,
          email: data.user?.email || email,
          name: '',
          age: '',
          gender: '',
          dietType: '',
        };

        try {
          const profileData = await usersAPI.getProfile();
          if (profileData?.user) {
            mergedUser = buildUserData(profileData.user, profileData.profile);
          }
        } catch {}

        setUser(mergedUser);
        return { success: true, user: mergedUser };
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
    try {
      await authAPI.logout();
    } catch {}

    if (typeof window !== 'undefined') {
      localStorage.removeItem('b12_token');
      localStorage.removeItem('b12_app_state');
    }
    setToken(null);
    setUser(null);
    setError('');
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser(prev => ({
      ...prev,
      ...updatedFields,
    }));
  }, []);

  const clearError = useCallback(() => setError(''), []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isLoading,
      error,
      register,
      login,
      logout,
      updateUser,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
