// ──────────────────────────────────────────────────────────────────────────────
// API Client — base fetch wrapper
// Set VITE_API_URL in .env.local to point at the Express backend.
// When VITE_SIMULATION_MODE="true" → IS_SIM=true and api.* calls
// resolve with local mock data instead of hitting the network.
// Default is real-mode (Node-RED / backend preferred).
// ──────────────────────────────────────────────────────────────────────────────

export const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export const IS_SIM = import.meta.env.VITE_SIMULATION_MODE === 'true';

// ── Token helpers (JWT from MongoDB/Auth backend) ────────────────────────────
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY ?? 'fim_token';
export const getToken  = ()        => localStorage.getItem(TOKEN_KEY);
export const setToken  = (t)       => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = ()       => localStorage.removeItem(TOKEN_KEY);

// ── Core request ─────────────────────────────────────────────────────────────
async function request(method, path, body) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body != null && { body: JSON.stringify(body) }),
  });

  if (res.status === 401) {
    clearToken();
    throw new Error('[API] 401 Unauthorized — token cleared');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`[API] ${method} /api${path} → ${res.status}${text ? ': ' + text : ''}`);
  }
  return res.json();
}

export const apiClient = {
  get:    (path)       => request('GET',    path),
  post:   (path, body) => request('POST',   path, body),
  put:    (path, body) => request('PUT',    path, body),
  patch:  (path, body) => request('PATCH',  path, body),
  delete: (path)       => request('DELETE', path),
};
