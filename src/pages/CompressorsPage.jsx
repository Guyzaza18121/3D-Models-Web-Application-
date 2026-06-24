import { C } from "../constants";
import CompCard from "../components/CompCard";

export default function CompressorsPage({ comps, permissions, onAdd, onToggle, onRemove, onEdit }) {
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontSize:13,color:C.textSoft}}>{comps.length} ปั้มลมในระบบ</div>
        {permissions.cfg&&<button onClick={onAdd} style={{background:`linear-gradient(135deg,${C.accent},${C.navy})`,border:"none",color:"#fff",borderRadius:10,padding:"9px 20px",fontSize:12,fontWeight:700,boxShadow:C.shadowMd}}>+ เพิ่มปั้มลม</button>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {comps.map(c=><CompCard key={c.id} c={c} onToggle={onToggle} onRemove={onRemove} onEdit={onEdit} canCtrl={permissions.ctrl} canDel={permissions.del} canCfg={permissions.cfg}/>)}
      </div>
    </div>
  );
}
