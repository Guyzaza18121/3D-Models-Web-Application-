import { C, ST_META, clamp } from "../constants";
import { K, VOL } from "../mocks/simulation.service";
import { Card, STitle, Badge, KV } from "../components/ui/Card";

export default function SequencePage({
  permissions,
  user,
  seqMode,
  changeSeq,
  comps,
  sp,
  setSp,
  db,
  setDb,
  demand,
  setDemand,
  pidOut,
  pidI,
  pidD,
  pidKp,
  setPidKp,
  pidKi,
  setPidKi,
  pidKd,
  setPidKd,
  totalFlow,
  runComps,
  sysP,
}) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:14}}>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Card>
          <STitle>Sequence Mode</STitle>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {["AUTO","MANUAL","FIXED"].map(m=> (
              <button key={m} onClick={()=>permissions.cfg&&changeSeq(m)} disabled={!permissions.cfg}
                style={{flex:1,padding:"10px 0",background:seqMode===m?C.accent:C.bg,border:`1.5px solid ${seqMode===m?C.accent:C.border}`,color:seqMode===m?"#fff":C.textSoft,borderRadius:10,fontSize:12,fontWeight:700,opacity:permissions.cfg?1:0.5}}>
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
            const triggerPressures = comps.slice(0,-1).map((_,i)=>sp-db*(1.2+i*0.4));
            const allVals = [sysP, sp+db, sp-db, ...triggerPressures];
            const margin = 2;
            const yMin = Math.max(0, Math.floor(Math.min(...allVals) - margin));
            const yMax = Math.ceil(Math.max(...allVals) + margin);
            const range = yMax - yMin;
            const H = 155, TOP = 8, BOT = TOP+H;
            const toY = v => BOT - ((v-yMin)/range)*H;
            const step = range <= 6 ? 1 : 2;
            const gridVals = [];
            for(let v = Math.ceil(yMin/step)*step; v <= yMax; v+=step) gridVals.push(v);
            return (
              <svg viewBox="0 0 440 175" style={{width:"100%",height:175}}>
                <rect x="36" y={TOP} width="388" height={H} rx="6" fill={C.bg}/>
                {gridVals.map(v=>{ const y=toY(v); return <g key={v}>
                  <line x1="36" y1={y} x2="424" y2={y} stroke={C.border} strokeWidth="1"/>
                  <text x="32" y={y+4} textAnchor="end" fill={C.textFaint} style={{font:"9px monospace"}}>{v}</text>
                </g>;})}
                <text x="10" y={TOP+H/2} textAnchor="middle" fill={C.textFaint}
                  style={{font:"8px monospace"}} transform={`rotate(-90,10,${TOP+H/2})`}>bar</text>
                {(()=>{ const yH=toY(sp+db), yL=toY(sp-db); return <rect x="36" y={yH} width="388" height={yL-yH} fill={C.amber+"28"}/>;})()}
                {(()=>{ const y=toY(sp); return <>
                  <line x1="36" y1={y} x2="424" y2={y} stroke={C.amber} strokeWidth="1.5" strokeDasharray="6,4"/>
                  <text x="428" y={y+4} fill={C.amber} style={{font:"bold 9px monospace"}}>SP</text>
                </>;})()}
                {(()=>{ const yH=toY(sp+db), yL=toY(sp-db); return <>
                  <text x="38" y={yH-2} fill={C.amber} style={{font:"7px monospace"}} opacity="0.7">+{db.toFixed(2)}</text>
                  <text x="38" y={yL+8} fill={C.amber} style={{font:"7px monospace"}} opacity="0.7">-{db.toFixed(2)}</text>
                </>;})()}
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
        <Card style={{border:`1.5px solid ${C.accentBorder}`}}>
          <STitle>PID Controller Status</STitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[
              {l:"Output",v:pidOut,c:pidOut>0?C.green:pidOut<0?C.red:C.textFaint,u:""},
              {l:"I-Term",v:pidI,c:"#8B5CF6",u:""},
              {l:"D-Term",v:pidD,c:C.amber,u:""},
            ].map(x=> (
              <div key={x.l} style={{background:C.bg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                <div style={{fontSize:8,color:C.textFaint,letterSpacing:1,marginBottom:4}}>{x.l}</div>
                <div style={{fontSize:16,fontWeight:800,color:x.c,fontFamily:"monospace"}}>{x.v.toFixed(3)}</div>
              </div>
            ))}
          </div>
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12}}>
            <div style={{fontSize:9,color:C.textSoft,fontWeight:600,letterSpacing:1,marginBottom:10}}>PID TUNING PARAMETERS</div>
            {[
              {l:"Kp (Proportional)",v:pidKp,s:permissions.cfg?setPidKp:null,min:0,max:5,step:0.05,c:"#3B82F6"},
              {l:"Ki (Integral)",    v:pidKi,s:permissions.cfg?setPidKi:null,min:0,max:1,step:0.01,c:"#8B5CF6"},
              {l:"Kd (Derivative)",  v:pidKd,s:permissions.cfg?setPidKd:null,min:0,max:0.5,step:0.005,c:C.amber},
            ].map((it,i)=> (
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
            {l:"Pressure SP",v:sp,s:permissions.cfg?setSp:null,min:3,max:12,step:0.1,u:"bar",c:C.amber},
            {l:"Deadband ±",v:db,s:permissions.cfg?setDb:null,min:0.05,max:1.5,step:0.05,u:"bar",c:C.accent},
            {l:"Base Demand (sim)",v:demand,s:setDemand,min:0.2,max:8,step:0.1,u:"m³/min",c:C.green},
          ].map((it,i)=> (
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
          {!permissions.cfg&&<div style={{background:C.amberLight,border:`1px solid ${C.amberBorder}`,borderRadius:8,padding:"7px 12px",fontSize:10,color:C.amber,fontWeight:600}}>⚠ สิทธิ์ {user.role} ไม่สามารถแก้ไขค่าได้</div>}
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
  );
}
