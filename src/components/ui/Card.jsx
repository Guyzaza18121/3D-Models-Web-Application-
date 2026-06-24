import { C } from '../../constants';

export const Card = ({ children, style={} }) => (
  <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:18, boxShadow:C.shadow, ...style }}>
    {children}
  </div>
);

export const STitle = ({ children }) => (
  <div style={{ fontSize:10, fontWeight:700, color:C.textSoft, letterSpacing:2, textTransform:"uppercase", marginBottom:14 }}>{children}</div>
);

export const Badge = ({ label, bg, tx, bd }) => (
  <span style={{ background:bg, border:`1px solid ${bd}`, color:tx, fontSize:9, padding:"2px 8px", borderRadius:20, fontWeight:600, whiteSpace:"nowrap" }}>{label}</span>
);

export const KV = ({ label, value, vc=C.accent }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
    <span style={{ fontSize:11, color:C.textSoft }}>{label}</span>
    <span style={{ fontSize:12, fontWeight:700, color:vc, fontFamily:"monospace" }}>{value}</span>
  </div>
);

export const Inp = ({ label, value, onChange, type="text", placeholder="", disabled=false, options=null }) => (
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
