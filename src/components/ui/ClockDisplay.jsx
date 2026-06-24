import { useState, useEffect } from 'react';
import { C } from '../../constants';

export function ClockDisplay() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const iv = setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(iv); },[]);
  const t = now.toLocaleTimeString("en-GB",{hour12:false});
  const d = now.toLocaleDateString("th-TH",{weekday:"short",year:"numeric",month:"short",day:"numeric"});
  return (
    <div style={{ textAlign:"right", lineHeight:1.3 }}>
      <div style={{ fontSize:16, fontWeight:800, color:C.navy, fontFamily:"monospace" }}>{t}</div>
      <div style={{ fontSize:9, color:C.textFaint }}>{d}</div>
    </div>
  );
}
