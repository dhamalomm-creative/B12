'use client';
import { createContext, useContext, useReducer, useEffect } from 'react';

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState = {
  user: null,               // { name, age, gender, dietType }
  guestName: '',
  onboardingDone: false,
  riskResult: null,         // { level, percentage, breakdown, suggestions }
  dailyLogs: [],
  streak: 0,
  serverStreak: null,
  serverInsights: [],
  serverCheckinHistory: [],
};

// ─── Action Creators ──────────────────────────────────────────────────────────
export const setUser            = (user)    => ({ type: 'SET_USER',           payload: user });
export const setGuestName       = (name)    => ({ type: 'SET_GUEST_NAME',      payload: name });
export const completeOnboarding = ()        => ({ type: 'COMPLETE_ONBOARDING' });
export const setRiskResult      = (result)  => ({ type: 'SET_RISK_RESULT',     payload: result });
export const addDailyLog        = (log)     => ({ type: 'ADD_DAILY_LOG',       payload: log });
export const setStreak          = (streak)  => ({ type: 'SET_STREAK',          payload: streak });
export const setServerInsights  = (data)    => ({ type: 'SET_SERVER_INSIGHTS', payload: data });
export const setServerCheckins  = (data)    => ({ type: 'SET_SERVER_CHECKINS', payload: data });

// ─── Reducer ──────────────────────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':           return { ...state, user: action.payload };
    case 'SET_GUEST_NAME':     return { ...state, guestName: action.payload };
    case 'COMPLETE_ONBOARDING':return { ...state, onboardingDone: true };
    case 'SET_RISK_RESULT':    return { ...state, riskResult: action.payload };
    case 'ADD_DAILY_LOG':      return { ...state, dailyLogs: [...state.dailyLogs, action.payload] };
    case 'SET_STREAK':         return { ...state, streak: action.payload };
    case 'SET_SERVER_STREAK':  return { ...state, serverStreak: action.payload };
    case 'SET_SERVER_INSIGHTS':return { ...state, serverInsights: action.payload };
    case 'SET_SERVER_CHECKINS':return { ...state, serverCheckinHistory: action.payload };
    case 'RESET':              return initialState;
    default:                   return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

const STORAGE_KEY = 'b12_app_state';

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState, () => {
    if (typeof window === 'undefined') return initialState;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...initialState, ...JSON.parse(saved) } : initialState;
    } catch { return initialState; }
  });

  // Persist to localStorage on state change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const { serverInsights, serverStreak, serverCheckinHistory, ...persistable } = state;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
      } catch {}
    }
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
