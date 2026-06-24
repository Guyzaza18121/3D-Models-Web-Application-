import { apiClient, IS_SIM, setToken } from './client';
import { INIT_USERS } from '../mocks';

// ── Auth API ──────────────────────────────────────────────────────────────────
// TODO: [BACKEND] POST /api/auth/login  → { token, user }
//                 POST /api/auth/logout
//                 GET  /api/users
//                 POST /api/users       → new user
//                 PUT  /api/users/:id   → update
//                 DELETE /api/users/:id → deactivate
// ─────────────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (un, pw) => {
    if (IS_SIM) {
      const u = INIT_USERS.find(x => x.un === un && x.pw === pw);
      return u ? { user: u, token: null } : null;
    }
    const data = await apiClient.post('/auth/login', { un, pw });
    if (data?.token) setToken(data.token);
    return data;
  },

  logout: () =>
    IS_SIM ? Promise.resolve() : apiClient.post('/auth/logout'),

  getUsers: () =>
    IS_SIM ? Promise.resolve([...INIT_USERS]) : apiClient.get('/users'),

  createUser: (data) =>
    IS_SIM ? Promise.resolve(data) : apiClient.post('/users', data),

  updateUser: (id, data) =>
    IS_SIM ? Promise.resolve({ id, ...data }) : apiClient.put(`/users/${id}`, data),

  removeUser: (id) =>
    IS_SIM ? Promise.resolve({ id }) : apiClient.delete(`/users/${id}`),
};
