import { useState, useEffect, useRef, useCallback } from "react";

// ── helpers ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 7).toUpperCase();
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rnd = (lo, hi) => lo + Math.random() * (hi - lo);
const tsNow = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
const tsFull = () => new Date().toLocaleString("th-TH", { hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });

// ── design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#F0F4FF", bgCard: "#FFFFFF", bgSidebar: "#0B1F4B",
  accent: "#1D4ED8", accentLight: "#3B82F6", accentSoft: "#DBEAFE", accentBorder: "#BFDBFE",
  navy: "#0B1F4B", text: "#0F172A", textMid: "#334155", textSoft: "#64748B", textFaint: "#94A3B8",
  green: "#16A34A", greenLight: "#DCFCE7", greenBorder: "#86EFAC",
  red: "#DC2626", redLight: "#FEE2E2", redBorder: "#FCA5A5",
  amber: "#D97706", amberLight: "#FEF3C7", amberBorder: "#FCD34D",
  border: "#E2E8F0",
  shadow: "0 1px 3px rgba(0,0,0,0.08)",
  shadowMd: "0 4px 6px -1px rgba(0,0,0,0.07)",
};

const ROLES = ["ADMIN", "ENGINEER", "OPERATOR", "VIEWER"];
const PERMS = {
  ADMIN:    { ctrl: true,  cfg: true,  users: true,  del: true  },
  ENGINEER: { ctrl: true,  cfg: true,  users: false, del: true  },
  OPERATOR: { ctrl: true,  cfg: false, users: false, del: false },
  VIEWER:   { ctrl: false, cfg: false, users: false, del: false },
};
const ROLE_META = {
  ADMIN:    { bg: "#EDE9FE", bd: "#8B5CF6", tx: "#5B21B6", icon: "👑" },
  ENGINEER: { bg: "#DBEAFE", bd: "#3B82F6", tx: "#1D4ED8", icon: "🔧" },
  OPERATOR: { bg: "#DCFCE7", bd: "#22C55E", tx: "#15803D", icon: "🎛️" },
  VIEWER:   { bg: "#FEF9C3", bd: "#EAB308", tx: "#A16207", icon: "👁️" },
};
const ST_META = {
  RUNNING: { bg: "#DCFCE7", bd: "#16A34A", dot: "#16A34A", tx: "#15803D", label: "RUNNING" },
  STANDBY: { bg: "#DBEAFE", bd: "#3B82F6", dot: "#3B82F6", tx: "#1D4ED8", label: "STANDBY" },
  FAULT:   { bg: "#FEE2E2", bd: "#DC2626", dot: "#DC2626", tx: "#991B1B", label: "FAULT"   },
};
const LOG_META = {
  SEQ:   { clr: "#3B82F6", bg: "#DBEAFE", icon: "🔄", label: "SEQUENCE" },
  CTRL:  { clr: "#16A34A", bg: "#DCFCE7", icon: "▶",  label: "CONTROL"  },
  ALARM: { clr: "#DC2626", bg: "#FEE2E2", icon: "⚠",  label: "ALARM"    },
  AUTH:  { clr: "#8B5CF6", bg: "#EDE9FE", icon: "🔐", label: "AUTH"     },
  CFG:   { clr: "#D97706", bg: "#FEF3C7", icon: "🔧", label: "CONFIG"   },
  SYS:   { clr: "#64748B", bg: "#F1F5F9", icon: "⚙",  label: "SYSTEM"   },
};
const COMP_COLORS = ["#3B82F6","#0EA5E9","#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899"];
const INIT_USERS = [
  { id:"u1", un:"admin",    pw:"admin123",  name:"ผู้ดูแลระบบ",   role:"ADMIN",    on:true },
  { id:"u2", un:"engineer", pw:"eng123",    name:"วิศวกรระบบ",    role:"ENGINEER", on:true },
  { id:"u3", un:"operator", pw:"op123",     name:"พนักงานควบคุม", role:"OPERATOR", on:true },
  { id:"u4", un:"viewer",   pw:"view123",   name:"ผู้ชมรายงาน",   role:"VIEWER",   on:true },
];
const K = 0.18, VOL = 2.5;
// PID tuning defaults
const PID_KP = 0.8, PID_KI = 0.12, PID_KD = 0.05;
const NAV = [
  { id:"DASHBOARD",   icon:"⊞",  label:"Dashboard"   },
  { id:"COMPRESSORS", icon:"⚙",  label:"Compressors" },
  { id:"SENSORS",     icon:"📡", label:"Sensor System"},
  { id:"SEQUENCE",    icon:"⇄",  label:"Sequence"    },
  { id:"ENERGY",      icon:"⚡",  label:"Energy"      },
  { id:"LOG",         icon:"☰",  label:"System Log"  },
  { id:"ALARMS",      icon:"🔔", label:"Alarms"      },
  { id:"SETTINGS",    icon:"🔩", label:"Settings"    },
  { id:"USERS",       icon:"👥", label:"Users"       },
];

function mkComp(spec, idx) {
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

// ── INIT compressors ──────────────────────────────────────────────────────────
const INIT_COMPS = [
  mkComp({ brand:"Atlas Copco",    model:"GA22+",  name:"GA22+",  type:"Screw",     kw:22, flow:3.7, maxPressure:10, voltage:380, clr:"#3B82F6" }, 0),
  mkComp({ brand:"Ingersoll Rand", model:"R11i",   name:"R11i",   type:"Screw",     kw:11, flow:1.8, maxPressure:10, voltage:380, clr:"#10B981" }, 1),
  mkComp({ brand:"Kaeser",         model:"SM15",   name:"SM15",   type:"VFD Screw", kw:15, flow:2.2, maxPressure:10, voltage:380, clr:"#F59E0B" }, 2),
  mkComp({ brand:"CompAir",        model:"L37RS",  name:"L37RS",  type:"Screw",     kw:37, flow:6.1, maxPressure:10, voltage:380, clr:"#EF4444" }, 3),
];

// ── Reusable UI ───────────────────────────────────────────────────────────────
const Card = ({ children, style={} }) => (
  <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:18, boxShadow:C.shadow, ...style }}>
    {children}
  </div>
);
const STitle = ({ children }) => (
  <div style={{ fontSize:10, fontWeight:700, color:C.textSoft, letterSpacing:2, textTransform:"uppercase", marginBottom:14 }}>{children}</div>
);
const Badge = ({ label, bg, tx, bd }) => (
  <span style={{ background:bg, border:`1px solid ${bd}`, color:tx, fontSize:9, padding:"2px 8px", borderRadius:20, fontWeight:600, whiteSpace:"nowrap" }}>{label}</span>
);
const KV = ({ label, value, vc=C.accent }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
    <span style={{ fontSize:11, color:C.textSoft }}>{label}</span>
    <span style={{ fontSize:12, fontWeight:700, color:vc, fontFamily:"monospace" }}>{value}</span>
  </div>
);
const Inp = ({ label, value, onChange, type="text", placeholder="", disabled=false, options=null }) => (
  <div>
    <div style={{ fontSize:10, color:C.textSoft, fontWeight:600, marginBottom:5 }}>{label}</div>
    {options ? (
      <select value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}
        style={{ width:"100%", background:disabled?C.bg:C.bgCard, border:`1.5px solid ${C.accentBorder}`, borderRadius:8, padding:"8px 10px", color:C.text, fontSize:11, outline:"none", boxSizing:"border-box" }}>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        style={{ width:"100%", background:disabled?C.bg:C.bgCard, border:`1.5px solid ${C.accentBorder}`, borderRadius:8, padding:"8px 10px", color:C.text, fontSize:11, outline:"none", boxSizing:"border-box", opacity:disabled?0.6:1 }} />
    )}
  </div>
);

// ── Clock (top bar) ───────────────────────────────────────────────────────────
function ClockDisplay() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const iv = setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(iv); },[]);
  const t = now.toLocaleTimeString("en-GB",{hour12:false});
  const d = now.toLocaleDateString("th-TH",{weekday:"short",year:"numeric",month:"short",day:"numeric"});
  return (
    <div style={{ textAlign:"right", lineHeight:1.3 }}>
      <div style={{ fontSize:16, fontWeight:800, color:C.navy, fontFamily:"monospace" }}>{t}</div>
      <div style={{ fontSize:9, color:C.textFaint }}>{d}</div>
    </div>
  );
}

// ── Gauge ─────────────────────────────────────────────────────────────────────
function Gauge({ val, sp, size=160 }) {
  const pct = clamp(val/12,0,1), spPct=clamp(sp/12,0,1);
  const cx=size/2, cy=size/2, r=size*0.38;
  const polar=(deg,rad)=>({ x:cx+rad*Math.cos(deg*Math.PI/180), y:cy+rad*Math.sin(deg*Math.PI/180) });
  const arc=(st,en,rad)=>{ const s=polar(st,rad),e=polar(en,rad),lg=en-st>180?1:0; return `M${s.x},${s.y} A${rad},${rad} 0 ${lg} 1 ${e.x},${e.y}`; };
  const nd=polar(-135+pct*270, r*0.72);
  const ok=val>=sp-0.4&&val<=sp+0.6, low=val<sp-0.4;
  const gc=low?C.red:ok?C.green:C.amber;
  const spMk=polar(-135+spPct*270, r);
  return (
    <svg width={size} height={size*0.85} viewBox={`0 0 ${size} ${size*0.85}`}>
      <path d={arc(-135,135,r)} fill="none" stroke="#E2E8F0" strokeWidth={size*0.07} strokeLinecap="round"/>
      <path d={arc(-135,-135+pct*270,r)} fill="none" stroke={gc} strokeWidth={size*0.055} strokeLinecap="round"/>
      <circle cx={spMk.x} cy={spMk.y} r={size*0.028} fill={C.amber}/>
      <line x1={cx} y1={cy} x2={nd.x} y2={nd.y} stroke={gc} strokeWidth={size*0.018} strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r={size*0.035} fill={gc}/>
      <text x={cx} y={cy+size*0.16} textAnchor="middle" fill={gc} style={{font:`bold ${size*0.14}px monospace`}}>{val.toFixed(2)}</text>
      <text x={cx} y={cy+size*0.24} textAnchor="middle" fill={C.textSoft} style={{font:`${size*0.075}px monospace`}}>bar</text>
      <text x={cx} y={cy+size*0.31} textAnchor="middle" fill={C.amber} style={{font:`${size*0.065}px monospace`}}>SP {sp.toFixed(2)}</text>
    </svg>
  );
}

function Ring({ val, max, clr, unit, label }) {
  const pct=clamp(val/max,0,1), cx=26, cy=26, r=20;
  const polar=deg=>({ x:cx+r*Math.cos(deg*Math.PI/180), y:cy+r*Math.sin(deg*Math.PI/180) });
  const arcD=()=>{ const en=-135+pct*270,s=polar(-135),e=polar(en); return `M${s.x},${s.y} A${r},${r} 0 ${pct*270>180?1:0} 1 ${e.x},${e.y}`; };
  const bgArc=()=>{ const s=polar(-135),e=polar(135); return `M${s.x},${s.y} A${r},${r} 0 1 1 ${e.x},${e.y}`; };
  return (
    <div style={{textAlign:"center"}}>
      <svg viewBox="0 0 52 46" style={{width:52}}>
        <path d={bgArc()} fill="none" stroke="#E2E8F0" strokeWidth="4.5" strokeLinecap="round"/>
        {pct>0&&<path d={arcD()} fill="none" stroke={clr} strokeWidth="4" strokeLinecap="round"/>}
        <text x={cx} y={cy+3} textAnchor="middle" fill={clr} style={{font:"bold 8px monospace"}}>{val<10?val.toFixed(1):Math.round(val)}</text>
        <text x={cx} y={cy+11} textAnchor="middle" fill={C.textFaint} style={{font:"5.5px monospace"}}>{unit}</text>
      </svg>
      <div style={{color:C.textFaint,fontSize:8,letterSpacing:1}}>{label}</div>
    </div>
  );
}

