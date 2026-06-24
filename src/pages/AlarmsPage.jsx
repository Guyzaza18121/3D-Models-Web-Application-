import { C, ALARM_META } from "../constants";
import { Card } from "../components/ui/Card";

export default function AlarmsPage({
  alarms,
  aFilter,
  setAFilter,
  aSearch,
  setASearch,
  addLog,
  user,
  ackAlarm,
  ackAllAlarms,
}) {
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{alarms.length} Active Alarms</div>
          <div style={{fontSize:10,color:C.textFaint,marginTop:1}}>
            {alarms.filter(a=>(aFilter==="ALL"||a.level===aFilter)&&(aSearch===""||a.msg.toLowerCase().includes(aSearch.toLowerCase())||a.code.toLowerCase().includes(aSearch.toLowerCase()))).length} รายการ
            {aFilter!=="ALL"&&` (กรอง: ${aFilter})`}
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <input
            value={aSearch}
            onChange={e=>setASearch(e.target.value)}
            placeholder="ค้นหา Alarm..."
            style={{background:C.bg,border:`1.5px solid ${C.accentBorder}`,borderRadius:8,padding:"6px 12px",color:C.text,fontSize:11,outline:"none",width:180}}
          />
          {alarms.length>0&&(
            <button
              onClick={ackAllAlarms}
              style={{background:C.bg,border:`1px solid ${C.border}`,color:C.textSoft,borderRadius:8,padding:"6px 16px",fontSize:11,cursor:"pointer"}}
            >
              ACK All
            </button>
          )}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {Object.entries(ALARM_META).map(([k,m])=>{
          const cnt=alarms.filter(a=>a.level===k).length;
          const active=aFilter===k;
          return (
            <div
              key={k}
              onClick={()=>setAFilter(active?"ALL":k)}
              style={{background:active?m.clr:C.bgCard,border:`1.5px solid ${active?m.clr:m.bd}`,borderRadius:12,padding:"12px 16px",cursor:"pointer",transition:"all .15s",boxShadow:C.shadow}}
            >
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                <span style={{fontSize:18}}>{m.icon}</span>
                <span style={{fontSize:24,fontWeight:800,color:active?"#fff":m.clr,fontFamily:"monospace"}}>{cnt}</span>
              </div>
              <div style={{fontSize:10,fontWeight:700,color:active?"#fff":m.clr,letterSpacing:1}}>{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filter chips */}
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        <button onClick={()=>setAFilter("ALL")}
          style={{background:aFilter==="ALL"?C.navy:C.bg,border:`1.5px solid ${aFilter==="ALL"?C.navy:C.border}`,color:aFilter==="ALL"?"#fff":C.textSoft,borderRadius:20,padding:"5px 14px",fontSize:10,fontWeight:700,cursor:"pointer"}}>
          ทั้งหมด ({alarms.length})
        </button>
        {Object.entries(ALARM_META).map(([k,m])=>{
          const cnt=alarms.filter(a=>a.level===k).length;
          const active=aFilter===k;
          return cnt>0&&(
            <button key={k} onClick={()=>setAFilter(active?"ALL":k)}
              style={{background:active?m.clr:m.bg,border:`1.5px solid ${active?m.clr:m.clr+"44"}`,color:active?"#fff":m.clr,borderRadius:20,padding:"5px 14px",fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
              <span>{m.icon}</span><span>{m.label}</span>
              <span style={{background:active?"rgba(255,255,255,0.25)":m.clr+"22",borderRadius:10,padding:"0 6px",fontSize:9,fontWeight:800}}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* Alarm list */}
      {(()=>{
        const filtered=alarms.filter(a=>(aFilter==="ALL"||a.level===aFilter)&&(aSearch===""||a.msg.toLowerCase().includes(aSearch.toLowerCase())||a.code.toLowerCase().includes(aSearch.toLowerCase())));
        return filtered.length===0?(
          <Card style={{textAlign:"center",padding:60,border:`1.5px solid ${C.greenBorder}`}}>
            <div style={{fontSize:36,marginBottom:10}}>✓</div>
            <div style={{fontSize:15,fontWeight:700,color:C.green}}>{aFilter==="ALL"?"NO ACTIVE ALARMS":`ไม่มี Alarm ประเภท ${aFilter}`}</div>
            <div style={{color:C.textFaint,marginTop:4,fontSize:11}}>ระบบทำงานปกติ</div>
          </Card>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {filtered.map(a=>{
              const m=ALARM_META[a.level]||ALARM_META.WARNING;
              return (
                <div key={a.id} style={{background:m.bg,border:`1.5px solid ${m.bd}`,borderLeft:`4px solid ${m.clr}`,borderRadius:"0 12px 12px 0",padding:"12px 18px",display:"flex",alignItems:"center",gap:14}}>
                  <span style={{fontSize:20,flexShrink:0}}>{m.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:m.clr,marginBottom:3}}>{a.msg}</div>
                    <div style={{display:"flex",gap:10,fontSize:9,color:C.textSoft,flexWrap:"wrap"}}>
                      <span>🕐 {a.time}</span>
                      <span>Code: {a.code}</span>
                      <span style={{background:m.clr+"22",color:m.clr,padding:"0 6px",borderRadius:4,fontWeight:600}}>{m.label}</span>
                    </div>
                  </div>
                  <button
                    onClick={()=>ackAlarm(a._id?.toString()||a.id)}
                    style={{background:"#fff",border:`1px solid ${C.border}`,color:C.textSoft,borderRadius:8,padding:"5px 14px",fontSize:10,cursor:"pointer",fontWeight:600,flexShrink:0}}
                  >
                    ACK
                  </button>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
