import { useState } from 'react';
import { C, COMP_COLORS } from '../constants';
import { Inp } from './ui/Card';

export default function CompSpecModal({ initial, onSave, onClose, existingCount }) {
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
        <div style={{background:`linear-gradient(135deg,${C.accent},${C.navy})`,borderRadius:"16px 16px 0 0",padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:"#fff",fontSize:14,fontWeight:800}}>{isNew?"เพิ่มปั้มลมใหม่":"แก้ไขข้อมูลปั้มลม"}</div>
            <div style={{color:"#BFDBFE",fontSize:10,marginTop:2}}>กรอกข้อมูลยี่ห้อ รุ่น และสเปค</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        <div style={{padding:24}}>
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