function Spark({ data, clr, h=40 }) {
  if(!data||data.length<2) return <div style={{height:h}}/>;
  const max=Math.max(...data,0.01);
  const pts=data.map((v,i)=>`${(i/(data.length-1))*300},${h-(clamp(v,0,max)/max)*(h-2)}`).join(" ");
  return (
    <svg viewBox={`0 0 300 ${h}`} style={{width:"100%",height:h}} preserveAspectRatio="none">
      <defs><linearGradient id={`sg${clr.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={clr} stopOpacity="0.2"/>
        <stop offset="100%" stopColor={clr} stopOpacity="0"/>
      </linearGradient></defs>
      <polygon points={`0,${h} ${pts} 300,${h}`} fill={`url(#sg${clr.replace("#","")})`}/>
      <polyline points={pts} fill="none" stroke={clr} strokeWidth="2"/>
    </svg>
  );
}

function StatCard({ label, value, unit, clr, icon, sub }) {
  return (
    <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",boxShadow:C.shadow}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <span style={{fontSize:10,color:C.textSoft,fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>{label}</span>
        <span style={{fontSize:16}}>{icon}</span>
      </div>
      <div style={{fontSize:24,fontWeight:800,color:clr,fontFamily:"monospace",lineHeight:1}}>{value}</div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
        <span style={{fontSize:10,color:C.textFaint}}>{unit}</span>
        {sub&&<span style={{fontSize:9,color:C.textFaint}}>{sub}</span>}
      </div>
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function Login({ users, onLogin }) {
  const [un,setUn]=useState(""), [pw,setPw]=useState(""), [err,setErr]=useState(""), [busy,setBusy]=useState(false);
  const doLogin=()=>{ setBusy(true); setErr(""); setTimeout(()=>{ const u=users.find(x=>x.un===un&&x.pw===pw&&x.on); if(u)onLogin(u); else setErr("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"); setBusy(false); },500); };
  const inp={ width:"100%", background:C.bg, border:`1.5px solid ${C.accentBorder}`, borderRadius:8, padding:"10px 14px", color:C.text, fontSize:13, fontFamily:"monospace", outline:"none", boxSizing:"border-box" };
  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${C.navy},#1E3A8A,#1D4ED8)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 20% 80%,#ffffff08,transparent 50%),radial-gradient(circle at 80% 20%,#60A5FA18,transparent 50%)"}}/>
      <div style={{background:"#fff",borderRadius:20,padding:44,width:400,boxShadow:"0 25px 50px rgba(0,0,0,0.25)",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:60,height:60,background:`linear-gradient(135deg,${C.accent},${C.navy})`,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:26}}>⚡</div>
          <div style={{fontSize:16,fontWeight:800,color:C.navy,letterSpacing:1}}>FOSTEC FIM 4.0</div>
          <div style={{fontSize:10,color:C.textSoft,letterSpacing:3,marginTop:4}}>FACTORY INFORMATION MANAGEMENT</div>
          <div style={{width:40,height:2,background:`linear-gradient(90deg,${C.accent},#60A5FA)`,borderRadius:2,margin:"12px auto 0"}}/>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:C.textSoft,letterSpacing:1,marginBottom:6,fontWeight:600}}>USERNAME</div>
          <input value={un} onChange={e=>setUn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()} style={inp} placeholder="กรอกชื่อผู้ใช้"/>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:10,color:C.textSoft,letterSpacing:1,marginBottom:6,fontWeight:600}}>PASSWORD</div>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()} style={inp} placeholder="กรอกรหัสผ่าน"/>
        </div>
        {err&&<div style={{background:C.redLight,border:`1px solid ${C.redBorder}`,borderRadius:8,padding:"8px 14px",color:C.red,fontSize:11,marginBottom:14}}>{err}</div>}
        <button onClick={doLogin} disabled={busy} style={{width:"100%",background:`linear-gradient(135deg,${C.accent},${C.navy})`,border:"none",borderRadius:10,padding:"13px 0",color:"#fff",fontSize:13,fontWeight:700,letterSpacing:2,cursor:"pointer"}}>
          {busy?"กำลังตรวจสอบ...":"เข้าสู่ระบบ →"}
        </button>
        <div style={{marginTop:20,background:C.bg,borderRadius:10,padding:14,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:9,color:C.textFaint,letterSpacing:1,marginBottom:8,fontWeight:600}}>DEMO ACCOUNTS</div>
          {[["admin","admin123","ADMIN"],["engineer","eng123","ENGINEER"],["operator","op123","OPERATOR"],["viewer","view123","VIEWER"]].map(([u,p,r])=>{
            const rm=ROLE_META[r];
            return <div key={u} onClick={()=>{setUn(u);setPw(p);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",cursor:"pointer",borderBottom:`1px solid ${C.border}`}}>
              <span style={{color:C.textMid,fontSize:10,fontFamily:"monospace"}}>{u} / {p}</span>
              <Badge label={r} bg={rm.bg} bd={rm.bd} tx={rm.tx}/>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}

// ── Compressor Spec Editor Modal ──────────────────────────────────────────────
function CompSpecModal({ initial, onSave, onClose, existingCount }) {
  const isNew = !initial;
  const [form, setForm] = useState(initial ? {
    brand: initial.brand, model: initial.model, name: initial.name,
    type: initial.type, kw: String(initial.kw), flow: String(initial.flow),
    maxPressure: String(initial.maxPressure), voltage: String(initial.voltage),
    clr: initial.clr, note: initial.note || "",
  } : {
    brand: "", model: "", name: "", type: "Screw",
    kw: "22", flow: "2.6", maxPressure: "10", voltage: "380",
    clr: COMP_COLORS[existingCount % COMP_COLORS.length], note: "",
  });
  const [err, setErr] = useState("");
  const set = (k, v) => setForm(p=>({...p,[k]:v}));

  const handleSave = () => {
    if (!form.brand.trim()) { setErr("กรุณากรอกยี่ห้อ"); return; }
    if (!form.model.trim()) { setErr("กรุณากรอกรุ่น"); return; }
    const kw = parseFloat(form.kw), flow = parseFloat(form.flow), mp = parseFloat(form.maxPressure), vl = parseFloat(form.voltage);
    if (isNaN(kw)||kw<=0) { setErr("กำลังไฟฟ้าต้องเป็นตัวเลขที่มากกว่า 0"); return; }
    if (isNaN(flow)||flow<=0) { setErr("อัตราการไหลต้องเป็นตัวเลขที่มากกว่า 0"); return; }
    onSave({ ...form, name: form.name||form.model, kw, flow, maxPressure:isNaN(mp)?10:mp, voltage:isNaN(vl)?380:vl });
  };

  const TYPE_OPTS = ["Screw","Reciprocating","Centrifugal","Rotary Vane","VFD Screw","Scroll"];
  const VOLT_OPTS = ["220","380","400","415","440","480","600"];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"}}>
      <div style={{background:"#fff",borderRadius:16,width:560,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 25px 50px rgba(0,0,0,0.3)"}}>
        {/* Header */}
        <div style={{background:`linear-gradient(135deg,${C.accent},${C.navy})`,borderRadius:"16px 16px 0 0",padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:"#fff",fontSize:14,fontWeight:800}}>{isNew?"เพิ่มปั้มลมใหม่":"แก้ไขข้อมูลปั้มลม"}</div>
            <div style={{color:"#BFDBFE",fontSize:10,marginTop:2}}>กรอกข้อมูลยี่ห้อ รุ่น และสเปค</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        <div style={{padding:24}}>
          {/* Brand/Model/Name */}
          <div style={{background:C.accentSoft,border:`1px solid ${C.accentBorder}`,borderRadius:10,padding:14,marginBottom:18}}>
            <div style={{fontSize:10,fontWeight:700,color:C.accent,letterSpacing:2,marginBottom:12}}>ข้อมูลทั่วไป</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <Inp label="ยี่ห้อ (Brand) *" value={form.brand} onChange={v=>set("brand",v)} placeholder="เช่น Atlas Copco"/>
              <Inp label="รุ่น (Model) *" value={form.model} onChange={v=>set("model",v)} placeholder="เช่น GA22+"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Inp label="ชื่อแสดง (Display Name)" value={form.name} onChange={v=>set("name",v)} placeholder="ถ้าว่างจะใช้ชื่อรุ่น"/>
              <Inp label="ประเภท (Type)" value={form.type} onChange={v=>set("type",v)} options={TYPE_OPTS}/>
            </div>
          </div>

          {/* Specs */}
          <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:10,padding:14,marginBottom:18}}>
            <div style={{fontSize:10,fontWeight:700,color:C.green,letterSpacing:2,marginBottom:12}}>สเปคทางเทคนิค</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
              <Inp label="กำลังมอเตอร์ (kW) *" value={form.kw} onChange={v=>set("kw",v)} placeholder="22" type="number"/>
              <Inp label="อัตราการไหล (m³/min) *" value={form.flow} onChange={v=>set("flow",v)} placeholder="2.6" type="number"/>
              <Inp label="แรงดันสูงสุด (bar)" value={form.maxPressure} onChange={v=>set("maxPressure",v)} placeholder="10" type="number"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Inp label="แรงดันไฟฟ้า (V)" value={form.voltage} onChange={v=>set("voltage",v)} options={VOLT_OPTS}/>
              <div>
                <div style={{fontSize:10,color:C.textSoft,fontWeight:600,marginBottom:5}}>สีสัญลักษณ์</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {COMP_COLORS.map(c=>(
                    <div key={c} onClick={()=>set("clr",c)}
                      style={{width:24,height:24,borderRadius:"50%",background:c,cursor:"pointer",
                        border:`3px solid ${form.clr===c?"#0F172A":"transparent"}`,
                        boxShadow:form.clr===c?"0 0 0 2px #fff inset":""}}/>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Spec preview */}
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:14,marginBottom:18}}>
            <div style={{fontSize:10,fontWeight:700,color:C.textSoft,letterSpacing:2,marginBottom:10}}>ตัวอย่างการแสดงผล</div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:form.clr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>⚙</div>
              <div>
                <div style={{fontSize:13,fontWeight:800,color:C.navy}}>{form.brand||"ยี่ห้อ"} {form.model||"รุ่น"}</div>
                <div style={{fontSize:10,color:C.textSoft}}>{form.type} · {form.kw} kW · {form.flow} m³/min · Max {form.maxPressure} bar · {form.voltage}V</div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:10,color:C.textSoft,fontWeight:600,marginBottom:5}}>หมายเหตุ (Note)</div>
            <textarea value={form.note} onChange={e=>set("note",e.target.value)} placeholder="บันทึกเพิ่มเติม เช่น ตำแหน่ง, วันติดตั้ง..."
              style={{width:"100%",background:C.bgCard,border:`1.5px solid ${C.accentBorder}`,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:11,outline:"none",boxSizing:"border-box",resize:"vertical",minHeight:60,fontFamily:"inherit"}}/>
          </div>

          {err&&<div style={{background:C.redLight,border:`1px solid ${C.redBorder}`,borderRadius:8,padding:"8px 14px",color:C.red,fontSize:11,marginBottom:14,fontWeight:600}}>{err}</div>}

          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,color:C.textSoft,borderRadius:10,padding:"10px 0",fontSize:12,cursor:"pointer",fontWeight:600}}>ยกเลิก</button>
            <button onClick={handleSave} style={{flex:2,background:`linear-gradient(135deg,${C.accent},${C.navy})`,border:"none",color:"#fff",borderRadius:10,padding:"10px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>
              {isNew?"+ เพิ่มปั้มลม":"💾 บันทึกการแก้ไข"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Compressor Card ───────────────────────────────────────────────────────────
function CompCard({ c, onToggle, onRemove, onEdit, canCtrl, canDel, canCfg }) {
  const s = ST_META[c.status]||ST_META.STANDBY;
  const kw = c.kw*c.load/100;
  return (
    <div style={{background:C.bgCard,border:`1.5px solid ${s.bd}22`,borderRadius:14,padding:16,boxShadow:C.shadowMd,display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:c.clr+"18",border:`1.5px solid ${c.clr}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>⚙</div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:s.dot,boxShadow:`0 0 0 3px ${s.bd}33`,animation:c.status==="RUNNING"?"pulse 1.5s infinite":"none"}}/>
              <span style={{fontSize:13,fontWeight:800,color:C.navy}}>C-{String(c.seq).padStart(2,"0")}</span>
              {c.lead&&<Badge label="LEAD" bg="#FEF9C3" bd={C.amberBorder} tx="#92400E"/>}
            </div>
            <div style={{fontSize:11,fontWeight:700,color:C.textMid}}>{c.brand} {c.model}</div>
            <div style={{fontSize:9,color:C.textFaint}}>{c.type} · {c.kw}kW · {c.flow}m³/min</div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
          <Badge label={s.label} bg={s.bg} bd={s.bd} tx={s.tx}/>
          {canCfg&&<button onClick={()=>onEdit(c)} style={{background:C.accentSoft,border:`1px solid ${C.accentBorder}`,color:C.accent,borderRadius:6,padding:"2px 8px",cursor:"pointer",fontSize:9,fontWeight:600}}>✏ แก้ไข</button>}
        </div>
      </div>

      {/* Rings */}
      <div style={{display:"flex",justifyContent:"space-around",marginBottom:10,padding:"8px 0",background:C.bg,borderRadius:10}}>
        <Ring val={c.press} max={12} clr={c.clr} unit="bar" label="PRESS"/>
        <Ring val={c.temp} max={120} clr={c.temp>85?C.red:C.amber} unit="°C" label="TEMP"/>
        <Ring val={c.curr} max={c.kw*2.2} clr="#8B5CF6" unit="A" label="CURR"/>
        <Ring val={c.load} max={100} clr={c.clr} unit="%" label="LOAD"/>
      </div>

      {/* Power bar */}
      <div style={{marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:10,color:C.textSoft,fontWeight:600}}>POWER OUTPUT</span>
          <span style={{fontSize:10,color:c.clr,fontWeight:700,fontFamily:"monospace"}}>{kw.toFixed(1)} / {c.kw} kW</span>
        </div>
        <div style={{background:C.border,borderRadius:6,height:6,overflow:"hidden"}}>
          <div style={{width:`${c.load}%`,height:"100%",background:`linear-gradient(90deg,${c.clr}88,${c.clr})`,borderRadius:6,transition:"width .6s"}}/>
        </div>
      </div>

      {/* Spec row */}
      <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
        {[["Max",`${c.maxPressure}bar`],["Volt",`${c.voltage}V`],["Flow",`${c.flow}m³`]].map(([l,v])=>(
          <div key={l} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"2px 8px",fontSize:9}}>
            <span style={{color:C.textFaint}}>{l}: </span><span style={{color:C.textMid,fontWeight:600}}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.textFaint,marginBottom:10}}>
        <span>⏱ {Math.floor(c.runtime/3600)}h {Math.floor((c.runtime%3600)/60)}m</span>
        <span>∑ {c.hrs.toLocaleString()}h</span>
      </div>

      {c.note&&<div style={{background:C.accentSoft,border:`1px solid ${C.accentBorder}`,borderRadius:6,padding:"4px 8px",marginBottom:8,fontSize:9,color:C.textMid}}>📝 {c.note}</div>}
      {c.fault&&<div style={{background:C.redLight,border:`1px solid ${C.redBorder}`,borderRadius:6,padding:"5px 10px",marginBottom:8,fontSize:9,color:C.red,fontWeight:600}}>⚠ {c.fault}</div>}

      <div style={{display:"flex",gap:8,marginTop:"auto"}}>
        {canCtrl&&(
          <button onClick={()=>onToggle(c.id)} disabled={c.status==="FAULT"}
            style={{flex:1,background:c.status==="RUNNING"?C.redLight:C.accentSoft,border:`1.5px solid ${c.status==="RUNNING"?C.red:C.accent}`,color:c.status==="RUNNING"?C.red:C.accent,borderRadius:8,padding:"8px 0",cursor:c.status==="FAULT"?"not-allowed":"pointer",fontSize:11,fontWeight:700,opacity:c.status==="FAULT"?0.5:1}}>
            {c.status==="RUNNING"?"■ STOP":"▶ START"}
          </button>
        )}
        {canDel&&(
          <button onClick={()=>onRemove(c.id)} style={{background:C.redLight,border:`1.5px solid ${C.redBorder}`,color:C.red,borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>✕</button>
        )}
      </div>
    </div>
  );
}

const ALARM_META = {
  CRITICAL: { clr:"#DC2626", bg:"#FEE2E2", bd:"#FCA5A5", icon:"🔴", label:"CRITICAL" },
  FAULT:    { clr:"#EA580C", bg:"#FFF7ED", bd:"#FED7AA", icon:"🟠", label:"FAULT"    },
  WARNING:  { clr:"#D97706", bg:"#FEF3C7", bd:"#FCD34D", icon:"🟡", label:"WARNING"  },
  INFO:     { clr:"#1D4ED8", bg:"#DBEAFE", bd:"#BFDBFE", icon:"🔵", label:"INFO"     },
};
const SENSOR_TYPES = ["Pressure","Flow","Temperature","Humidity","Dew Point","Vibration","Current","Voltage","Power","Level","Speed","Custom"];
const SENSOR_UNITS = { Pressure:["bar","kPa","MPa","PSI","kg/cm²"], Flow:["m³/min","m³/h","L/min","CFM"], Temperature:["°C","°F","K"], Humidity:["%RH"], "Dew Point":["°C","°F"], Vibration:["mm/s","g"], Current:["A","mA"], Voltage:["V","kV"], Power:["kW","MW","kVA"], Level:["m","%","mm"], Speed:["RPM","Hz"], Custom:["unit"] };
const TYPE_ICON = { Pressure:"🌡",Flow:"💨",Temperature:"🌡️",Humidity:"💧","Dew Point":"❄️",Vibration:"📳",Current:"⚡",Voltage:"🔋",Power:"⚡",Level:"📊",Speed:"🔄",Custom:"📡" };

// ── Sensor Modal (proper top-level component) ─────────────────────────────────
function SensorModal({ initial, onSave, onClose, sensorCount }) {
  const isNew = !initial;
  const [f, setF] = useState(initial ? {
    name: initial.name, type: initial.type, location: initial.location||"",
    unit: initial.unit, min: String(initial.min), max: String(initial.max),
    clr: initial.clr, note: initial.note||"",
    channels: initial.channels||[{id:"c1",label:"Value",unit:initial.unit,offset:0}],
    warnLo: String(initial.warnLo??initial.min), warnHi: String(initial.warnHi??initial.max),
  } : {
    name:"", type:"Pressure", location:"", unit:"bar", min:"0", max:"12",
    clr: COMP_COLORS[sensorCount % COMP_COLORS.length], note:"",
    channels:[{id:uid(), label:"Value", unit:"bar", offset:0}],
    warnLo:"0", warnHi:"10",
  });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const availUnits = SENSOR_UNITS[f.type]||["unit"];

  const handleSave = () => {
    if (!f.name.trim()) return;
    onSave({ ...f, min:parseFloat(f.min)||0, max:parseFloat(f.max)||12, warnLo:parseFloat(f.warnLo), warnHi:parseFloat(f.warnHi) });
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,backdropFilter:"blur(4px)"}}>
      <div style={{background:"#fff",borderRadius:16,width:580,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 25px 50px rgba(0,0,0,0.3)"}}>
        <div style={{background:`linear-gradient(135deg,${C.accent},${C.navy})`,borderRadius:"16px 16px 0 0",padding:"16px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:"#fff",fontSize:14,fontWeight:800}}>{isNew?"เพิ่ม Sensor ใหม่":"แก้ไข Sensor"}</div>
            <div style={{color:"#BFDBFE",fontSize:10,marginTop:2}}>กำหนดประเภท ชื่อ และ Channel การแสดงผล</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{padding:22}}>
          {/* General */}
          <div style={{background:C.accentSoft,border:`1px solid ${C.accentBorder}`,borderRadius:10,padding:14,marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:C.accent,letterSpacing:1,marginBottom:10}}>ข้อมูลทั่วไป</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <Inp label="ชื่อ Sensor *" value={f.name} onChange={v=>set("name",v)} placeholder="เช่น Pressure Header A"/>
              <Inp label="ประเภท (Type)" value={f.type} onChange={v=>{ set("type",v); set("unit",SENSOR_UNITS[v]?.[0]||"unit"); }} options={SENSOR_TYPES}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Inp label="ตำแหน่งติดตั้ง" value={f.location} onChange={v=>set("location",v)} placeholder="เช่น Main Header"/>
              <Inp label="หน่วย (Unit)" value={f.unit} onChange={v=>set("unit",v)} options={availUnits}/>
            </div>
          </div>
          {/* Range */}
          <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:10,padding:14,marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:C.green,letterSpacing:1,marginBottom:10}}>ช่วงค่าและการแจ้งเตือน</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
              <Inp label="Min" value={f.min} onChange={v=>set("min",v)} type="number"/>
              <Inp label="Max" value={f.max} onChange={v=>set("max",v)} type="number"/>
              <Inp label="⚠ Warn Lo" value={f.warnLo} onChange={v=>set("warnLo",v)} type="number"/>
              <Inp label="⚠ Warn Hi" value={f.warnHi} onChange={v=>set("warnHi",v)} type="number"/>
            </div>
          </div>
          {/* Channels */}
          <div style={{background:C.amberLight,border:`1px solid ${C.amberBorder}`,borderRadius:10,padding:14,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:10,fontWeight:700,color:C.amber,letterSpacing:1}}>DISPLAY CHANNELS ({f.channels.length})</div>
              <button onClick={()=>set("channels",[...f.channels,{id:uid(),label:`Ch ${f.channels.length+1}`,unit:f.unit,offset:0}])}
                style={{background:C.amber,border:"none",color:"#fff",borderRadius:6,padding:"3px 10px",fontSize:10,cursor:"pointer",fontWeight:700}}>+ Channel</button>
            </div>
            {f.channels.map((ch,ci)=>(
              <div key={ch.id} style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 32px",gap:8,marginBottom:8,alignItems:"flex-end"}}>
                <Inp label={ci===0?"ชื่อ Channel":""} value={ch.label} onChange={v=>set("channels",f.channels.map((x,i)=>i===ci?{...x,label:v}:x))} placeholder="Label"/>
                <Inp label={ci===0?"Unit":""} value={ch.unit} onChange={v=>set("channels",f.channels.map((x,i)=>i===ci?{...x,unit:v}:x))} placeholder="unit"/>
                <Inp label={ci===0?"Offset":""} value={String(ch.offset)} onChange={v=>set("channels",f.channels.map((x,i)=>i===ci?{...x,offset:parseFloat(v)||0}:x))} type="number" placeholder="0"/>
                {f.channels.length>1&&(
                  <button onClick={()=>set("channels",f.channels.filter((_,i)=>i!==ci))}
                    style={{background:C.redLight,border:`1px solid ${C.red}`,color:C.red,borderRadius:6,padding:"6px 0",cursor:"pointer",fontSize:11}}>✕</button>
                )}
              </div>
            ))}
            <div style={{fontSize:9,color:C.amber,marginTop:4}}>แต่ละ Channel แสดงค่าจาก simulation + offset</div>
          </div>
          {/* Color + note */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <div>
              <div style={{fontSize:10,color:C.textSoft,fontWeight:600,marginBottom:6}}>สีสัญลักษณ์</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {COMP_COLORS.map(c=>(<div key={c} onClick={()=>set("clr",c)} style={{width:24,height:24,borderRadius:"50%",background:c,cursor:"pointer",border:`3px solid ${f.clr===c?"#0F172A":"transparent"}`}}/>))}
              </div>
            </div>
            <div>
              <div style={{fontSize:10,color:C.textSoft,fontWeight:600,marginBottom:6}}>หมายเหตุ</div>
              <textarea value={f.note} onChange={e=>set("note",e.target.value)} placeholder="บันทึกเพิ่มเติม..."
                style={{width:"100%",background:C.bgCard,border:`1.5px solid ${C.accentBorder}`,borderRadius:8,padding:"6px 10px",color:C.text,fontSize:11,outline:"none",boxSizing:"border-box",resize:"none",height:60,fontFamily:"inherit"}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,color:C.textSoft,borderRadius:10,padding:"10px 0",fontSize:12,cursor:"pointer"}}>ยกเลิก</button>
            <button onClick={handleSave} style={{flex:2,background:`linear-gradient(135deg,${C.accent},${C.navy})`,border:"none",color:"#fff",borderRadius:10,padding:"10px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>
              {isNew?"+ เพิ่ม Sensor":"💾 บันทึก"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function App() {
  const [users, setUsers] = useState(()=>INIT_USERS.map(u=>({...u,avatar:null})));
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("DASHBOARD");
  const [collapsed, setCollapsed] = useState(false);
  const [comps, setComps] = useState(INIT_COMPS);
  const [sp, setSp] = useState(7.0);
  const [db, setDb] = useState(0.3);
  const [demand, setDemand] = useState(1.8);
  const [seqMode, setSeqMode] = useState("AUTO");
  const [sysP, setSysP] = useState(5.5);
  const [simOn, setSimOn] = useState(true);
  const [pressHist, setPressHist] = useState(()=>Array(60).fill(5.5));
  const [kwHist, setKwHist] = useState(()=>Array(60).fill(0));
  const [flowHist, setFlowHist] = useState(()=>Array(60).fill(0));
  const [energy, setEnergy] = useState(0);
  const [alarms, setAlarms] = useState([]);
  const [logs, setLogs] = useState([]);
  // PID state (displayed on Sequence page)
  const [pidOut, setPidOut] = useState(0);
  const [pidI, setPidI] = useState(0);
  const [pidD, setPidD] = useState(0);
  const [pidKp, setPidKp] = useState(PID_KP);
  const [pidKi, setPidKi] = useState(PID_KI);
  const [pidKd, setPidKd] = useState(PID_KD);
  // Sensor system
  const [sensors, setSensors] = useState([
    { id:"s1", name:"Pressure Sensor 1", type:"Pressure", location:"Header Main", unit:"bar", value:7.0, min:0, max:12, ok:true, clr:"#3B82F6" },
    { id:"s2", name:"Pressure Sensor 2", type:"Pressure", location:"Header Branch A", unit:"bar", value:7.0, min:0, max:12, ok:true, clr:"#10B981" },
    { id:"s3", name:"Flow Meter 1",      type:"Flow",     location:"Outlet Main",    unit:"m³/min", value:3.5, min:0, max:15, ok:true, clr:"#F59E0B" },
    { id:"s4", name:"Temp Sensor 1",     type:"Temp",     location:"Room Ambient",   unit:"°C", value:28, min:-10, max:60, ok:true, clr:"#EF4444" },
    { id:"s5", name:"Dew Point 1",       type:"DewPoint", location:"Dryer Outlet",   unit:"°C", value:-20, min:-40, max:10, ok:true, clr:"#8B5CF6" },
  ]);
  // Compressor modal
  const [compModal, setCompModal] = useState(null);
  // Sensor modal
  const [sensorModal, setSensorModal] = useState(null); // null | "new" | sensor obj
  // Alarm filter
  const [aFilter, setAFilter] = useState("ALL");
  const [aSearch, setASearch] = useState("");
  // Log filter
  const [logFilter, setLogFilter] = useState("ALL");
  const [logSearch, setLogSearch] = useState("");
  // User management
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({un:"",pw:"",name:"",role:"OPERATOR"});

  const tickRef = useRef(0);
  const spRef = useRef(sp); useEffect(()=>{spRef.current=sp;},[sp]);
  const dbRef = useRef(db); useEffect(()=>{dbRef.current=db;},[db]);
  const demRef = useRef(demand); useEffect(()=>{demRef.current=demand;},[demand]);
  const seqRef = useRef(seqMode); useEffect(()=>{seqRef.current=seqMode;},[seqMode]);
  const sysPRef = useRef(sysP);
  // PID internal refs (don't need re-render)
  const pidIntRef = useRef(0);   // integrator accumulator
  const pidPrevErrRef = useRef(0); // for derivative
  const pidKpRef = useRef(PID_KP); useEffect(()=>{pidKpRef.current=pidKp;},[pidKp]);
  const pidKiRef = useRef(PID_KI); useEffect(()=>{pidKiRef.current=pidKi;},[pidKi]);
  const pidKdRef = useRef(PID_KD); useEffect(()=>{pidKdRef.current=pidKd;},[pidKd]);

  const addLog = useCallback((type,msg,who="SYSTEM")=>{
    setLogs(p=>[{id:uid(),type,msg,who,time:tsFull()},...p].slice(0,400));
  },[]);

  const addAlarm = useCallback((code,msg,level)=>{
    setAlarms(p=>{ if(p.find(a=>a.code===code&&Date.now()-a.ts<10000))return p; addLog("ALARM",msg); return [{id:uid(),code,msg,level,time:tsNow(),ts:Date.now()},...p]; });
  },[addLog]);

  // ── Simulation with PID-based Sequence ──────────────────────────────────────
  useEffect(()=>{
    if(!simOn) return;
    const iv=setInterval(()=>{
      tickRef.current+=1;
      const tk=tickRef.current;
      const SP=spRef.current, DB=dbRef.current, baseDem=demRef.current, mode=seqRef.current;
      const Kp=pidKpRef.current, Ki=pidKiRef.current, Kd=pidKdRef.current;

      setComps(prevCs=>{
        let cs=prevCs.map(c=>({...c}));
        const runCS=cs.filter(c=>c.status==="RUNNING");
        const supply=runCS.reduce((s,c)=>s+c.flow*(c.load/100),0);
        // Actual demand oscillates around baseDemand
        const dem=clamp(baseDem+Math.sin(tk*0.07)*0.5+rnd(-0.15,0.15),0.1,20);
        const dP=K*(supply-dem)/VOL+rnd(-0.003,0.003);

        setSysP(prev=>{
          const newP=clamp(prev+dP,0.1,13);
          sysPRef.current=newP;

          if(mode==="AUTO"){
            // ── PID logic ──────────────────────────────────────────────────────
            const err=SP-newP;                           // error = setpoint - actual
            pidIntRef.current = clamp(pidIntRef.current + err, -10, 10); // anti-windup
            const dErr=err-pidPrevErrRef.current;
            const pTerm=Kp*err;
            const iTerm=Ki*pidIntRef.current;
            const dTerm=Kd*dErr;
            const output=clamp(pTerm+iTerm+dTerm, -5, 5); // PID output (-5..+5 bar·equiv)
            pidPrevErrRef.current=err;

            // Update display state (throttled)
            if(tk%2===0){
              setPidOut(parseFloat(output.toFixed(3)));
              setPidI(parseFloat(iTerm.toFixed(3)));
              setPidD(parseFloat(dTerm.toFixed(3)));
            }

            // PID output drives how many compressors are needed
            // output>0 means pressure too low → need more supply → turn on next unit
            // output<0 means pressure too high → reduce supply → turn off last unit
            const bySeq=[...cs].sort((a,b)=>a.seq-b.seq);
            const onCS=bySeq.filter(c=>c.status==="RUNNING");
            const offCS=bySeq.filter(c=>c.status==="STANDBY");

            // Add unit when PID wants more (output > threshold AND below deadband)
            if(output>0.3&&newP<SP-DB*0.8&&offCS.length>0){
              const nx=offCS[0];
              cs=cs.map(c=>c.id===nx.id?{...c,status:"RUNNING",load:25}:c);
              addLog("SEQ",`[PID] START C-${String(nx.seq).padStart(2,"0")} ${nx.brand} ${nx.model} | PID=${output.toFixed(3)} err=${err.toFixed(3)} P=${newP.toFixed(3)}`);
            }
            // Remove unit when PID wants less (output < threshold AND above deadband)
            if(output<-0.3&&newP>SP+DB*0.8&&onCS.length>1){
              const ls=onCS[onCS.length-1];
              cs=cs.map(c=>c.id===ls.id?{...c,status:"STANDBY",load:0,curr:0}:c);
              addLog("SEQ",`[PID] STOP C-${String(ls.seq).padStart(2,"0")} ${ls.brand} ${ls.model} | PID=${output.toFixed(3)} err=${err.toFixed(3)} P=${newP.toFixed(3)}`);
            }
          } else if(mode==="MANUAL") {
            // Reset PID integrator when switching to manual
            pidIntRef.current=0; pidPrevErrRef.current=0;
          }

          if(newP<SP-1.8) addAlarm("LOW_P",`แรงดันต่ำวิกฤต: ${newP.toFixed(3)} bar`,"CRITICAL");
          if(newP>SP+2.0) addAlarm("HIGH_P",`แรงดันสูงเกิน: ${newP.toFixed(3)} bar`,"WARNING");
          setPressHist(h=>[...h.slice(1),newP]);
          return newP;
        });

        // Update each compressor's physics: load follows PID pressure error
        cs=cs.map(c=>{
          if(c.status==="RUNNING"){
            const curP=sysPRef.current;
            const err=SP-curP;
            // PID-informed load: when pressure is low, run harder
            const tgt=clamp(60+err*18+rnd(-3,3),25,100);
            const newLoad=clamp(c.load+(tgt-c.load)*0.15,0,100);
            const newCurr=(c.kw*newLoad/100)/0.38*rnd(0.97,1.03);
            const newTemp=clamp(c.temp+(newLoad>80?0.1:-0.04)+rnd(-0.03,0.03),30,110);
            let st=c.status, ft=c.fault;
            if(!ft&&Math.random()<0.0003){
              ft=newTemp>90?"High Temp Trip":"Overload Protection";
              st="FAULT";
              addAlarm("FLT_"+c.id,`${c.brand} ${c.model} C-${String(c.seq).padStart(2,"0")}: ${ft}`,"FAULT");
            }
            return{...c,load:newLoad,curr:newCurr,temp:newTemp,press:clamp(curP+rnd(-0.05,0.05),0,13),runtime:c.runtime+1,status:st,fault:ft};
          }
          if(c.status==="STANDBY") return{...c,load:0,curr:0,press:0,temp:Math.max(c.temp-0.02,30)};
          return c;
        });

        const kwNow=cs.filter(c=>c.status==="RUNNING").reduce((s,c)=>s+c.kw*c.load/100,0);
        const flowNow=cs.filter(c=>c.status==="RUNNING").reduce((s,c)=>s+c.flow*c.load/100,0);
        setKwHist(h=>[...h.slice(1),kwNow]);
        setFlowHist(h=>[...h.slice(1),flowNow]);
        setEnergy(e=>e+kwNow/3600);

        // Update sensor values from simulation
        setSensors(prev=>prev.map(s=>{
          if(s.type==="Pressure") return{...s,value:clamp(sysPRef.current+rnd(-0.05,0.05),0,12)};
          if(s.type==="Flow")     return{...s,value:clamp(flowNow+rnd(-0.1,0.1),0,15)};
          if(s.type==="Temp")     return{...s,value:clamp(s.value+rnd(-0.2,0.2),s.min,s.max)};
          return s;
        }));

        return cs;
      });
    },1000);
    return ()=>clearInterval(iv);
  },[simOn,addLog,addAlarm]);

  // ── handlers ────────────────────────────────────────────────────────────────
  const p=user?PERMS[user.role]:{};
  const handleLogin=u=>{setUsers(prev=>prev.map(x=>x.id===u.id?{...x,lastLogin:tsFull()}:x));setUser(u);addLog("AUTH",`เข้าสู่ระบบ: ${u.name} (${u.role})`,u.name);};
  const handleLogout=()=>{addLog("AUTH",`ออกจากระบบ: ${user.name}`,user.name);setUser(null);};
  const toggleComp=id=>setComps(prev=>prev.map(c=>{ if(c.id!==id)return c; const nx=c.status==="RUNNING"?"STANDBY":"RUNNING"; addLog("CTRL",`[MANUAL] ${nx==="RUNNING"?"START":"STOP"} C-${String(c.seq).padStart(2,"0")} ${c.brand} ${c.model}`,user.name); return{...c,status:nx,load:nx==="STANDBY"?0:c.load,curr:nx==="STANDBY"?0:c.curr}; }));
  const removeComp=id=>{ const c=comps.find(x=>x.id===id); addLog("CFG",`ลบปั้มลม: ${c.brand} ${c.model}`,user.name); setComps(prev=>prev.filter(x=>x.id!==id).map((x,i)=>({...x,seq:i+1,lead:i===0}))); };

  const handleSaveComp=(spec)=>{
    if(compModal==="new"){
      const nc=mkComp(spec,comps.length);
      setComps(prev=>[...prev,nc]);
      addLog("CFG",`เพิ่มปั้มลม: ${spec.brand} ${spec.model} ${spec.kw}kW`,user.name);
    } else {
      setComps(prev=>prev.map(c=>c.id===compModal.id?{...c,...spec,name:spec.name||spec.model}:c));
      addLog("CFG",`แก้ไขสเปค: ${spec.brand} ${spec.model}`,user.name);
    }
    setCompModal(null);
  };

  const changeSeq=m=>{ addLog("CFG",`Sequence: ${seqMode} → ${m}`,user.name); setSeqMode(m); };

  const handleSaveSensor=(spec)=>{
    if(sensorModal==="new"){
      setSensors(prev=>[...prev,{id:uid(),...spec,value:parseFloat(spec.min)||0}]);
      addLog("CFG",`เพิ่ม Sensor: ${spec.name} (${spec.type})`,user.name);
    } else {
      setSensors(prev=>prev.map(s=>s.id===sensorModal.id?{...s,...spec}:s));
      addLog("CFG",`แก้ไข Sensor: ${spec.name}`,user.name);
    }
    setSensorModal(null);
  };
  const handleAddUser=()=>{ if(!newUser.un||!newUser.pw||!newUser.name)return; if(users.find(u=>u.un===newUser.un))return; setUsers(prev=>[...prev,{id:uid(),...newUser,on:true}]); addLog("AUTH",`เพิ่มผู้ใช้: ${newUser.name}`,user.name); setNewUser({un:"",pw:"",name:"",role:"OPERATOR"}); setShowAddUser(false); };

  const runComps=comps.filter(c=>c.status==="RUNNING");
  // Power: sum of actual kW from all running cards (kw * load%)
  const totalKw=runComps.reduce((s,c)=>s+c.kw*c.load/100,0);
  // Flow: driven by base demand (what the factory actually consumes)
  const actualDemand=clamp(demand+Math.sin(tickRef.current*0.07)*0.5,0.1,20);
  const totalFlow=actualDemand;
  const pressOk=sysP>=sp-db&&sysP<=sp+db;
  const pressLow=sysP<sp-db;
  const pressClr=pressLow?C.red:pressOk?C.green:C.amber;

  // Log filter logic
  const filteredLogs = logs.filter(l=>
    (logFilter==="ALL"||l.type===logFilter) &&
    (logSearch===""||l.msg.toLowerCase().includes(logSearch.toLowerCase())||l.who.toLowerCase().includes(logSearch.toLowerCase()))
  );

  if(!user) return <Login users={users} onLogin={handleLogin}/>;

  const rm=ROLE_META[user.role];
  const SIDEBAR_W=collapsed?64:220;

  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.bg,fontFamily:"system-ui,sans-serif",color:C.text}}>
      <style>{`
        @keyframes pulse{0%,100%{box-shadow:0 0 0 3px #16A34A33}50%{box-shadow:0 0 0 5px #16A34A11}}
        *{box-sizing:border-box} button{cursor:pointer;transition:all .15s} button:hover{filter:brightness(0.93)}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:${C.bg}} ::-webkit-scrollbar-thumb{background:${C.accentBorder};border-radius:4px}
        input:focus,select:focus,textarea:focus{border-color:${C.accent}!important;outline:none}
      `}</style>

      {/* Compressor modal */}
      {compModal&&<CompSpecModal initial={compModal==="new"?null:compModal} onSave={handleSaveComp} onClose={()=>setCompModal(null)} existingCount={comps.length}/>}

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <div style={{width:SIDEBAR_W,minHeight:"100vh",background:C.bgSidebar,display:"flex",flexDirection:"column",transition:"width .25s ease",overflow:"hidden",flexShrink:0,boxShadow:"2px 0 12px rgba(0,0,0,0.15)"}}>

        {/* ── TOP: Toggle button row (always visible at top) ── */}
        <div style={{padding:"10px 10px 8px",borderBottom:"1px solid #ffffff15",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          {/* Hamburger / arrow toggle — always the first thing you see */}
          <button
            onClick={()=>setCollapsed(s=>!s)}
            title={collapsed?"ขยาย sidebar":"พับ sidebar"}
            style={{width:36,height:36,borderRadius:9,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer",transition:"background .15s"}}
          >
            {collapsed?"›":"‹"}
          </button>
          {/* Logo — only when expanded */}
          {!collapsed&&(
            <div style={{display:"flex",alignItems:"center",gap:8,overflow:"hidden"}}>
              <div style={{width:28,height:28,background:"linear-gradient(135deg,#3B82F6,#60A5FA)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>⚡</div>
              <div style={{minWidth:0}}>
                <div style={{color:"#fff",fontSize:11,fontWeight:800,letterSpacing:1,whiteSpace:"nowrap"}}>FOSTEC FIM 4.0</div>
                <div style={{color:"#93C5FD",fontSize:8,letterSpacing:1}}>FACTORY INFO MGMT</div>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:"10px 8px",overflowY:"auto"}}>
          {NAV.map(n=>{
            const active=tab===n.id, hasAlert=n.id==="ALARMS"&&alarms.length>0;
            return (
              <div key={n.id} onClick={()=>setTab(n.id)} title={collapsed?n.label:""}
                style={{display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px 0":"10px 12px",borderRadius:10,marginBottom:4,cursor:"pointer",justifyContent:collapsed?"center":"flex-start",background:active?"rgba(59,130,246,0.25)":"transparent",borderLeft:active?"3px solid #3B82F6":"3px solid transparent",transition:"all .15s",position:"relative"}}>
                {/* icon rendered as white text */}
                <span style={{fontSize:16,flexShrink:0,color:"#fff",opacity:active?1:0.6,lineHeight:1}}>{n.icon}</span>
                {!collapsed&&<span style={{fontSize:12,fontWeight:active?700:500,color:active?"#fff":"#93C5FD"}}>{n.label}</span>}
                {hasAlert&&<span style={{position:"absolute",top:6,right:collapsed?6:10,background:C.red,color:"#fff",borderRadius:"50%",width:14,height:14,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{alarms.length}</span>}
              </div>
            );
          })}
        </nav>

        {/* Sim toggle */}
        <div style={{padding:collapsed?"10px 0":"10px 14px",borderTop:"1px solid #ffffff10"}}>
          {!collapsed?(
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:10,color:"#93C5FD",fontWeight:600}}>SIMULATION</span>
              <div onClick={()=>setSimOn(s=>!s)} style={{width:36,height:20,borderRadius:10,background:simOn?"#3B82F6":"#374151",cursor:"pointer",position:"relative",transition:"background .3s"}}>
                <div style={{position:"absolute",top:3,left:simOn?18:3,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left .3s"}}/>
              </div>
            </div>
          ):(
            <div onClick={()=>setSimOn(s=>!s)} style={{display:"flex",justifyContent:"center",cursor:"pointer"}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:simOn?"#4ADE80":"#6B7280"}}/>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN ─────────────────────────────────────────────────────────────── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>

        {/* TOP BAR */}
        <div style={{background:C.bgCard,borderBottom:`1px solid ${C.border}`,padding:"0 20px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:C.shadow}}>
          {/* Left: page title */}
          <div>
            <h1 style={{fontSize:16,fontWeight:800,color:C.navy,margin:0}}>{NAV.find(n=>n.id===tab)?.label||tab}</h1>
            <div style={{fontSize:9,color:C.textFaint,marginTop:1}}>FOSTEC Factory Information Management System</div>
          </div>

          {/* Center: status pills */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:6,background:C.bg,border:`1px solid ${C.border}`,borderRadius:20,padding:"5px 14px"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:pressClr,boxShadow:`0 0 0 3px ${pressClr}33`}}/>
              <span style={{fontSize:12,fontWeight:700,color:pressClr,fontFamily:"monospace"}}>{sysP.toFixed(3)} bar</span>
              <span style={{fontSize:10,color:C.textFaint}}>/ SP {sp.toFixed(2)}</span>
            </div>
            <div style={{background:C.accentSoft,border:`1px solid ${C.accentBorder}`,borderRadius:20,padding:"5px 12px",fontSize:11,color:C.accent,fontWeight:700}}>
              {runComps.length}/{comps.length} Running
            </div>
            <div style={{background:seqMode==="AUTO"?C.greenLight:C.amberLight,border:`1px solid ${seqMode==="AUTO"?C.greenBorder:C.amberBorder}`,borderRadius:20,padding:"5px 12px",fontSize:11,color:seqMode==="AUTO"?C.green:C.amber,fontWeight:700}}>
              {seqMode}
            </div>
          </div>

          {/* RIGHT: Clock + User + Logout */}
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <ClockDisplay/>
            <div style={{width:1,height:36,background:C.border}}/>
            <div style={{display:"flex",alignItems:"center",gap:10,background:rm.bg,border:`1.5px solid ${rm.bd}`,borderRadius:10,padding:"7px 14px"}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:C.bgCard,border:`2px solid ${rm.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,overflow:"hidden"}}>
                {user.avatar?<img src={user.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:rm.icon}
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:rm.tx}}>{user.name}</div>
                <div style={{fontSize:8,color:rm.bd,letterSpacing:1,fontWeight:600}}>{user.role}</div>
              </div>
              <button onClick={handleLogout} title="ออกจากระบบ"
                style={{background:C.redLight,border:`1.5px solid ${C.redBorder}`,color:C.red,borderRadius:8,padding:"4px 10px",fontSize:10,fontWeight:700,marginLeft:4}}>
                ออก
              </button>
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={{flex:1,overflowY:"auto",padding:20}}>

          {/* ══ DASHBOARD ══ */}
          {tab==="DASHBOARD"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10,marginBottom:18}}>
                <StatCard label="System Pressure" value={sysP.toFixed(3)} unit="bar" clr={pressClr} icon="🌡" sub={pressOk?"✓ Normal":pressLow?"▼ Low":"▲ High"}/>
                <StatCard label="Setpoint" value={sp.toFixed(2)} unit="bar" clr={C.amber} icon="🎯"/>
                <StatCard label="Running" value={`${runComps.length}/${comps.length}`} unit="units" clr={C.accent} icon="⚙"/>
                <StatCard label="Power" value={totalKw.toFixed(1)} unit="kW" clr="#8B5CF6" icon="⚡" sub={`${energy.toFixed(3)} kWh`}/>
                <StatCard label="Flow" value={totalFlow.toFixed(2)} unit="m³/min" clr={C.green} icon="💨"/>
                <StatCard label="Seq Mode" value={seqMode} unit={`${comps.filter(c=>c.status==="FAULT").length} fault`} clr={C.accent} icon="🔄"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"200px 1fr 240px",gap:14}}>
                {/* Gauge */}
                <Card style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <STitle>System Pressure</STitle>
                  <Gauge val={sysP} sp={sp} size={160}/>
                  <div style={{marginTop:8,padding:"4px 14px",borderRadius:20,background:pressOk?C.greenLight:pressLow?C.redLight:C.amberLight,border:`1px solid ${pressClr}`,color:pressClr,fontSize:9,fontWeight:700}}>
                    {pressOk?"● NORMAL":pressLow?"▼ LOW":"▲ HIGH"}
                  </div>
                  <div style={{marginTop:12,width:"100%",fontSize:10,color:C.textSoft,lineHeight:2.2}}>
                    {[["SP High",(sp+db).toFixed(2)],["Setpoint",sp.toFixed(2)],["SP Low",(sp-db).toFixed(2)]].map(([l,v])=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between"}}>
                        <span>{l}</span><span style={{color:C.amber,fontWeight:700,fontFamily:"monospace"}}>{v} bar</span>
                      </div>
                    ))}
                  </div>
                </Card>
                {/* Center */}
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <Card>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <STitle>Pressure Trend (60s)</STitle>
                      <span style={{fontSize:12,fontWeight:700,color:pressClr,fontFamily:"monospace"}}>{sysP.toFixed(3)} bar</span>
                    </div>
                    <svg viewBox="0 0 400 70" style={{width:"100%",height:70}} preserveAspectRatio="none">
                      <defs><linearGradient id="ptG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity="0.2"/><stop offset="100%" stopColor={C.accent} stopOpacity="0"/></linearGradient></defs>
                      {(()=>{ const yS=66-((sp-3)/10)*60, yH=66-((sp+db-3)/10)*60, yL=66-((sp-db-3)/10)*60; return <><rect x="0" y={yH} width="400" height={yL-yH} fill={C.amber+"18"}/><line x1="0" y1={yS} x2="400" y2={yS} stroke={C.amber} strokeWidth="1.5" strokeDasharray="5,4" opacity="0.6"/></>; })()}
                      {pressHist.length>1&&(()=>{ const pts=pressHist.map((v,i)=>`${(i/(pressHist.length-1))*400},${66-(clamp(v,3,13)-3)/10*60}`); return <><polygon points={`0,66 ${pts.join(" ")} 400,66`} fill="url(#ptG2)"/><polyline points={pts.join(" ")} fill="none" stroke={C.accent} strokeWidth="2"/><circle cx={400} cy={66-(clamp(sysP,3,13)-3)/10*60} r="4" fill={C.accent}/></>; })()}
                    </svg>
                  </Card>
                  <Card>
                    <STitle>Unit Overview</STitle>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {comps.map(c=>{ const s=ST_META[c.status]||ST_META.STANDBY; return (
                        <div key={c.id} style={{background:s.bg,border:`1.5px solid ${s.bd}`,borderRadius:10,padding:"8px 12px",flex:1,minWidth:100}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                            <span style={{fontSize:11,fontWeight:800,color:s.tx}}>C-{String(c.seq).padStart(2,"0")}</span>
                            <div style={{width:7,height:7,borderRadius:"50%",background:s.dot,animation:c.status==="RUNNING"?"pulse 1.5s infinite":"none"}}/>
                          </div>
                          <div style={{fontSize:9,color:C.textSoft,marginBottom:4}}>{c.brand} {c.model}</div>
                          <div style={{background:"#fff",borderRadius:4,height:4,overflow:"hidden",marginBottom:3}}>
                            <div style={{width:`${c.load}%`,height:"100%",background:c.clr,transition:"width .5s"}}/>
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.textSoft}}>
                            <span>{c.load.toFixed(0)}%</span><span>{(c.kw*c.load/100).toFixed(1)}kW</span>
                          </div>
                        </div>
                      ); })}
                    </div>
                  </Card>
                  <Card>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <STitle>Power Draw (60s)</STitle>
                      <span style={{fontSize:12,fontWeight:700,color:"#8B5CF6",fontFamily:"monospace"}}>{totalKw.toFixed(2)} kW</span>
                    </div>
                    <Spark data={kwHist} clr="#8B5CF6" h={40}/>
                  </Card>
                </div>
                {/* Right */}
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <Card>
                    <STitle>System Stats</STitle>
                    <KV label="Seq Mode" value={seqMode}/>
                    <KV label="Running" value={`${runComps.length} unit`} vc={C.green}/>
                    <KV label="Standby" value={`${comps.filter(c=>c.status==="STANDBY").length} unit`} vc={C.accentLight}/>
                    <KV label="Fault" value={`${comps.filter(c=>c.status==="FAULT").length} unit`} vc={C.red}/>
                    <KV label="kWh" value={energy.toFixed(3)} vc="#8B5CF6"/>
                    <KV label="Efficiency" value={totalFlow>0?`${(totalKw/totalFlow).toFixed(2)} kW·m`:"—"} vc={C.amber}/>
                  </Card>
                  <Card style={{flex:1}}>
                    <STitle>Recent Events</STitle>
                    <div style={{maxHeight:220,overflowY:"auto"}}>
                      {logs.slice(0,8).map(l=>{ const m=LOG_META[l.type]||LOG_META.SYS; return (
                        <div key={l.id} style={{borderLeft:`3px solid ${m.clr}`,paddingLeft:8,marginBottom:8}}>
                          <div style={{fontSize:10,color:C.textMid,lineHeight:1.4}}>{m.icon} {l.msg}</div>
                          <div style={{fontSize:9,color:C.textFaint,marginTop:1}}>{l.time}</div>
                        </div>
                      ); })}
                      {logs.length===0&&<div style={{color:C.textFaint,fontSize:10,textAlign:"center",padding:20}}>ไม่มีเหตุการณ์</div>}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* ══ COMPRESSORS ══ */}
          {tab==="COMPRESSORS"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                <div style={{fontSize:13,color:C.textSoft}}>{comps.length} ปั้มลมในระบบ</div>
                {p.cfg&&<button onClick={()=>setCompModal("new")} style={{background:`linear-gradient(135deg,${C.accent},${C.navy})`,border:"none",color:"#fff",borderRadius:10,padding:"9px 20px",fontSize:12,fontWeight:700,boxShadow:C.shadowMd}}>+ เพิ่มปั้มลม</button>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
                {comps.map(c=><CompCard key={c.id} c={c} onToggle={toggleComp} onRemove={removeComp} onEdit={c=>setCompModal(c)} canCtrl={p.ctrl} canDel={p.del} canCfg={p.cfg}/>)}
              </div>
            </div>
          )}

          {/* ══ SENSORS ══ */}
          {tab==="SENSORS"&&(
            <div>
              {sensorModal&&(
                <SensorModal
                  initial={sensorModal==="new"?null:sensorModal}
                  onSave={handleSaveSensor}
                  onClose={()=>setSensorModal(null)}
                  sensorCount={sensors.length}
                />
              )}
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{sensors.length} Sensors Connected</div>
                  <div style={{fontSize:10,color:C.textFaint,marginTop:2}}>Real-time monitoring · กดไอคอน ✏ เพื่อแก้ไข Sensor</div>
                </div>
                {p.cfg&&<button onClick={()=>setSensorModal("new")} style={{background:`linear-gradient(135deg,${C.accent},${C.navy})`,border:"none",color:"#fff",borderRadius:10,padding:"9px 20px",fontSize:12,fontWeight:700,boxShadow:C.shadowMd}}>+ เพิ่ม Sensor</button>}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14,marginBottom:20}}>
                {sensors.map(s=>{
                  const warn=s.value>=(s.warnHi!=null?s.warnHi:s.max)||s.value<=(s.warnLo!=null?s.warnLo:s.min);
                  const sclr=warn?C.red:s.clr;
                  const pct=clamp((s.value-s.min)/(s.max-s.min),0,1);
                  const typeIco=TYPE_ICON[s.type]||"📡";
                  const channels=s.channels||[{id:"c0",label:"Value",unit:s.unit,offset:0}];
                  return (
                    <Card key={s.id} style={{border:`1.5px solid ${sclr}33`,padding:16}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:38,height:38,borderRadius:10,background:sclr+"18",border:`1.5px solid ${sclr}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{typeIco}</div>
                          <div>
                            <div style={{fontSize:12,fontWeight:700,color:C.navy}}>{s.name}</div>
                            <div style={{fontSize:9,color:C.textFaint}}>{s.type} · {s.location||"—"}</div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:5,alignItems:"center"}}>
                          <div style={{width:7,height:7,borderRadius:"50%",background:warn?C.red:C.green}}/>
                          <span style={{fontSize:9,color:warn?C.red:C.green,fontWeight:600}}>{warn?"⚠ WARN":"● OK"}</span>
                          {p.cfg&&<button onClick={()=>setSensorModal(s)} style={{background:C.accentSoft,border:`1px solid ${C.accentBorder}`,color:C.accent,borderRadius:6,padding:"2px 7px",fontSize:9,cursor:"pointer"}}>✏</button>}
                          {p.del&&<button onClick={()=>setSensors(prev=>prev.filter(x=>x.id!==s.id))} style={{background:C.redLight,border:`1px solid ${C.redBorder}`,color:C.red,borderRadius:6,padding:"2px 7px",fontSize:9,cursor:"pointer"}}>✕</button>}
                        </div>
                      </div>

                      {/* Multi-channel values */}
                      <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(channels.length,3)},1fr)`,gap:8,marginBottom:10}}>
                        {channels.map((ch,ci)=>{
                          const chVal=+(s.value+(ch.offset||0)).toFixed(3);
                          const chClr=ci===0?sclr:COMP_COLORS[(ci+2)%COMP_COLORS.length];
                          return (
                            <div key={ch.id} style={{background:C.bg,borderRadius:8,padding:"8px 10px",textAlign:"center",border:`1px solid ${chClr}33`}}>
                              <div style={{fontSize:8,color:C.textFaint,marginBottom:2,letterSpacing:0.5}}>{ch.label}</div>
                              <div style={{fontSize:18,fontWeight:800,color:chClr,fontFamily:"monospace",lineHeight:1}}>{chVal.toFixed(2)}</div>
                              <div style={{fontSize:8,color:C.textFaint}}>{ch.unit}</div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Gauge bar with warn zones */}
                      <div style={{marginBottom:6}}>
                        <div style={{background:C.border,borderRadius:6,height:7,overflow:"hidden",position:"relative"}}>
                          {s.warnLo!=null&&<div style={{position:"absolute",left:0,width:`${clamp((s.warnLo-s.min)/(s.max-s.min),0,1)*100}%`,height:"100%",background:C.red+"33"}}/>}
                          {s.warnHi!=null&&<div style={{position:"absolute",right:0,width:`${clamp((s.max-s.warnHi)/(s.max-s.min),0,1)*100}%`,height:"100%",background:C.red+"33"}}/>}
                          <div style={{position:"absolute",left:0,width:`${pct*100}%`,height:"100%",background:`linear-gradient(90deg,${sclr}88,${sclr})`,borderRadius:6,transition:"width .5s"}}/>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:C.textFaint,marginTop:2}}>
                          <span>{s.min}</span>
                          <span style={{color:sclr,fontWeight:600}}>{(pct*100).toFixed(0)}%</span>
                          <span>{s.max} {s.unit}</span>
                        </div>
                      </div>
                      {s.note&&<div style={{fontSize:8,color:C.textFaint,fontStyle:"italic"}}>📝 {s.note}</div>}
                    </Card>
                  );
                })}
              </div>

              <Card>
                <STitle>Sensor Data Table</STitle>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead>
                      <tr style={{borderBottom:`2px solid ${C.border}`}}>
                        {["Sensor","Type","Location","Channels & Values","Range","Warn","Status"].map(h=>(
                          <th key={h} style={{padding:"8px 12px",textAlign:"left",color:C.textSoft,fontWeight:600,fontSize:10,letterSpacing:0.5,whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sensors.map((s,i)=>{
                        const warn=s.value>=(s.warnHi!=null?s.warnHi:s.max)||s.value<=(s.warnLo!=null?s.warnLo:s.min);
                        const channels=s.channels||[{id:"c0",label:"Value",unit:s.unit,offset:0}];
                        return (
                          <tr key={s.id} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?C.bg:"#fff"}}>
                            <td style={{padding:"8px 12px",fontWeight:600,color:C.navy}}>
                              <div style={{display:"flex",alignItems:"center",gap:6}}>
                                <div style={{width:8,height:8,borderRadius:"50%",background:s.clr,flexShrink:0}}/>
                                {s.name}
                              </div>
                            </td>
                            <td style={{padding:"8px 12px",color:C.textSoft,whiteSpace:"nowrap"}}>{s.type}</td>
                            <td style={{padding:"8px 12px",color:C.textSoft}}>{s.location||"—"}</td>
                            <td style={{padding:"8px 12px"}}>
                              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                                {channels.map(ch=>(
                                  <span key={ch.id} style={{background:C.accentSoft,border:`1px solid ${C.accentBorder}`,color:C.accent,borderRadius:6,padding:"1px 7px",fontSize:9,fontFamily:"monospace",fontWeight:700,whiteSpace:"nowrap"}}>
                                    {ch.label}: {(s.value+(ch.offset||0)).toFixed(2)} {ch.unit}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td style={{padding:"8px 12px",color:C.textFaint,fontSize:9,whiteSpace:"nowrap"}}>{s.min}–{s.max} {s.unit}</td>
                            <td style={{padding:"8px 12px",fontSize:9,color:C.textSoft,whiteSpace:"nowrap"}}>Lo≤{s.warnLo??s.min} · Hi≥{s.warnHi??s.max}</td>
                            <td style={{padding:"8px 12px"}}>
                              <span style={{background:warn?C.redLight:C.greenLight,border:`1px solid ${warn?C.red:C.green}`,color:warn?C.red:C.green,borderRadius:20,padding:"2px 10px",fontSize:9,fontWeight:600}}>
                                {warn?"⚠ WARN":"● NORMAL"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ══ SEQUENCE ══ */}
          {tab==="SEQUENCE"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:14}}>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <Card>
                  <STitle>Sequence Mode</STitle>
                  <div style={{display:"flex",gap:8,marginBottom:12}}>
                    {["AUTO","MANUAL","FIXED"].map(m=>(
                      <button key={m} onClick={()=>p.cfg&&changeSeq(m)} disabled={!p.cfg}
                        style={{flex:1,padding:"10px 0",background:seqMode===m?C.accent:C.bg,border:`1.5px solid ${seqMode===m?C.accent:C.border}`,color:seqMode===m?"#fff":C.textSoft,borderRadius:10,fontSize:12,fontWeight:700,opacity:p.cfg?1:0.5}}>
                        {m}
                      </button>
                    ))}
                  </div>
                  <div style={{background:C.accentSoft,border:`1px solid ${C.accentBorder}`,borderRadius:8,padding:"10px 14px",fontSize:11,color:C.textMid,lineHeight:1.7}}>
                    {seqMode==="AUTO"&&"🔄 AUTO: ระบบวิเคราะห์ Supply vs Demand Flow เปิด/ปิดปั้มอัตโนมัติตาม Deadband"}
                    {seqMode==="MANUAL"&&"🖐️ MANUAL: ผู้ปฏิบัติงานควบคุม Start/Stop เอง"}
                    {seqMode==="FIXED"&&"📌 FIXED: ปั้มลมทำงานตามลำดับที่กำหนดไว้คงที่"}
                  </div>
                </Card>
                <Card>
                  <STitle>Pressure Band Visualizer</STitle>
                  {(()=>{
                    // Auto-scale: show SP ± 2 bar, but expand if triggers fall outside
                    const triggerPressures = comps.slice(0,-1).map((_,i)=>sp-db*(1.2+i*0.4));
                    const allVals = [sysP, sp+db, sp-db, ...triggerPressures];
                    const margin = 2;
                    const yMin = Math.max(0, Math.floor(Math.min(...allVals) - margin));
                    const yMax = Math.ceil(Math.max(...allVals) + margin);
                    const range = yMax - yMin;
                    const H = 155, TOP = 8, BOT = TOP+H;
                    const toY = v => BOT - ((v-yMin)/range)*H;
                    // grid lines: every 1 bar if range<=6, every 2 bar if larger
                    const step = range <= 6 ? 1 : 2;
                    const gridVals = [];
                    for(let v = Math.ceil(yMin/step)*step; v <= yMax; v+=step) gridVals.push(v);
                    return (
                      <svg viewBox="0 0 440 175" style={{width:"100%",height:175}}>
                        {/* background */}
                        <rect x="36" y={TOP} width="388" height={H} rx="6" fill={C.bg}/>
                        {/* grid lines */}
                        {gridVals.map(v=>{ const y=toY(v); return <g key={v}>
                          <line x1="36" y1={y} x2="424" y2={y} stroke={C.border} strokeWidth="1"/>
                          <text x="32" y={y+4} textAnchor="end" fill={C.textFaint} style={{font:"9px monospace"}}>{v}</text>
                        </g>;})}
                        {/* y-axis label */}
                        <text x="10" y={TOP+H/2} textAnchor="middle" fill={C.textFaint}
                          style={{font:"8px monospace"}} transform={`rotate(-90,10,${TOP+H/2})`}>bar</text>
                        {/* Deadband zone */}
                        {(()=>{ const yH=toY(sp+db), yL=toY(sp-db); return <rect x="36" y={yH} width="388" height={yL-yH} fill={C.amber+"28"}/>;})()}
                        {/* SP line */}
                        {(()=>{ const y=toY(sp); return <>
                          <line x1="36" y1={y} x2="424" y2={y} stroke={C.amber} strokeWidth="1.5" strokeDasharray="6,4"/>
                          <text x="428" y={y+4} fill={C.amber} style={{font:"bold 9px monospace"}}>SP</text>
                        </>;})()} 
                        {/* Deadband labels */}
                        {(()=>{ const yH=toY(sp+db), yL=toY(sp-db); return <>
                          <text x="38" y={yH-2} fill={C.amber} style={{font:"7px monospace"}} opacity="0.7">+{db.toFixed(2)}</text>
                          <text x="38" y={yL+8} fill={C.amber} style={{font:"7px monospace"}} opacity="0.7">-{db.toFixed(2)}</text>
                        </>;})()} 
                        {/* Trigger lines per compressor */}
                        {comps.slice(0,-1).map((c,i)=>{
                          const tp=sp-db*(1.2+i*0.4);
                          if(tp<yMin||tp>yMax) return null;
                          const y=toY(tp);
                          return <g key={c.id}>
                            <line x1="36" y1={y} x2="424" y2={y} stroke={c.clr} strokeWidth="1.5" strokeDasharray="3,3" opacity="0.8"/>
                            <text x="40" y={y-3} fill={c.clr} style={{font:"7.5px monospace"}}>
                              +C-{String(i+2).padStart(2,"0")} {c.brand} {c.model} @ {tp.toFixed(2)}
                            </text>
                          </g>;
                        })}
                        {/* Current pressure line */}
                        {(()=>{
                          const clampedP = clamp(sysP, yMin, yMax);
                          const y=toY(clampedP);
                          return <>
                            <line x1="36" y1={y} x2="424" y2={y} stroke={C.accent} strokeWidth="2.5"/>
                            <circle cx="424" cy={y} r="5" fill={C.accent}/>
                            <text x="40" y={y-5} fill={C.accent} style={{font:"bold 9px monospace"}}>
                              ► {sysP.toFixed(3)} bar
                            </text>
                          </>;
                        })()}
                        {/* Scale info */}
                        <text x="428" y={TOP+H+2} textAnchor="end" fill={C.textFaint} style={{font:"8px monospace"}}>
                          {yMin}~{yMax} bar
                        </text>
                      </svg>
                    );
                  })()}
                </Card>
                <Card>
                  <STitle>Lead / Lag Order</STitle>
                  {[...comps].sort((a,b)=>a.seq-b.seq).map((c,i)=>{ const s=ST_META[c.status]||ST_META.STANDBY; return (
                    <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,background:s.bg,border:`1.5px solid ${s.bd}33`,borderRadius:10,padding:"10px 12px",marginBottom:6}}>
                      <div style={{width:26,height:26,borderRadius:"50%",background:i===0?"#FEF9C3":C.bg,border:`2px solid ${i===0?C.amber:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:i===0?C.amber:C.textSoft,flexShrink:0}}>{c.seq}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:700,color:s.tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>C-{String(c.seq).padStart(2,"0")} — {c.brand} {c.model}</div>
                        <div style={{fontSize:9,color:C.textSoft}}>ON &lt;{(sp-db*(1.2+i*0.4)).toFixed(2)} · OFF &gt;{(sp+db*(1.0+i*0.3)).toFixed(2)} bar · {c.kw}kW</div>
                      </div>
                      <div style={{display:"flex",gap:5,flexShrink:0}}>
                        <Badge label={s.label} bg={s.bg} bd={s.bd} tx={s.tx}/>
                        {i===0?<Badge label="LEAD" bg="#FEF9C3" bd={C.amberBorder} tx="#92400E"/>:<span style={{fontSize:9,color:C.textFaint}}>LAG{i}</span>}
                      </div>
                    </div>
                  ); })}
                </Card>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {/* PID Status panel */}
                <Card style={{border:`1.5px solid ${C.accentBorder}`}}>
                  <STitle>PID Controller Status</STitle>
                  {/* Live PID outputs */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                    {[
                      {l:"Output",v:pidOut,c:pidOut>0?C.green:pidOut<0?C.red:C.textFaint,u:""},
                      {l:"I-Term",v:pidI,c:"#8B5CF6",u:""},
                      {l:"D-Term",v:pidD,c:C.amber,u:""},
                    ].map(x=>(
                      <div key={x.l} style={{background:C.bg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                        <div style={{fontSize:8,color:C.textFaint,letterSpacing:1,marginBottom:4}}>{x.l}</div>
                        <div style={{fontSize:16,fontWeight:800,color:x.c,fontFamily:"monospace"}}>{x.v.toFixed(3)}</div>
                      </div>
                    ))}
                  </div>
                  {/* PID tuning sliders */}
                  <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12}}>
                    <div style={{fontSize:9,color:C.textSoft,fontWeight:600,letterSpacing:1,marginBottom:10}}>PID TUNING PARAMETERS</div>
                    {[
                      {l:"Kp (Proportional)",v:pidKp,s:p.cfg?setPidKp:null,min:0,max:5,step:0.05,c:"#3B82F6"},
                      {l:"Ki (Integral)",    v:pidKi,s:p.cfg?setPidKi:null,min:0,max:1,step:0.01,c:"#8B5CF6"},
                      {l:"Kd (Derivative)",  v:pidKd,s:p.cfg?setPidKd:null,min:0,max:0.5,step:0.005,c:C.amber},
                    ].map((it,i)=>(
                      <div key={i} style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                          <span style={{fontSize:10,color:C.textSoft}}>{it.l}</span>
                          <span style={{fontSize:11,fontWeight:800,color:it.c,fontFamily:"monospace"}}>{it.v.toFixed(3)}</span>
                        </div>
                        <input type="range" min={it.min} max={it.max} step={it.step} value={it.v}
                          disabled={!it.s}
                          onChange={e=>it.s&&it.s(parseFloat(e.target.value))}
                          style={{width:"100%",accentColor:it.c,opacity:it.s?1:0.4}}/>
                      </div>
                    ))}
                  </div>
                  {/* PID bar */}
                  <div style={{marginTop:4}}>
                    <div style={{fontSize:8,color:C.textFaint,marginBottom:4}}>PID Output → Unit Demand ({pidOut>0?"↑ Need More Supply":"↓ Reduce Supply"})</div>
                    <div style={{background:C.border,borderRadius:6,height:8,position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:2,background:C.textFaint}}/>
                      <div style={{position:"absolute",
                        left:pidOut>=0?"50%":`${50+pidOut/5*50}%`,
                        width:`${Math.abs(pidOut)/5*50}%`,
                        height:"100%",
                        background:pidOut>=0?C.green:C.red,
                        transition:"all .3s"}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:C.textFaint,marginTop:2}}>
                      <span>-5 (Stop)</span><span>0</span><span>+5 (Max)</span>
                    </div>
                  </div>
                </Card>

                <Card>
                  <STitle>Control Parameters</STitle>
                  {[
                    {l:"Pressure SP",v:sp,s:p.cfg?setSp:null,min:3,max:12,step:0.1,u:"bar",c:C.amber},
                    {l:"Deadband ±",v:db,s:p.cfg?setDb:null,min:0.05,max:1.5,step:0.05,u:"bar",c:C.accent},
                    {l:"Base Demand (sim)",v:demand,s:setDemand,min:0.2,max:8,step:0.1,u:"m³/min",c:C.green},
                  ].map((it,i)=>(
                    <div key={i} style={{marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:11,color:C.textSoft,fontWeight:600}}>{it.l}</span>
                        <span style={{fontSize:12,fontWeight:800,color:it.c,fontFamily:"monospace"}}>{it.v.toFixed(2)} {it.u}</span>
                      </div>
                      <input type="range" min={it.min} max={it.max} step={it.step} value={it.v} disabled={!it.s}
                        onChange={e=>it.s&&it.s(parseFloat(e.target.value))}
                        style={{width:"100%",accentColor:it.c,opacity:it.s?1:0.4}}/>
                    </div>
                  ))}
                  {!p.cfg&&<div style={{background:C.amberLight,border:`1px solid ${C.amberBorder}`,borderRadius:8,padding:"7px 12px",fontSize:10,color:C.amber,fontWeight:600}}>⚠ สิทธิ์ {user.role} ไม่สามารถแก้ไขค่าได้</div>}
                </Card>
                <Card>
                  <STitle>Flow Analysis</STitle>
                  <KV label="Demand (Base)" value={`${demand.toFixed(3)} m³/min`} vc={C.green}/>
                  <KV label="Demand (Actual)" value={`${totalFlow.toFixed(3)} m³/min`} vc={C.amber}/>
                  <KV label="Supply" value={`${runComps.reduce((s,c)=>s+c.flow*(c.load/100),0).toFixed(3)} m³/min`} vc={C.accent}/>
                  <KV label="Net δ" value={`${(runComps.reduce((s,c)=>s+c.flow*(c.load/100),0)-totalFlow).toFixed(3)} m³/min`} vc={runComps.reduce((s,c)=>s+c.flow*(c.load/100),0)>totalFlow?C.green:C.red}/>
                  <KV label="dP/dt" value={`${(K*(runComps.reduce((s,c)=>s+c.flow*(c.load/100),0)-totalFlow)/VOL).toFixed(4)} bar/s`} vc="#8B5CF6"/>
                </Card>
              </div>
            </div>
          )}

          {/* ══ ENERGY ══ */}
          {tab==="ENERGY"&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                <StatCard label="Total Consumed" value={energy.toFixed(4)} unit="kWh" clr="#8B5CF6" icon="⚡"/>
                <StatCard label="Installed" value={`${comps.reduce((s,c)=>s+c.kw,0)}`} unit="kW" clr={C.accent} icon="🔧"/>
                <StatCard label="Utilization" value={`${comps.reduce((s,c)=>s+c.kw,0)>0?(totalKw/comps.reduce((s,c)=>s+c.kw,0)*100).toFixed(1):0}%`} unit="of installed" clr={C.green} icon="📊"/>
                <StatCard label="Spec. Energy" value={totalFlow>0?(totalKw/totalFlow).toFixed(3):"—"} unit="kW/(m³/min)" clr={C.amber} icon="💡"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Card><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><STitle>Power (60s)</STitle><span style={{fontSize:12,fontWeight:700,color:"#8B5CF6",fontFamily:"monospace"}}>{totalKw.toFixed(2)} kW</span></div><Spark data={kwHist} clr="#8B5CF6" h={55}/></Card>
                <Card><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><STitle>Flow (60s)</STitle><span style={{fontSize:12,fontWeight:700,color:C.green,fontFamily:"monospace"}}>{totalFlow.toFixed(3)} m³/min</span></div><Spark data={flowHist} clr={C.green} h={55}/></Card>
              </div>
              <Card>
                <STitle>Per-Unit Breakdown</STitle>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
                  {comps.map(c=>{ const kw=c.kw*c.load/100, pct=totalKw>0?kw/totalKw*100:0; return (
                    <div key={c.id} style={{background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:10,padding:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:c.clr,flexShrink:0}}/>
                        <span style={{fontSize:12,fontWeight:800,color:C.navy}}>C-{String(c.seq).padStart(2,"0")}</span>
                        <span style={{fontSize:10,color:C.textFaint,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.brand} {c.model}</span>
                      </div>
                      <div style={{fontSize:22,fontWeight:800,color:c.clr,marginBottom:2}}>{kw.toFixed(1)}<span style={{fontSize:11}}>kW</span></div>
                      <div style={{fontSize:10,color:C.textSoft,marginBottom:6}}>{pct.toFixed(1)}% of total</div>
                      <div style={{background:C.border,borderRadius:4,height:5,marginBottom:6}}>
                        <div style={{width:`${pct}%`,height:"100%",background:c.clr,borderRadius:4,transition:"width .5s"}}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.textFaint}}>
                        <span>Rated: {c.kw}kW</span><span>Load: {c.load.toFixed(0)}%</span>
                      </div>
                    </div>
                  ); })}
                </div>
              </Card>
            </div>
          )}

          {/* ══ LOG ══ */}
          {tab==="LOG"&&(
            <Card>
              {/* Header row */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <STitle>System Event Log</STitle>
                  <div style={{fontSize:10,color:C.textFaint,marginTop:-10}}>{filteredLogs.length} รายการ {logFilter!=="ALL"&&`(กรอง: ${logFilter})`}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input value={logSearch} onChange={e=>setLogSearch(e.target.value)} placeholder="ค้นหา..."
                    style={{background:C.bg,border:`1.5px solid ${C.accentBorder}`,borderRadius:8,padding:"6px 12px",color:C.text,fontSize:11,outline:"none",width:180}}/>
                  <button onClick={()=>setLogs([])} style={{background:C.bg,border:`1px solid ${C.border}`,color:C.textSoft,borderRadius:8,padding:"6px 14px",fontSize:11}}>Clear</button>
                </div>
              </div>

              {/* Filter chips — clickable to toggle */}
              <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
                {/* ALL chip */}
                <button onClick={()=>setLogFilter("ALL")}
                  style={{background:logFilter==="ALL"?C.navy:C.bg, border:`1.5px solid ${logFilter==="ALL"?C.navy:C.border}`, color:logFilter==="ALL"?"#fff":C.textSoft, borderRadius:20, padding:"5px 14px", fontSize:10, fontWeight:700, transition:"all .15s"}}>
                  ทั้งหมด {logs.length>0&&`(${logs.length})`}
                </button>
                {Object.entries(LOG_META).map(([k,m])=>{
                  const cnt=logs.filter(l=>l.type===k).length;
                  const active=logFilter===k;
                  return (
                    <button key={k} onClick={()=>setLogFilter(active?"ALL":k)}
                      style={{background:active?m.clr:m.bg, border:`1.5px solid ${active?m.clr:m.clr+"44"}`, color:active?"#fff":m.clr, borderRadius:20, padding:"5px 14px", fontSize:10, fontWeight:700, transition:"all .15s", display:"flex",alignItems:"center",gap:5}}>
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                      {cnt>0&&<span style={{background:active?"rgba(255,255,255,0.25)":m.clr+"22",borderRadius:10,padding:"0 6px",fontSize:9,fontWeight:800}}>{cnt}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Log list */}
              <div style={{maxHeight:460,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
                {filteredLogs.length===0&&(
                  <div style={{color:C.textFaint,textAlign:"center",padding:40,fontSize:13}}>
                    {logFilter!=="ALL"?`ไม่มีรายการประเภท ${LOG_META[logFilter]?.label}`:"ไม่มีรายการ"}
                  </div>
                )}
                {filteredLogs.map(l=>{ const m=LOG_META[l.type]||LOG_META.SYS; return (
                  <div key={l.id} style={{background:m.bg,border:`1px solid ${m.clr}22`,borderLeft:`3px solid ${m.clr}`,borderRadius:"0 8px 8px 0",padding:"8px 14px",display:"flex",gap:10}}>
                    <span style={{fontSize:14,flexShrink:0}}>{m.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,color:C.textMid,marginBottom:2,lineHeight:1.4}}>{l.msg}</div>
                      <div style={{display:"flex",gap:10,fontSize:9,color:C.textFaint,flexWrap:"wrap"}}>
                        <span>🕐 {l.time}</span>
                        <span>👤 {l.who}</span>
                        <span style={{background:m.clr+"22",color:m.clr,padding:"0 6px",borderRadius:4,fontWeight:600}}>{m.label}</span>
                      </div>
                    </div>
                  </div>
                ); })}
              </div>
            </Card>
          )}

          {/* ══ ALARMS ══ */}
          {tab==="ALARMS"&&(
            <div>
              {/* Header */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{alarms.length} Active Alarms</div>
                  <div style={{fontSize:10,color:C.textFaint,marginTop:1}}>
                    {alarms.filter(a=>(aFilter==="ALL"||a.level===aFilter)&&(aSearch===""||a.msg.toLowerCase().includes(aSearch.toLowerCase())||a.code.toLowerCase().includes(aSearch.toLowerCase()))).length} รายการ
                    {aFilter!=="ALL"&&` (กรอง: ${aFilter})`}
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <input value={aSearch} onChange={e=>setASearch(e.target.value)} placeholder="ค้นหา Alarm..."
                    style={{background:C.bg,border:`1.5px solid ${C.accentBorder}`,borderRadius:8,padding:"6px 12px",color:C.text,fontSize:11,outline:"none",width:180}}/>
                  {alarms.length>0&&<button onClick={()=>{addLog("ALARM",`ACK ALL (${alarms.length})`,user.name);setAlarms([]);}}
                    style={{background:C.bg,border:`1px solid ${C.border}`,color:C.textSoft,borderRadius:8,padding:"6px 16px",fontSize:11,cursor:"pointer"}}>ACK All</button>}
                </div>
              </div>

              {/* Summary cards — click to toggle filter */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
                {Object.entries(ALARM_META).map(([k,m])=>{
                  const cnt=alarms.filter(a=>a.level===k).length;
                  const active=aFilter===k;
                  return (
                    <div key={k} onClick={()=>setAFilter(active?"ALL":k)}
                      style={{background:active?m.clr:C.bgCard,border:`1.5px solid ${active?m.clr:m.bd}`,borderRadius:12,padding:"12px 16px",cursor:"pointer",transition:"all .15s",boxShadow:C.shadow}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                        <span style={{fontSize:18}}>{m.icon}</span>
                        <span style={{fontSize:24,fontWeight:800,color:active?"#fff":m.clr,fontFamily:"monospace"}}>{cnt}</span>
                      </div>
                      <div style={{fontSize:10,fontWeight:700,color:active?"#fff":m.clr,letterSpacing:1}}>{m.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Filter chips */}
              <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
                <button onClick={()=>setAFilter("ALL")}
                  style={{background:aFilter==="ALL"?C.navy:C.bg,border:`1.5px solid ${aFilter==="ALL"?C.navy:C.border}`,color:aFilter==="ALL"?"#fff":C.textSoft,borderRadius:20,padding:"5px 14px",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                  ทั้งหมด ({alarms.length})
                </button>
                {Object.entries(ALARM_META).map(([k,m])=>{
                  const cnt=alarms.filter(a=>a.level===k).length;
                  const active=aFilter===k;
                  return cnt>0&&(
                    <button key={k} onClick={()=>setAFilter(active?"ALL":k)}
                      style={{background:active?m.clr:m.bg,border:`1.5px solid ${active?m.clr:m.clr+"44"}`,color:active?"#fff":m.clr,borderRadius:20,padding:"5px 14px",fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                      <span>{m.icon}</span><span>{m.label}</span>
                      <span style={{background:active?"rgba(255,255,255,0.25)":m.clr+"22",borderRadius:10,padding:"0 6px",fontSize:9,fontWeight:800}}>{cnt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Alarm list */}
              {(()=>{
                const filtered=alarms.filter(a=>(aFilter==="ALL"||a.level===aFilter)&&(aSearch===""||a.msg.toLowerCase().includes(aSearch.toLowerCase())||a.code.toLowerCase().includes(aSearch.toLowerCase())));
                return filtered.length===0?(
                  <Card style={{textAlign:"center",padding:60,border:`1.5px solid ${C.greenBorder}`}}>
                    <div style={{fontSize:36,marginBottom:10}}>✓</div>
                    <div style={{fontSize:15,fontWeight:700,color:C.green}}>{aFilter==="ALL"?"NO ACTIVE ALARMS":`ไม่มี Alarm ประเภท ${aFilter}`}</div>
                    <div style={{color:C.textFaint,marginTop:4,fontSize:11}}>ระบบทำงานปกติ</div>
                  </Card>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {filtered.map(a=>{
                      const m=ALARM_META[a.level]||ALARM_META.WARNING;
                      return (
                        <div key={a.id} style={{background:m.bg,border:`1.5px solid ${m.bd}`,borderLeft:`4px solid ${m.clr}`,borderRadius:"0 12px 12px 0",padding:"12px 18px",display:"flex",alignItems:"center",gap:14}}>
                          <span style={{fontSize:20,flexShrink:0}}>{m.icon}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,fontWeight:700,color:m.clr,marginBottom:3}}>{a.msg}</div>
                            <div style={{display:"flex",gap:10,fontSize:9,color:C.textSoft,flexWrap:"wrap"}}>
                              <span>🕐 {a.time}</span>
                              <span>Code: {a.code}</span>
                              <span style={{background:m.clr+"22",color:m.clr,padding:"0 6px",borderRadius:4,fontWeight:600}}>{m.label}</span>
                            </div>
                          </div>
                          <button onClick={()=>{addLog("ALARM",`ACK: ${a.msg}`,user.name);setAlarms(prev=>prev.filter(x=>x.id!==a.id));}}
                            style={{background:"#fff",border:`1px solid ${C.border}`,color:C.textSoft,borderRadius:8,padding:"5px 14px",fontSize:10,cursor:"pointer",fontWeight:600,flexShrink:0}}>ACK</button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ══ SETTINGS ══ */}
          {tab==="SETTINGS"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <Card>
                <STitle>Pressure Control</STitle>
                {[
                  {l:"Setpoint",v:sp,s:setSp,min:3,max:12,step:0.1,u:"bar",c:C.amber,ok:p.cfg},
                  {l:"Deadband ±",v:db,s:setDb,min:0.05,max:1.5,step:0.05,u:"bar",c:C.accent,ok:p.cfg},
                  {l:"Base Demand (sim)",v:demand,s:setDemand,min:0.2,max:8,step:0.1,u:"m³/min",c:C.green,ok:true},
                ].map((it,i)=>(
                  <div key={i} style={{marginBottom:18}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <label style={{fontSize:11,color:C.textSoft,fontWeight:600}}>{it.l}</label>
                      <span style={{fontSize:12,fontWeight:800,color:it.c,fontFamily:"monospace"}}>{it.v.toFixed(2)} {it.u}</span>
                    </div>
                    <input type="range" min={it.min} max={it.max} step={it.step} value={it.v} disabled={!it.ok}
                      onChange={e=>it.ok&&it.s(parseFloat(e.target.value))} style={{width:"100%",accentColor:it.c,opacity:it.ok?1:0.4}}/>
                  </div>
                ))}
              </Card>
              <Card>
                <STitle>Unit Priority</STitle>
                {comps.map((c,i)=>(
                  <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:c.clr,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.brand} {c.model}</div>
                      <div style={{fontSize:9,color:C.textFaint}}>{c.kw}kW · {c.flow}m³/min · {c.type}</div>
                    </div>
                    {p.cfg&&<button onClick={()=>setComps(prev=>prev.map((x,j)=>({...x,lead:j===i,seq:j===i?1:(j<i?j+2:j+1)})))}
                      style={{background:c.lead?"#FEF9C3":C.bg,border:`1.5px solid ${c.lead?C.amber:C.border}`,color:c.lead?C.amber:C.textSoft,borderRadius:8,padding:"3px 10px",fontSize:10,fontWeight:700,flexShrink:0}}>
                      {c.lead?"★ LEAD":"Set Lead"}
                    </button>}
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* ══ USERS ══ */}
          {tab==="USERS"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                <div style={{fontSize:13,color:C.textSoft}}>{users.length} ผู้ใช้งาน</div>
                {p.users&&<button onClick={()=>setShowAddUser(s=>!s)} style={{background:`linear-gradient(135deg,${C.accent},${C.navy})`,border:"none",color:"#fff",borderRadius:10,padding:"9px 20px",fontSize:12,fontWeight:700,boxShadow:C.shadowMd}}>+ เพิ่มผู้ใช้งาน</button>}
              </div>
              {showAddUser&&(
                <Card style={{marginBottom:14,border:`1.5px solid ${C.accentBorder}`}}>
                  <STitle>เพิ่มผู้ใช้งานใหม่</STitle>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                    <Inp label="ชื่อแสดง *" value={newUser.name} onChange={v=>setNewUser(p=>({...p,name:v}))} placeholder="ชื่อ-สกุล"/>
                    <Inp label="ชื่อผู้ใช้ *" value={newUser.un} onChange={v=>setNewUser(p=>({...p,un:v}))} placeholder="username"/>
                    <Inp label="รหัสผ่าน *" value={newUser.pw} onChange={v=>setNewUser(p=>({...p,pw:v}))} placeholder="password" type="password"/>
                    <Inp label="สิทธิ์" value={newUser.role} onChange={v=>setNewUser(p=>({...p,role:v}))} options={ROLES}/>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setShowAddUser(false)} style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,color:C.textSoft,borderRadius:8,padding:9,fontSize:12}}>ยกเลิก</button>
                    <button onClick={handleAddUser} style={{flex:2,background:`linear-gradient(135deg,${C.accent},${C.navy})`,border:"none",color:"#fff",borderRadius:8,padding:9,fontSize:12,fontWeight:700}}>บันทึก</button>
                  </div>
                </Card>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {users.map(u=>{ const rm2=ROLE_META[u.role]; const isMe=u.id===user.id; return (
                  <Card key={u.id} style={{border:`1.5px solid ${u.on?rm2.bd+"44":C.border}`,opacity:u.on?1:0.6,padding:"14px 18px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                      {/* Avatar with upload */}
                      <div style={{position:"relative",flexShrink:0}}>
                        <div style={{width:48,height:48,borderRadius:"50%",background:rm2.bg,border:`2px solid ${rm2.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,overflow:"hidden"}}>
                          {u.avatar
                            ? <img src={u.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                            : rm2.icon}
                        </div>
                        {isMe&&(
                          <label title="เปลี่ยนรูปโปรไฟล์"
                            style={{position:"absolute",bottom:-2,right:-2,width:18,height:18,borderRadius:"50%",background:C.accent,border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:9,color:"#fff"}}>
                            ✎
                            <input type="file" accept="image/*" style={{display:"none"}}
                              onChange={e=>{
                                const file=e.target.files?.[0];
                                if(!file) return;
                                const reader=new FileReader();
                                reader.onload=ev=>{
                                  setUsers(prev=>prev.map(x=>x.id===u.id?{...x,avatar:ev.target.result}:x));
                                  if(user.id===u.id) setUser(prev=>({...prev,avatar:ev.target.result}));
                                };
                                reader.readAsDataURL(file);
                              }}/>
                          </label>
                        )}
                        {/* Admin can change anyone's avatar */}
                        {!isMe&&p.users&&(
                          <label title="เปลี่ยนรูปโปรไฟล์"
                            style={{position:"absolute",bottom:-2,right:-2,width:18,height:18,borderRadius:"50%",background:C.textSoft,border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:9,color:"#fff"}}>
                            ✎
                            <input type="file" accept="image/*" style={{display:"none"}}
                              onChange={e=>{
                                const file=e.target.files?.[0];
                                if(!file) return;
                                const reader=new FileReader();
                                reader.onload=ev=>setUsers(prev=>prev.map(x=>x.id===u.id?{...x,avatar:ev.target.result}:x));
                                reader.readAsDataURL(file);
                              }}/>
                          </label>
                        )}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                          <span style={{fontSize:13,fontWeight:700,color:C.navy}}>{u.name}</span>
                          {isMe&&<Badge label="คุณ" bg={C.accentSoft} bd={C.accentBorder} tx={C.accent}/>}
                          {!u.on&&<Badge label="ปิดใช้งาน" bg={C.redLight} bd={C.redBorder} tx={C.red}/>}
                        </div>
                        <div style={{fontSize:10,color:C.textFaint}}>@{u.un} {u.lastLogin?`· เข้าล่าสุด: ${u.lastLogin}`:""}</div>
                        {isMe&&<div style={{fontSize:9,color:C.accentLight,marginTop:2}}>กดไอคอน ✎ บนรูปเพื่อเปลี่ยนรูปโปรไฟล์</div>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 10px"}}>
                          {[["ctrl","ควบคุม"],["cfg","ตั้งค่า"],["users","ผู้ใช้"],["del","ลบ"]].map(([pk,lbl])=>(
                            <div key={pk} style={{display:"flex",alignItems:"center",gap:4}}>
                              <div style={{width:6,height:6,borderRadius:"50%",background:PERMS[u.role][pk]?C.green:C.border}}/>
                              <span style={{fontSize:9,color:PERMS[u.role][pk]?C.green:C.textFaint}}>{lbl}</span>
                            </div>
                          ))}
                        </div>
                        <Badge label={u.role} bg={rm2.bg} bd={rm2.bd} tx={rm2.tx}/>
                        {p.users&&!isMe&&<button onClick={()=>{setUsers(prev=>prev.map(x=>x.id===u.id?{...x,on:!x.on}:x));addLog("AUTH",`${u.on?"ปิด":"เปิด"}ผู้ใช้: ${u.name}`,user.name);}}
                          style={{background:u.on?C.redLight:C.greenLight,border:`1.5px solid ${u.on?C.red:C.green}`,color:u.on?C.red:C.green,borderRadius:8,padding:"5px 14px",fontSize:11,fontWeight:700}}>
                          {u.on?"ปิด":"เปิด"}
                        </button>}
                      </div>
                    </div>
                  </Card>
                ); })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
