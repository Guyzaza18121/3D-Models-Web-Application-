import { apiClient, IS_SIM } from './client';

// ── Air Dryer API ─────────────────────────────────────────────────────────────
// TODO: [BACKEND] GET   /api/air-dryers
//                 PUT   /api/air-dryers/:id           → update config
//                 PATCH /api/air-dryers/:id/control   { action: 'START'|'STOP' }
//                 GET   /api/air-dryers/:id/telemetry → live data (or via WS)
// ─────────────────────────────────────────────────────────────────────────────

export const airDryerApi = {
  getAll: () =>
    IS_SIM ? Promise.resolve([]) : apiClient.get('/air-dryers'),

  update: (id, data) =>
    IS_SIM ? Promise.resolve({ id, ...data }) : apiClient.put(`/air-dryers/${id}`, data),

  control: (id, action) =>
    IS_SIM
      ? Promise.resolve({ id, action })
      : apiClient.patch(`/air-dryers/${id}/control`, { action }),
};
