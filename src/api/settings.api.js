import { apiClient, IS_SIM } from './client';

// ── System Settings API ───────────────────────────────────────────────────────
// TODO: [BACKEND] GET  /api/settings        → singleton doc (id: 'system')
//                 PUT  /api/settings        → full update
//                 PATCH /api/settings       → partial update
// ─────────────────────────────────────────────────────────────────────────────

export const settingsApi = {
  get: () =>
    IS_SIM ? Promise.resolve(null) : apiClient.get('/settings'),

  update: (data) =>
    IS_SIM ? Promise.resolve(data) : apiClient.put('/settings', data),

  patch: (data) =>
    IS_SIM ? Promise.resolve(data) : apiClient.patch('/settings', data),
};
