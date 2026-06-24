import { apiClient, IS_SIM } from './client';

// ── Alarms API ────────────────────────────────────────────────────────────────
// TODO: [BACKEND] GET   /api/alarms?level=&acked=&from=&to=
//                 POST  /api/alarms              → create alarm
//                 PATCH /api/alarms/:id/ack      { ackedBy }
//                 DELETE /api/alarms/:id         → remove
//                 DELETE /api/alarms             → clear all acked
// ─────────────────────────────────────────────────────────────────────────────

export const alarmsApi = {
  getAll: (params = {}) =>
    IS_SIM ? Promise.resolve([]) : apiClient.get(`/alarms?${new URLSearchParams(params)}`),

  create: (data) =>
    IS_SIM ? Promise.resolve(data) : apiClient.post('/alarms', data),

  ack: (id, ackedBy) =>
    IS_SIM ? Promise.resolve({ id, ackedBy }) : apiClient.patch(`/alarms/${id}/ack`, { ackedBy }),

  remove: (id) =>
    IS_SIM ? Promise.resolve({ id }) : apiClient.delete(`/alarms/${id}`),

  clearAcked: () =>
    IS_SIM ? Promise.resolve() : apiClient.delete('/alarms'),
};
