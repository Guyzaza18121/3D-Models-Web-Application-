import { apiClient, IS_SIM } from './client';

// ── System Logs API ───────────────────────────────────────────────────────────
// TODO: [BACKEND] GET    /api/logs?type=&who=&search=&limit=&from=&to=
//                 POST   /api/logs           → create log entry
//                 DELETE /api/logs           → clear logs (ADMIN only)
// ─────────────────────────────────────────────────────────────────────────────

export const logsApi = {
  getAll: (params = {}) =>
    IS_SIM ? Promise.resolve([]) : apiClient.get(`/logs?${new URLSearchParams(params)}`),

  create: (data) =>
    IS_SIM ? Promise.resolve(data) : apiClient.post('/logs', data),

  clear: () =>
    IS_SIM ? Promise.resolve() : apiClient.delete('/logs'),
};
