import { useState } from 'react';
import { C, COMP_COLORS, SENSOR_TYPES, SENSOR_UNITS } from '../constants';
import { uid } from '../mocks';
import { Inp } from './ui/Card';

export default function SensorModal({ initial, onSave, onClose, sensorCount }) {
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
          <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:10,padding:14,marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:C.green,letterSpacing:1,marginBottom:10}}>ช่วงค่าและการแจ้งเตือน</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
              <Inp label="Min" value={f.min} onChange={v=>set("min",v)} type="number"/>
              <Inp label="Max" value={f.max} onChange={v=>set("max",v)} type="number"/>
              <Inp label="⚠ Warn Lo" value={f.warnLo} onChange={v=>set("warnLo",v)} type="number"/>
              <Inp label="⚠ Warn Hi" value={f.warnHi} onChange={v=>set("warnHi",v)} type="number"/>
            </div>
          </div>
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
