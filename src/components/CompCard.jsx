import { C, ST_META } from '../constants';
import { Badge } from './ui/Card';
import { Ring } from './ui/Gauge';

export default function CompCard({ c, onToggle, onRemove, onEdit, canCtrl, canDel, canCfg }) {
  const s = ST_META[c.status]||ST_META.STANDBY;
  const kw = c.kw*c.load/100;
  return (
    <div style={{background:C.bgCard,border:`1.5px solid ${s.bd}22`,borderRadius:14,padding:16,boxShadow:C.shadowMd,display:"flex",flexDirection:"column"}}>
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

      <div style={{display:"flex",justifyContent:"space-around",marginBottom:10,padding:"8px 0",background:C.bg,borderRadius:10}}>
        <Ring val={c.press} max={12} clr={c.clr} unit="bar" label="PRESS"/>
        <Ring val={c.temp} max={120} clr={c.temp>85?C.red:C.amber} unit="°C" label="TEMP"/>
        <Ring val={c.curr} max={c.kw*2.2} clr="#8B5CF6" unit="A" label="CURR"/>
        <Ring val={c.load} max={100} clr={c.clr} unit="%" label="LOAD"/>
      </div>

      <div style={{marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:10,color:C.textSoft,fontWeight:600}}>POWER OUTPUT</span>
          <span style={{fontSize:10,color:c.clr,fontWeight:700,fontFamily:"monospace"}}>{kw.toFixed(1)} / {c.kw} kW</span>
        </div>
        <div style={{background:C.border,borderRadius:6,height:6,overflow:"hidden"}}>
          <div style={{width:`${c.load}%`,height:"100%",background:`linear-gradient(90deg,${c.clr}88,${c.clr})`,borderRadius:6,transition:"width .6s"}}/>
        </div>
      </div>

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
