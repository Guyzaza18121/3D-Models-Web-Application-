import { C, COMP_COLORS, TYPE_ICON, clamp } from "../constants";
import { Card } from "../components/ui/Card";
import SensorModal from "../components/SensorModal";

export default function SensorSystemPage({
  sensors,
  setSensors,
  sensorModal,
  setSensorModal,
  handleSaveSensor,
  permissions,
  flowTotal,
  flowTotalMax,
  sensorNameFallback,
}) {
  return (
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
          <div style={{fontSize:10,color:C.textFaint,marginTop:2}}>Real-time monitoring</div>
        </div>
        {permissions.cfg&&<button onClick={()=>setSensorModal("new")} style={{background:`linear-gradient(135deg,${C.accent},${C.navy})`,border:"none",color:"#fff",borderRadius:10,padding:"9px 20px",fontSize:12,fontWeight:700,boxShadow:C.shadowMd}}>+ เพิ่ม Sensor</button>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14,marginBottom:20}}>
        {sensors.map(s=>{
          const sensorName=s.name?.trim()||sensorNameFallback[s.id]||`${s.type} Sensor`;
          const isFlowMeterOne=s.id==="s3"||sensorName==="Flow Meter 1";
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
                    <div style={{fontSize:12,fontWeight:700,color:C.navy}}>{sensorName}</div>
                    <div style={{fontSize:9,color:C.textFaint}}>{s.type} · {s.location||"—"}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:5,alignItems:"center"}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:warn?C.red:C.green}}/>
                  <span style={{fontSize:9,color:warn?C.red:C.green,fontWeight:600}}>{warn?"⚠ WARN":"● OK"}</span>
                  {permissions.cfg&&<button onClick={()=>setSensorModal(s)} style={{background:C.accentSoft,border:`1px solid ${C.accentBorder}`,color:C.accent,borderRadius:6,padding:"2px 7px",fontSize:9,cursor:"pointer"}}>✏</button>}
                  {permissions.del&&<button onClick={()=>setSensors(prev=>prev.filter(x=>x.id!==s.id))} style={{background:C.redLight,border:`1px solid ${C.redBorder}`,color:C.red,borderRadius:6,padding:"2px 7px",fontSize:9,cursor:"pointer"}}>✕</button>}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:isFlowMeterOne?"1fr 1fr":`repeat(${Math.min(channels.length,3)},1fr)`,gap:8,marginBottom:10}}>
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
                {isFlowMeterOne&&(
                  <div style={{background:C.bg,borderRadius:8,padding:"8px 10px",textAlign:"center",border:`1px solid ${sclr}33`}}>
                    <div style={{fontSize:8,color:C.textFaint,marginBottom:2,letterSpacing:0.5}}>Flow Total</div>
                    <div style={{fontSize:18,fontWeight:800,color:sclr,fontFamily:"monospace",lineHeight:1}}>{flowTotal.toFixed(2)}</div>
                    <div style={{fontSize:8,color:C.textFaint}}>/ {flowTotalMax}</div>
                  </div>
                )}
              </div>
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
    </div>
  );
}
