// ── helpers ───────────────────────────────────────────────────────────────────
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const rnd = (lo, hi) => lo + Math.random() * (hi - lo);

// ── design tokens ─────────────────────────────────────────────────────────────
export const C = {
  bg: "#F0F4FF", bgCard: "#FFFFFF", bgSidebar: "#FFFFFF",
  accent: "#1D4ED8", accentLight: "#3B82F6", accentSoft: "#DBEAFE", accentBorder: "#BFDBFE",
  navy: "#0B1F4B", text: "#0F172A", textMid: "#334155", textSoft: "#64748B", textFaint: "#94A3B8",
  green: "#16A34A", greenLight: "#DCFCE7", greenBorder: "#86EFAC",
  red: "#DC2626", redLight: "#FEE2E2", redBorder: "#FCA5A5",
  amber: "#D97706", amberLight: "#FEF3C7", amberBorder: "#FCD34D",
  border: "#E2E8F0",
  shadow: "0 1px 3px rgba(0,0,0,0.08)",
  shadowMd: "0 4px 6px -1px rgba(0,0,0,0.07)",
};

export const ROLES = ["ADMIN", "ENGINEER", "OPERATOR", "VIEWER"];
export const PERMS = {
  ADMIN:    { ctrl: true,  cfg: true,  users: true,  del: true  },
  ENGINEER: { ctrl: true,  cfg: true,  users: false, del: true  },
  OPERATOR: { ctrl: true,  cfg: false, users: false, del: false },
  VIEWER:   { ctrl: false, cfg: false, users: false, del: false },
};
export const ROLE_META = {
  ADMIN:    { bg: "#EDE9FE", bd: "#8B5CF6", tx: "#5B21B6", icon: "👑" },
  ENGINEER: { bg: "#DBEAFE", bd: "#3B82F6", tx: "#1D4ED8", icon: "🔧" },
  OPERATOR: { bg: "#DCFCE7", bd: "#22C55E", tx: "#15803D", icon: "🎛️" },
  VIEWER:   { bg: "#FEF9C3", bd: "#EAB308", tx: "#A16207", icon: "👁️" },
};
export const ST_META = {
  RUNNING: { bg: "#DCFCE7", bd: "#16A34A", dot: "#16A34A", tx: "#15803D", label: "RUNNING" },
  STANDBY: { bg: "#DBEAFE", bd: "#3B82F6", dot: "#3B82F6", tx: "#1D4ED8", label: "STANDBY" },
  FAULT:   { bg: "#FEE2E2", bd: "#DC2626", dot: "#DC2626", tx: "#991B1B", label: "FAULT"   },
};
export const LOG_META = {
  SEQ:   { clr: "#3B82F6", bg: "#DBEAFE", icon: "🔄", label: "SEQUENCE" },
  CTRL:  { clr: "#16A34A", bg: "#DCFCE7", icon: "▶",  label: "CONTROL"  },
  ALARM: { clr: "#DC2626", bg: "#FEE2E2", icon: "⚠",  label: "ALARM"    },
  AUTH:  { clr: "#8B5CF6", bg: "#EDE9FE", icon: "🔐", label: "AUTH"     },
  CFG:   { clr: "#D97706", bg: "#FEF3C7", icon: "🔧", label: "CONFIG"   },
  SYS:   { clr: "#64748B", bg: "#F1F5F9", icon: "⚙",  label: "SYSTEM"   },
};
export const COMP_COLORS = ["#3B82F6","#0EA5E9","#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899"];

export const PID_KP = 0.8, PID_KI = 0.12, PID_KD = 0.05;

export const NAV = [
  { id:"OVERVIEW",    icon:"🏭", label:"Overview"    },
  { id:"DASHBOARD",   icon:"⊞",  label:"Dashboard"   },
  { id:"COMPRESSORS", icon:"⚙",  label:"Compressors" },
  { id:"AIR_DRYER",   icon:"💨", label:"Air Dryer"   },
  { id:"SENSORS",     icon:"📡", label:"Sensor System"},
  { id:"SEQUENCE",    icon:"⇄",  label:"Sequence"    },
  { id:"ENERGY",      icon:"⚡",  label:"Energy"      },
  { id:"LOG",         icon:"☰",  label:"System Log"  },
  { id:"ALARMS",      icon:"🔔", label:"Alarms"      },
  { id:"SETTINGS",    icon:"🔩", label:"Settings"    },
  { id:"USERS",       icon:"👥", label:"Users"       },
];

export const ALARM_META = {
  CRITICAL: { clr:"#DC2626", bg:"#FEE2E2", bd:"#FCA5A5", icon:"🔴", label:"CRITICAL" },
  FAULT:    { clr:"#EA580C", bg:"#FFF7ED", bd:"#FED7AA", icon:"🟠", label:"FAULT"    },
  WARNING:  { clr:"#D97706", bg:"#FEF3C7", bd:"#FCD34D", icon:"🟡", label:"WARNING"  },
  INFO:     { clr:"#1D4ED8", bg:"#DBEAFE", bd:"#BFDBFE", icon:"🔵", label:"INFO"     },
};
export const SENSOR_TYPES = ["Pressure","Flow","Temperature","Humidity","Dew Point","Vibration","Current","Voltage","Power","Level","Speed","Custom"];
export const SENSOR_UNITS = { Pressure:["bar","kPa","MPa","PSI","kg/cm²"], Flow:["m³/min","m³/h","L/min","CFM"], Temperature:["°C","°F","K"], Humidity:["%RH"], "Dew Point":["°C","°F"], Vibration:["mm/s","g"], Current:["A","mA"], Voltage:["V","kV"], Power:["kW","MW","kVA"], Level:["m","%","mm"], Speed:["RPM","Hz"], Custom:["unit"] };
export const TYPE_ICON = { Pressure:"🌡",Flow:"💨",Temperature:"🌡️",Humidity:"💧","Dew Point":"❄️",Vibration:"📳",Current:"⚡",Voltage:"🔋",Power:"⚡",Level:"📊",Speed:"🔄",Custom:"📡" };
