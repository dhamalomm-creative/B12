'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, usersAPI, questionnaireAPI, getToken, setToken, UNAUTHORIZED_EVENT } from '@/services/api';
import { useApp, resetApp, setRiskResult, setPendingAnswers } from '@/context/AppContext';
import { normalizeServerResult } from '@/utils/riskCalculator';

const AuthContext = createContext(null);

const buildUserData = (backendUser, profile) => ({
  id: backendUser?.id || profile?.user_id || null,
  email: backendUser?.email || '',
  createdAt: backendUser?.created_at || null,
  name: profile?.name || '',
  age: profile?.age ? Number(profile.age) : '',
  gender: profile?.gender || '',
  dietType: profile?.diet_type || '',
});

export function AuthProvider({ children }) {
  const { state: appState, dispatch } = useApp();
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const isAuthenticated = !!token;

  const clearSession = useCallback(() => {
    setToken(null);
    setTokenState(null);
    setUser(null);
    dispatch(resetApp());
  }, [dispatch]);

  const loadProfile = useCallback(async () => {
    const data = await usersAPI.getProfile();
    const u = buildUserData(data?.user, data?.profile);
    setUser(u);
    return u;
  }, []);

  // Restore session on first load
  useEffect(() => {
    const saved = getToken();
    if (!saved) { setIsLoading(false); return; }
    setTokenState(saved);
    loadProfile()
      .catch((err) => {
        // Only a rejected token ends the session — a network blip shouldn't sign people out.
        if (err?.status === 401 || err?.status === 403) clearSession();
        else setUser((prev) => prev || { id: null, email: '', name: '', age: '', gender: '', dietType: '' });
      })
      .finally(() => setIsLoading(false));
  }, [loadProfile, clearSession]);

  // Any API call that comes back 401 signs the user out
  useEffect(() => {
    const onUnauthorized = () => clearSession();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [clearSession]);

  // Save a guest's finished assessment to their new/existing account
  const syncPendingAssessment = useCallback(async () => {
    const pending = appState.pendingAnswers;
    if (!pending || !pending.length) return null;
    try {
      const data = await questionnaireAPI.submit(pending);
      const result = normalizeServerResult(data);
      if (result) dispatch(setRiskResult(result));
      dispatch(setPendingAnswers(null));
      return result;
    } catch {
      return null; // keep pending answers so we can retry later
    }
  }, [appState.pendingAnswers, dispatch]);

  const startSession = useCallback(async (data) => {
    setToken(data.token);
    setTokenState(data.token);
    let u = { id: data.user?.id, email: data.user?.email || '', name: '', age: '', gender: '', dietType: '' };
    try { u = await loadProfile(); } catch { setUser(u); }
    return u;
  }, [loadProfile]);

  const register = useCallback(async (email, password, extraData = {}) => {
    setError('');
    try {
      const data = await authAPI.register(email, password, extraData);
      if (!data?.token) throw new Error('Registration failed. Please try again.');
      const u = await startSession(data);
      const synced = await syncPendingAssessment();
      return { success: true, user: u, syncedAssessment: !!synced };
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setError(msg);
      return { success: false, error: msg, status: err.status };
    }
  }, [startSession, syncPendingAssessment]);

  const login = useCallback(async (email, password) => {
    setError('');
    try {
      const data = await authAPI.login(email, password);
      if (!data?.token) throw new Error('Login failed. Please try again.');
      const u = await startSession(data);
      const synced = await syncPendingAssessment();
      return { success: true, user: u, syncedAssessment: !!synced };
    } catch (err) {
      const msg = err.message || 'Login failed';
      setError(msg);
      return { success: false, error: msg, status: err.status };
    }
  }, [startSession, syncPendingAssessment]);

  const logout = useCallback(async () => {
    await authAPI.logout();
    clearSession();
    setError('');
  }, [clearSession]);

  /** Save profile fields to the server, then refresh local user. Throws on failure. */
  const updateProfile = useCallback(async (fields) => {
    await usersAPI.updateProfile(fields);
    return loadProfile();
  }, [loadProfile]);

  const updateUser = useCallback((fields) => setUser((prev) => ({ ...prev, ...fields })), []);
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
      clearSession,
      updateProfile,
      refreshProfile: loadProfile,
      updateUser,
      clearError,
      syncPendingAssessment,
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
