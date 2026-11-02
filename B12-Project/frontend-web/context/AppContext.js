'use client';
import { createContext, useContext, useReducer, useEffect, useRef } from 'react';

// ─── Initial State ────────────────────────────────────────────────────────────
// Only lightweight, non-sensitive UI state lives here. Everything for signed-in
// users is loaded from the API; this mainly carries the guest flow
// (onboarding → questionnaire → score preview → create account).
const initialState = {
  hydrated: false,
  user: null,               // guest profile { name, age, gender, dietType }
  guestName: '',
  onboardingDone: false,
  riskResult: null,         // { level, percentage, breakdown, suggestions, completedAt, synced }
  pendingAnswers: null,     // guest answers [{ questionKey, answerValue }] waiting to be saved after sign-up
  serverStreak: null,
  serverInsights: [],
  serverCheckinHistory: [],
  bmiData: null,
};

const PERSISTED_KEYS = ['user', 'guestName', 'onboardingDone', 'riskResult', 'pendingAnswers', 'bmiData'];

// ─── Action Creators ──────────────────────────────────────────────────────────
export const setUser            = (user)    => ({ type: 'SET_USER',            payload: user });
export const setGuestName       = (name)    => ({ type: 'SET_GUEST_NAME',      payload: name });
export const completeOnboarding = ()        => ({ type: 'COMPLETE_ONBOARDING' });
export const setRiskResult      = (result)  => ({ type: 'SET_RISK_RESULT',     payload: result });
export const setPendingAnswers  = (answers) => ({ type: 'SET_PENDING_ANSWERS', payload: answers });
export const setStreak          = (streak)  => ({ type: 'SET_SERVER_STREAK',   payload: streak });
export const setServerInsights  = (data)    => ({ type: 'SET_SERVER_INSIGHTS', payload: data });
export const setServerCheckins  = (data)    => ({ type: 'SET_SERVER_CHECKINS', payload: data });
export const setBmiData         = (data)    => ({ type: 'SET_BMI_DATA',        payload: data });
export const resetApp           = ()        => ({ type: 'RESET' });

// ─── Reducer ──────────────────────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':             return { ...state, ...action.payload, hydrated: true };
    case 'SET_USER':            return { ...state, user: action.payload };
    case 'SET_GUEST_NAME':      return { ...state, guestName: action.payload };
    case 'COMPLETE_ONBOARDING': return { ...state, onboardingDone: true };
    case 'SET_RISK_RESULT':     return { ...state, riskResult: action.payload };
    case 'SET_PENDING_ANSWERS': return { ...state, pendingAnswers: action.payload };
    case 'SET_SERVER_STREAK':   return { ...state, serverStreak: action.payload };
    case 'SET_SERVER_INSIGHTS': return { ...state, serverInsights: action.payload };
    case 'SET_SERVER_CHECKINS': return { ...state, serverCheckinHistory: action.payload };
    case 'SET_BMI_DATA':        return { ...state, bmiData: action.payload };
    case 'RESET':               return { ...initialState, hydrated: true };
    default:                    return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext(null);
const STORAGE_KEY = 'b12_app_state';

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const hydratedRef = useRef(false);

  // Load persisted state after mount (avoids server/client hydration mismatches)
  useEffect(() => {
    let saved = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        PERSISTED_KEYS.forEach((k) => { if (parsed[k] !== undefined) saved[k] = parsed[k]; });
      }
    } catch { saved = {}; }
    hydratedRef.current = true;
    dispatch({ type: 'HYDRATE', payload: saved });
  }, []);

  // Persist after hydration
  useEffect(() => {
    if (!hydratedRef.current || !state.hydrated) return;
    try {
      const toSave = {};
      PERSISTED_KEYS.forEach((k) => { toSave[k] = state[k]; });
      const empty = PERSISTED_KEYS.every((k) => !toSave[k]);
      if (empty) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch { /* storage unavailable */ }
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
