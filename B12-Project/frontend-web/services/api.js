// ─── API Service Layer ────────────────────────────────────────────────────────
// Web app ↔ Backend integration layer.
// All endpoints match the Node.js Express backend routes exactly.
// JWT token stored in localStorage.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('b12_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const url   = `${BASE_URL}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { error: text }; }

  if (!res.ok) {
    const err = new Error(data?.error || data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (email, password) =>
    request('/api/auth/register', {
      method: 'POST',
      body:   JSON.stringify({ email, password }),
    }),

  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body:   JSON.stringify({ email, password }),
    }),

  logout: () =>
    request('/api/auth/logout', { method: 'POST' }).catch(() => {}),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersAPI = {
  getProfile: () => request('/api/users/profile'),

  updateProfile: (data) =>
    request('/api/users/profile', { method: 'POST', body: JSON.stringify(data) }),

  changePassword: (currentPassword, newPassword) =>
    request('/api/users/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  deleteAccount: () =>
    request('/api/users/me', { method: 'DELETE' }),

  getBMILatest: () => request('/api/users/bmi/latest'),

  getBMIHistory: (limit = 10) => request(`/api/users/bmi/history?limit=${limit}`),

  saveBMI: (data) =>
    request('/api/users/bmi', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Questionnaire ────────────────────────────────────────────────────────────
export const questionnaireAPI = {
  getQuestions: () => request('/api/questionnaire/questions'),

  submit: (answers) =>
    request('/api/questionnaire/submit', {
      method: 'POST',
      body:   JSON.stringify({ answers }),
    }),
};

// ─── Daily Check-in ───────────────────────────────────────────────────────────
export const checkinAPI = {
  submitDaily: (scores) =>
    request('/api/checkin/daily', { method: 'POST', body: JSON.stringify(scores) }),

  // Returns { logs, streak, days } — streak is embedded in the response
  getHistory: (days = 7) => request(`/api/checkin/history?days=${days}`),
};

// ─── Insights ─────────────────────────────────────────────────────────────────
export const insightsAPI = {
  get: () => request('/api/insights'),
};

// ─── Questionnaire (additional) ───────────────────────────────────────────────
export const questionnaireExtAPI = {
  getLatest: () => request('/api/questionnaire/latest'),
  getHistory: () => request('/api/questionnaire/history'),
};
