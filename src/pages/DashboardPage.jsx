import { C, ST_META, LOG_META, clamp } from "../constants";
import { Card, STitle, KV } from "../components/ui/Card";
import { Gauge, Spark, StatCard } from "../components/ui/Gauge";

export default function DashboardPage({
  sysP,
  sp,
  db,
  pressOk,
  pressLow,
  pressClr,
  pressHist,
  comps,
  runComps,
  totalKw,
  totalFlow,
  energy,
  seqMode,
  kwHist,
  logs,
}) {
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10,marginBottom:18}}>
        <StatCard label="System Pressure" value={sysP.toFixed(3)} unit="bar" clr={pressClr} icon="🌡" sub={pressOk?"✓ Normal":pressLow?"▼ Low":"▲ High"}/>
        <StatCard label="Setpoint" value={sp.toFixed(2)} unit="bar" clr={C.amber} icon="🎯"/>
        <StatCard label="A/C RUNNING" value={`${runComps.length}/${comps.length}`} unit="units" clr={C.accent} icon="⚙"/>
        <StatCard label="SYSTEM POWER" value={totalKw.toFixed(1)} unit="kW" clr="#8B5CF6" icon="⚡" sub={`${energy.toFixed(3)} kWh`}/>
        <StatCard label="FLOW RATE" value={totalFlow.toFixed(2)} unit="m³/min" clr={C.green} icon="💨"/>
        <StatCard label="SYSTEM EFFICIENCY" value={totalFlow>0?(totalKw/totalFlow).toFixed(2):"—"} unit="kW/m³/min" clr={C.amber} icon="📈"/>
        <StatCard label="Seq Mode" value={seqMode} unit={`${comps.filter(c=>c.status==="FAULT").length} fault`} clr={C.accent} icon="🔄"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"200px 1fr 240px",gap:14}}>
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
  );
}
