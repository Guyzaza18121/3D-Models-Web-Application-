import { C } from "../constants";
import { Card, STitle } from "../components/ui/Card";

export default function SettingsPage({
  permissions,
  sp,
  setSp,
  db,
  setDb,
  demand,
  setDemand,
  comps,
  setComps,
}) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <Card>
        <STitle>Pressure Control</STitle>
        {[
          {l:"Setpoint",v:sp,s:setSp,min:3,max:12,step:0.1,u:"bar",c:C.amber,ok:permissions.cfg},
          {l:"Deadband ±",v:db,s:setDb,min:0.05,max:1.5,step:0.05,u:"bar",c:C.accent,ok:permissions.cfg},
          {l:"Base Demand (sim)",v:demand,s:setDemand,min:0.2,max:8,step:0.1,u:"m³/min",c:C.green,ok:true},
        ].map((it,i)=>(
          <div key={i} style={{marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <label style={{fontSize:11,color:C.textSoft,fontWeight:600}}>{it.l}</label>
              <span style={{fontSize:12,fontWeight:800,color:it.c,fontFamily:"monospace"}}>{it.v.toFixed(2)} {it.u}</span>
            </div>
            <input
              type="range"
              min={it.min}
              max={it.max}
              step={it.step}
              value={it.v}
              disabled={!it.ok}
              onChange={e=>it.ok&&it.s(parseFloat(e.target.value))}
              style={{width:"100%",accentColor:it.c,opacity:it.ok?1:0.4}}
            />
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
            {permissions.cfg&&(
              <button
                onClick={()=>setComps(prev=>prev.map((x,j)=>({...x,lead:j===i,seq:j===i?1:(j<i?j+2:j+1)})))}
                style={{background:c.lead?"#FEF9C3":C.bg,border:`1.5px solid ${c.lead?C.amber:C.border}`,color:c.lead?C.amber:C.textSoft,borderRadius:8,padding:"3px 10px",fontSize:10,fontWeight:700,flexShrink:0}}
              >
                {c.lead?"★ LEAD":"Set Lead"}
              </button>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
