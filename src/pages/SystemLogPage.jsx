import { C, LOG_META } from "../constants";
import { Card, STitle } from "../components/ui/Card";

export default function SystemLogPage({
  logs,
  clearLogs,
  filteredLogs,
  logFilter,
  setLogFilter,
  logSearch,
  setLogSearch,
}) {
  return (
    <Card>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div>
          <STitle>System Event Log</STitle>
          <div style={{fontSize:10,color:C.textFaint,marginTop:-10}}>{filteredLogs.length} รายการ {logFilter!=="ALL"&&`(กรอง: ${logFilter})`}</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input value={logSearch} onChange={e=>setLogSearch(e.target.value)} placeholder="ค้นหา..."
            style={{background:C.bg,border:`1.5px solid ${C.accentBorder}`,borderRadius:8,padding:"6px 12px",color:C.text,fontSize:11,outline:"none",width:180}}/>
          <button onClick={clearLogs} style={{background:C.bg,border:`1px solid ${C.border}`,color:C.textSoft,borderRadius:8,padding:"6px 14px",fontSize:11}}>Clear</button>
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        <button onClick={()=>setLogFilter("ALL")}
          style={{background:logFilter==="ALL"?C.navy:C.bg, border:`1.5px solid ${logFilter==="ALL"?C.navy:C.border}`, color:logFilter==="ALL"?"#fff":C.textSoft, borderRadius:20, padding:"5px 14px", fontSize:10, fontWeight:700, transition:"all .15s"}}>
          ทั้งหมด {logs.length>0&&`(${logs.length})`}
        </button>
        {Object.entries(LOG_META).map(([k,m])=>{
          const cnt=logs.filter(l=>l.type===k).length;
          const active=logFilter===k;
          return (
            <button key={k} onClick={()=>setLogFilter(active?"ALL":k)}
              style={{background:active?m.clr:m.bg, border:`1.5px solid ${active?m.clr:m.clr+"44"}`, color:active?"#fff":m.clr, borderRadius:20, padding:"5px 14px", fontSize:10, fontWeight:700, transition:"all .15s", display:"flex",alignItems:"center",gap:5}}>
              <span>{m.icon}</span>
              <span>{m.label}</span>
              {cnt>0&&<span style={{background:active?"rgba(255,255,255,0.25)":m.clr+"22",borderRadius:10,padding:"0 6px",fontSize:9,fontWeight:800}}>{cnt}</span>}
            </button>
          );
        })}
      </div>
      <div style={{maxHeight:460,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
        {filteredLogs.length===0&&(
          <div style={{color:C.textFaint,textAlign:"center",padding:40,fontSize:13}}>
            {logFilter!=="ALL"?`ไม่มีรายการประเภท ${LOG_META[logFilter]?.label}`:"ไม่มีรายการ"}
          </div>
        )}
        {filteredLogs.map(l=>{ const m=LOG_META[l.type]||LOG_META.SYS; return (
          <div key={l.id} style={{background:m.bg,border:`1px solid ${m.clr}22`,borderLeft:`3px solid ${m.clr}`,borderRadius:"0 8px 8px 0",padding:"8px 14px",display:"flex",gap:10}}>
            <span style={{fontSize:14,flexShrink:0}}>{m.icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,color:C.textMid,marginBottom:2,lineHeight:1.4}}>{l.msg}</div>
              <div style={{display:"flex",gap:10,fontSize:9,color:C.textFaint,flexWrap:"wrap"}}>
                <span>🕐 {l.time}</span>
                <span>👤 {l.who}</span>
                <span style={{background:m.clr+"22",color:m.clr,padding:"0 6px",borderRadius:4,fontWeight:600}}>{m.label}</span>
              </div>
            </div>
          </div>
        ); })}
      </div>
    </Card>
  );
}
