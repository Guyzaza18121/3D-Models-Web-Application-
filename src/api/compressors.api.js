import { apiClient, IS_SIM } from './client';
import { INIT_COMPS } from '../mocks';

const norm = c => ({ ...c, id: c._id?.toString() ?? c.id });

// ── Compressors API ───────────────────────────────────────────────────────────
// TODO: [BACKEND] GET    /api/compressors
//                 POST   /api/compressors        → create
//                 PUT    /api/compressors/:id    → update spec
//                 DELETE /api/compressors/:id    → remove
//                 PATCH  /api/compressors/:id/control  { action: 'START'|'STOP'|'RESET' }
//                 GET    /api/compressors/:id/telemetry → live data (or via WS)
// ─────────────────────────────────────────────────────────────────────────────

export const compressorsApi = {
  getAll: () =>
    IS_SIM ? Promise.resolve([...INIT_COMPS]) : apiClient.get('/compressors').then(cs => cs.map(norm)),

  create: (spec) =>
    IS_SIM ? Promise.resolve(spec) : apiClient.post('/compressors', spec).then(norm),

  update: (id, data) =>
    IS_SIM ? Promise.resolve({ id, ...data }) : apiClient.put(`/compressors/${id}`, data).then(norm),

  remove: (id) =>
    IS_SIM ? Promise.resolve({ id }) : apiClient.delete(`/compressors/${id}`),

  control: (id, action) =>
    IS_SIM
      ? Promise.resolve({ id, action })
      : apiClient.patch(`/compressors/${id}/control`, { action }).then(norm),
};
