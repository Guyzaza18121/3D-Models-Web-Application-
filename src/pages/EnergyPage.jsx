import { C } from "../constants";
import { Card, STitle } from "../components/ui/Card";
import { Spark, StatCard } from "../components/ui/Gauge";

export default function EnergyPage({ energy, comps, totalKw, totalFlow, kwHist, flowHist }) {
  const installedKw = comps.reduce((s,c)=>s+c.kw,0);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        <StatCard label="Total Consumed" value={energy.toFixed(4)} unit="kWh" clr="#8B5CF6" icon="⚡"/>
        <StatCard label="Installed" value={`${installedKw}`} unit="kW" clr={C.accent} icon="🔧"/>
        <StatCard label="Utilization" value={`${installedKw>0?(totalKw/installedKw*100).toFixed(1):0}%`} unit="of installed" clr={C.green} icon="📊"/>
        <StatCard label="Spec. Energy" value={totalFlow>0?(totalKw/totalFlow).toFixed(3):"—"} unit="kW/(m³/min)" clr={C.amber} icon="💡"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Card><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><STitle>Power (60s)</STitle><span style={{fontSize:12,fontWeight:700,color:"#8B5CF6",fontFamily:"monospace"}}>{totalKw.toFixed(2)} kW</span></div><Spark data={kwHist} clr="#8B5CF6" h={55}/></Card>
        <Card><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><STitle>Flow (60s)</STitle><span style={{fontSize:12,fontWeight:700,color:C.green,fontFamily:"monospace"}}>{totalFlow.toFixed(3)} m³/min</span></div><Spark data={flowHist} clr={C.green} h={55}/></Card>
      </div>
      <Card>
        <STitle>Per-Unit Breakdown</STitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
          {comps.map(c=>{ const kw=c.kw*c.load/100, pct=totalKw>0?kw/totalKw*100:0; return (
            <div key={c.id} style={{background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:10,padding:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:c.clr,flexShrink:0}}/>
                <span style={{fontSize:12,fontWeight:800,color:C.navy}}>C-{String(c.seq).padStart(2,"0")}</span>
                <span style={{fontSize:10,color:C.textFaint,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.brand} {c.model}</span>
              </div>
              <div style={{fontSize:22,fontWeight:800,color:c.clr,marginBottom:2}}>{kw.toFixed(1)}<span style={{fontSize:11}}>kW</span></div>
              <div style={{fontSize:10,color:C.textSoft,marginBottom:6}}>{pct.toFixed(1)}% of total</div>
              <div style={{background:C.border,borderRadius:4,height:5,marginBottom:6}}>
                <div style={{width:`${pct}%`,height:"100%",background:c.clr,borderRadius:4,transition:"width .5s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.textFaint}}>
                <span>Rated: {c.kw}kW</span><span>Load: {c.load.toFixed(0)}%</span>
              </div>
            </div>
          ); })}
        </div>
      </Card>
    </div>
  );
}
