import { C, clamp } from '../../constants';

export function Gauge({ val, sp, size=160 }) {
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

export function Ring({ val, max, clr, unit, label }) {
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

export function Spark({ data, clr, h=40 }) {
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

export function StatCard({ label, value, unit, clr, icon, sub }) {
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
