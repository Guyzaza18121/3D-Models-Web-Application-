import { apiClient, IS_SIM } from './client';

// ── Sensors API ───────────────────────────────────────────────────────────────
// TODO: [BACKEND] GET    /api/sensors
//                 POST   /api/sensors         → create
//                 PUT    /api/sensors/:id     → update config
//                 DELETE /api/sensors/:id     → remove
//                 GET    /api/sensors/:id/readings?from=&to=&limit= → time-series
//                 POST   /api/sensors/:id/readings  { value, ts }   → push reading
// ─────────────────────────────────────────────────────────────────────────────

export const sensorsApi = {
  getAll: () =>
    IS_SIM ? Promise.resolve([]) : apiClient.get('/sensors'),

  create: (data) =>
    IS_SIM ? Promise.resolve(data) : apiClient.post('/sensors', data),

  update: (id, data) =>
    IS_SIM ? Promise.resolve({ id, ...data }) : apiClient.put(`/sensors/${id}`, data),

  remove: (id) =>
    IS_SIM ? Promise.resolve({ id }) : apiClient.delete(`/sensors/${id}`),

  getReadings: (id, params = {}) =>
    IS_SIM ? Promise.resolve([]) : apiClient.get(`/sensors/${id}/readings?${new URLSearchParams(params)}`),

  pushReading: (id, value) =>
    IS_SIM ? Promise.resolve() : apiClient.post(`/sensors/${id}/readings`, { value, ts: new Date() }),
};
