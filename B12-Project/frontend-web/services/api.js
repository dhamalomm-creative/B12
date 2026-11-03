// ─── API Service Layer ────────────────────────────────────────────────────────
// Web app ↔ Node/Express backend. Endpoints match backend/node-service/src/routes.
// The JWT is kept in localStorage (same contract as the Android app).

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const TOKEN_KEY = 'b12_token';
const REQUEST_TIMEOUT_MS = 15000;

export const UNAUTHORIZED_EVENT = 'b12:unauthorized';

export function getToken() {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable (private mode) */ }
}

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  const token = auth ? getToken() : null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const finalHeaders = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err?.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. Please try again.', 0);
    }
    throw new ApiError("Can't reach the server. Check your internet connection and try again.", 0);
  }
  clearTimeout(timer);

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }

  if (!res.ok) {
    // A rejected token means the session is over — let the auth layer sign out.
    if (res.status === 401 && token && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { path } }));
    }
    let message = data?.error || data?.message;
    if (!message || message.length > 300) {
      message = res.status === 429
        ? 'Too many attempts. Please wait a few minutes and try again.'
        : res.status >= 500
          ? 'Something went wrong on our side. Please try again shortly.'
          : `Request failed (${res.status}).`;
    }
    throw new ApiError(message, res.status, data);
  }
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (email, password, extraData = {}) =>
    request('/api/auth/register', { method: 'POST', body: { email, password, ...extraData }, auth: false }),

  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password }, auth: false }),

  logout: () => request('/api/auth/logout', { method: 'POST' }).catch(() => {}),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersAPI = {
  getProfile: () => request('/api/users/profile'),
  updateProfile: (data) => request('/api/users/profile', { method: 'POST', body: data }),
  changePassword: (currentPassword, newPassword) =>
    request('/api/users/password', { method: 'POST', body: { currentPassword, newPassword } }),
  deleteAccount: (password) => request('/api/users/me', { method: 'DELETE', body: { password } }),
  getBMILatest: () => request('/api/users/bmi/latest'),
  getBMIHistory: (limit = 10) => request(`/api/users/bmi/history?limit=${limit}`),
  saveBMI: (data) => request('/api/users/bmi', { method: 'POST', body: data }),
};

// ─── Questionnaire ────────────────────────────────────────────────────────────
export const questionnaireAPI = {
  // answers: [{ questionKey, answerValue }]  (scoring v2)
  submit: (answers) => request('/api/questionnaire/submit', { method: 'POST', body: { answers } }),
  getLatest: () => request('/api/questionnaire/latest'),
  getHistory: (limit = 20) => request(`/api/questionnaire/history?limit=${limit}`),
  getById: (id) => request(`/api/questionnaire/${encodeURIComponent(id)}`),
  // Blood test result: { value: number, unit: 'pg/mL' | 'pmol/L' }
  saveLab: (id, lab) => request(`/api/questionnaire/${encodeURIComponent(id)}/lab`, { method: 'PUT', body: lab }),
  deleteLab: (id) => request(`/api/questionnaire/${encodeURIComponent(id)}/lab`, { method: 'DELETE' }),
};

// Backwards-compatible alias
export const questionnaireExtAPI = questionnaireAPI;

// ─── Daily Check-in ───────────────────────────────────────────────────────────
export const checkinAPI = {
  // One check-in per day: POST creates today's entry (409 ALREADY_CHECKED_IN if it exists),
  // PUT edits today's existing entry.
  submitDaily: (scores) => request('/api/checkin/daily', { method: 'POST', body: scores }),
  updateDaily: (scores) => request('/api/checkin/daily', { method: 'PUT', body: scores }),
  // Returns { logs, streak, days }
  getHistory: (days = 7) => request(`/api/checkin/history?days=${days}`),
};

// ─── Insights ─────────────────────────────────────────────────────────────────
export const insightsAPI = {
  get: () => request('/api/insights'),
};
