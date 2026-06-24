import { useState } from 'react';
import { C, ROLE_META } from '../constants';
import { Badge } from './ui/Card';

export default function Login({ users, onLogin }) {
  const [un,setUn]=useState(""), [pw,setPw]=useState(""), [err,setErr]=useState(""), [busy,setBusy]=useState(false);
  const doLogin=async()=>{ setBusy(true); setErr(""); try{ const u=await onLogin(un,pw); if(!u)setErr("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"); }catch{ setErr("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"); }finally{ setBusy(false); } };
  const inp={ width:"100%", background:C.bg, border:`1.5px solid ${C.accentBorder}`, borderRadius:8, padding:"10px 14px", color:C.text, fontSize:13, fontFamily:"monospace", outline:"none", boxSizing:"border-box" };
  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${C.navy},#1E3A8A,#1D4ED8)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 20% 80%,#ffffff08,transparent 50%),radial-gradient(circle at 80% 20%,#60A5FA18,transparent 50%)"}}/>
      <div style={{background:"#fff",borderRadius:20,padding:44,width:400,boxShadow:"0 25px 50px rgba(0,0,0,0.25)",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <img src="/Logo-FOSTEC.png" alt="FOSTEC" style={{width:250,height:100,objectFit:"contain",margin:"0 auto 14px",display:"block"}} />
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
