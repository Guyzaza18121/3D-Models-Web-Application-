import { clamp, rnd } from '../constants';

export const uid = () => Math.random().toString(36).slice(2, 7).toUpperCase();
export const tsNow = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
export const tsFull = () => new Date().toLocaleString("th-TH", { hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });

export const AC_INFO = {
  'AC-01': { temp: 24, setTemp: 25, status: 'ON', mode: 'Cool', fan: 'Auto' },
  'AC-02': { temp: 23, setTemp: 24, status: 'ON', mode: 'Cool', fan: 'High' },
  'AC-03': { temp: 25, setTemp: 25, status: 'ON', mode: 'Cool', fan: 'Medium' },
  'AC-04': { temp: 22, setTemp: 23, status: 'ON', mode: 'Cool', fan: 'Low' },
  'AC-05': { temp: 26, setTemp: 25, status: 'ON', mode: 'Cool', fan: 'Auto' },
  'AC-06': { temp: 24, setTemp: 24, status: 'OFF', mode: 'Cool', fan: 'Auto' },
  'AC-07': { temp: 27, setTemp: 26, status: 'ON', mode: 'Fan', fan: 'High' },
  'AC-08': { temp: 25, setTemp: 25, status: 'OFF', mode: 'Cool', fan: 'Low' },
};

export const INIT_USERS = [
  { id:"u1", un:"admin",    pw:"admin123",  name:"ผู้ดูแลระบบ",   role:"ADMIN",    on:true },
  { id:"u2", un:"engineer", pw:"eng123",    name:"วิศวกรระบบ",    role:"ENGINEER", on:true },
  { id:"u3", un:"operator", pw:"op123",     name:"พนักงานควบคุม", role:"OPERATOR", on:true },
  { id:"u4", un:"viewer",   pw:"view123",   name:"ผู้ชมรายงาน",   role:"VIEWER",   on:true },
];

export const COMP_COLORS = ["#3B82F6","#0EA5E9","#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899"];

export const AC_COMP_SPECS = {
  'AC-01': { brand:"Atlas Copco",    model:"GA22+",   type:"Screw",     kw:22, flow:3.7, maxPressure:10, voltage:380 },
  'AC-02': { brand:"Ingersoll Rand", model:"R11i",    type:"Screw",     kw:11, flow:1.8, maxPressure:10, voltage:380 },
  'AC-03': { brand:"Kaeser",         model:"SM15",    type:"VFD Screw", kw:15, flow:2.2, maxPressure:10, voltage:380 },
  'AC-04': { brand:"CompAir",        model:"L37RS",   type:"Screw",     kw:37, flow:6.1, maxPressure:10, voltage:380 },
  'AC-05': { brand:"Sullair",        model:"LS20",    type:"Screw",     kw:18, flow:2.9, maxPressure:10, voltage:380 },
  'AC-06': { brand:"Boge",           model:"C20",     type:"Screw",     kw:15, flow:2.4, maxPressure:10, voltage:380 },
  'AC-07': { brand:"Hitachi",        model:"SRL-22",  type:"VFD Screw", kw:22, flow:3.5, maxPressure:10, voltage:380 },
  'AC-08': { brand:"Kobelco",        model:"AG370A",  type:"Screw",     kw:37, flow:5.8, maxPressure:10, voltage:380 },
};

export const DEFAULT_COMP_SPEC = { brand:"Generic", model:"Model X", type:"Screw", kw:22, flow:2.6, maxPressure:10, voltage:380 };

export function mkComp(spec, idx) {
  return {
    id: uid(),
    brand: spec.brand || "Generic",
    model: spec.model || "Model X",
    name: spec.name || spec.model || "Compressor",
    type: spec.type || "Reciprocating",
    kw: spec.kw || 22,
    flow: spec.flow || 2.6,
    maxPressure: spec.maxPressure || 10,
    voltage: spec.voltage || 380,
    clr: spec.clr || COMP_COLORS[idx % COMP_COLORS.length],
    note: spec.note || "",
    status: "STANDBY", press: 0, temp: rnd(38,50), curr: 0,
    load: 0, seq: idx+1, lead: idx===0,
    hrs: Math.floor(rnd(200,8000)), runtime: 0, fault: "",
  };
}

export const INIT_COMPS = Object.keys(AC_INFO)
  .sort()
  .map((acName, idx) => {
    const spec = AC_COMP_SPECS[acName] || DEFAULT_COMP_SPEC;
    return mkComp({ ...spec, name: spec.model, clr: COMP_COLORS[idx % COMP_COLORS.length] }, idx);
  });

export const INIT_SENSORS = [
  { id:"s1", name:"Pressure Sensor 1", type:"Pressure", location:"Header Main",     unit:"bar",    value:7.0,  min:0,   max:12,  ok:true, clr:"#3B82F6" },
  { id:"s2", name:"Pressure Sensor 2", type:"Pressure", location:"Header Branch A", unit:"bar",    value:7.0,  min:0,   max:12,  ok:true, clr:"#10B981" },
  { id:"s3",  type:"Flow",     location:"Outlet Main",    unit:"m³/min", value:3.5,  min:0,   max:15,  ok:true, clr:"#F59E0B" },
  { id:"s4", name:"Temp Sensor 1",     type:"Temp",     location:"Room Ambient",   unit:"°C",     value:28,   min:-10, max:60,  ok:true, clr:"#EF4444" },
  { id:"s5", name:"Dew Point 1",       type:"DewPoint", location:"Dryer Outlet",   unit:"°C",     value:-20,  min:-40, max:10,  ok:true, clr:"#8B5CF6" },
];

export const INIT_AIR_DRYER = { id:'ad1', name:'Air Dryer 1', status:'RUNNING', temp:32, maxTemp:45, voltage:380, flow:2.1, clr:'#06B6D4' };
