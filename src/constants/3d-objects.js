// ==========================================
// 3D Object Configuration — try2.glb mappings
// แก้ไขชื่อวัตถุ / mesh / panel key ที่นี่ที่เดียว
// ==========================================

// AC Compressor cubes: mesh name → AC label
export const AC_CUBE_MAP = {
  'AC-05': 'Cube001',
  'AC-04': 'Cube003',
  'AC-03': 'Cube005',
  'AC-02': 'Cube006',
  'AC-01': 'Cube007',
  'AC-06': 'Cube008',
  'AC-07': 'Cube009',
  'AC-08': 'Cube010',
};

// Tank & Flow mesh targets
export const TANK_A_TARGET = 'TANK-A';
export const TANK_B_TARGET = 'TANK-B';
export const FLOW_TARGET   = 'Geom3D078';

// Panels that need bbox center calculation (tanks + flow)
export const BBOX_PANEL_TARGETS = new Set([TANK_A_TARGET, TANK_B_TARGET, FLOW_TARGET]);

// All tracked cubes / meshes for position tracking
export const TRACKED_CUBES = new Set([
  ...Object.values(AC_CUBE_MAP),
  TANK_A_TARGET,
  TANK_B_TARGET,
  FLOW_TARGET,
]);

// Mesh name → friendly display name (e.g. clicked mesh overlay)
// เติมชื่อวัตถุอื่นๆ ใน .glb ที่นี่
export const MESH_NAME_MAP = {
  // Air Dryers
  'Mesh_4831': 'AD-03',
  // TODO: เติม mesh อื่นๆ เช่น 'Mesh_xxxx': 'AD-02',
  // TODO: เติม AC meshes ถ้าต้องการ map เฉพาะ
  // 'Mesh_yyyy': 'ac',
  // 'Mesh_zzzz': 'ad',
  'Geom3D453':'FIM 4.0',
};

// Mesh / Object name → panel key (for click routing)
export const PANEL_KEY_MAP = {
  ...Object.fromEntries(Object.entries(AC_CUBE_MAP).map(([k, v]) => [v, k])),
  [TANK_A_TARGET]: TANK_A_TARGET,
  [TANK_B_TARGET]: TANK_B_TARGET,
  [FLOW_TARGET]:   FLOW_TARGET,
};

// Reverse lookup: AC label → mesh name
export const AC_LABEL_TO_MESH = Object.fromEntries(
  Object.entries(AC_CUBE_MAP).map(([label, mesh]) => [mesh, label])
);

export const getPanelKeyFromName = (name) => {
  if (!name) return null;
  if (AC_CUBE_MAP[name]) return AC_CUBE_MAP[name];   // AC-05 → Cube001
  if (PANEL_KEY_MAP[name]) return PANEL_KEY_MAP[name]; // Cube001 → AC-05
  return TRACKED_CUBES.has(name) ? name : null;
};

// ==========================================
// Future config: เพิ่ม properties ของแต่ละ object ที่นี่
// ==========================================
export const OBJECT_CONFIG = [
  // ตัวอย่าง:
  // { mesh: 'Mesh_4831', key: 'AD-03', type: 'AIR_DRYER', sensorId: null, offset: [0, 0, 0] },
];
