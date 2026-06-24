import { C, PERMS, ROLE_META, ROLES } from "../constants";
import { Card, STitle, Badge, Inp } from "../components/ui/Card";

export default function UsersPage({
  users,
  setUsers,
  user,
  setUser,
  permissions,
  showAddUser,
  setShowAddUser,
  newUser,
  setNewUser,
  handleAddUser,
  addLog,
  toggleUser,
}) {
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontSize:13,color:C.textSoft}}>{users.length} ผู้ใช้งาน</div>
        {permissions.users&&(
          <button onClick={()=>setShowAddUser(s=>!s)} style={{background:`linear-gradient(135deg,${C.accent},${C.navy})`,border:"none",color:"#fff",borderRadius:10,padding:"9px 20px",fontSize:12,fontWeight:700,boxShadow:C.shadowMd}}>
            + เพิ่มผู้ใช้งาน
          </button>
        )}
      </div>

      {showAddUser&&(
        <Card style={{marginBottom:14,border:`1.5px solid ${C.accentBorder}`}}>
          <STitle>เพิ่มผู้ใช้งานใหม่</STitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <Inp label="ชื่อแสดง *" value={newUser.name} onChange={v=>setNewUser(p=>({...p,name:v}))} placeholder="ชื่อ-สกุล"/>
            <Inp label="ชื่อผู้ใช้ *" value={newUser.un} onChange={v=>setNewUser(p=>({...p,un:v}))} placeholder="username"/>
            <Inp label="รหัสผ่าน *" value={newUser.pw} onChange={v=>setNewUser(p=>({...p,pw:v}))} placeholder="password" type="password"/>
            <Inp label="สิทธิ์" value={newUser.role} onChange={v=>setNewUser(p=>({...p,role:v}))} options={ROLES}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowAddUser(false)} style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,color:C.textSoft,borderRadius:8,padding:9,fontSize:12}}>ยกเลิก</button>
            <button onClick={handleAddUser} style={{flex:2,background:`linear-gradient(135deg,${C.accent},${C.navy})`,border:"none",color:"#fff",borderRadius:8,padding:9,fontSize:12,fontWeight:700}}>บันทึก</button>
          </div>
        </Card>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {users.map(u=>{
          const rm2=ROLE_META[u.role];
          const isMe=u.id===user?.id;
          return (
            <Card key={u.id} style={{border:`1.5px solid ${u.on?rm2.bd+"44":C.border}`,opacity:u.on?1:0.6,padding:"14px 18px"}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{position:"relative",flexShrink:0}}>
                  <div style={{width:48,height:48,borderRadius:"50%",background:rm2.bg,border:`2px solid ${rm2.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,overflow:"hidden"}}>
                    {u.avatar
                      ? <img src={u.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      : rm2.icon}
                  </div>
                  {isMe&&(
                    <label title="เปลี่ยนรูปโปรไฟล์" style={{position:"absolute",bottom:-2,right:-2,width:18,height:18,borderRadius:"50%",background:C.accent,border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:9,color:"#fff"}}>
                      ✎
                      <input
                        type="file"
                        accept="image/*"
                        style={{display:"none"}}
                        onChange={e=>{
                          const file=e.target.files?.[0];
                          if(!file) return;
                          const reader=new FileReader();
                          reader.onload=ev=>{
                            setUsers(prev=>prev.map(x=>x.id===u.id?{...x,avatar:ev.target.result}:x));
                            if(user?.id===u.id) setUser(prev=>({...prev,avatar:ev.target.result}));
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  )}
                  {!isMe&&permissions.users&&(
                    <label title="เปลี่ยนรูปโปรไฟล์" style={{position:"absolute",bottom:-2,right:-2,width:18,height:18,borderRadius:"50%",background:C.textSoft,border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:9,color:"#fff"}}>
                      ✎
                      <input
                        type="file"
                        accept="image/*"
                        style={{display:"none"}}
                        onChange={e=>{
                          const file=e.target.files?.[0];
                          if(!file) return;
                          const reader=new FileReader();
                          reader.onload=ev=>setUsers(prev=>prev.map(x=>x.id===u.id?{...x,avatar:ev.target.result}:x));
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  )}
                </div>

                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <span style={{fontSize:13,fontWeight:700,color:C.navy}}>{u.name}</span>
                    {isMe&&<Badge label="คุณ" bg={C.accentSoft} bd={C.accentBorder} tx={C.accent}/>}
                    {!u.on&&<Badge label="ปิดใช้งาน" bg={C.redLight} bd={C.redBorder} tx={C.red}/>}
                  </div>
                  <div style={{fontSize:10,color:C.textFaint}}>@{u.un} {u.lastLogin?`· เข้าล่าสุด: ${u.lastLogin}`:""}</div>
                </div>

                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 10px"}}>
                    {[["ctrl","ควบคุม"],["cfg","ตั้งค่า"],["users","ผู้ใช้"],["del","ลบ"]].map(([pk,lbl])=>(
                      <div key={pk} style={{display:"flex",alignItems:"center",gap:4}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:PERMS[u.role][pk]?C.green:C.border}}/>
                        <span style={{fontSize:9,color:PERMS[u.role][pk]?C.green:C.textFaint}}>{lbl}</span>
                      </div>
                    ))}
                  </div>
                  <Badge label={u.role} bg={rm2.bg} bd={rm2.bd} tx={rm2.tx}/>
                  {permissions.users&&!isMe&&(
                    <button
                      onClick={()=>toggleUser(u._id?.toString()||u.id)}
                      style={{background:u.on?C.redLight:C.greenLight,border:`1.5px solid ${u.on?C.red:C.green}`,color:u.on?C.red:C.green,borderRadius:8,padding:"5px 14px",fontSize:11,fontWeight:700}}
                    >
                      {u.on?"ปิด":"เปิด"}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
