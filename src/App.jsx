import { useState, useEffect, useRef } from "react";
import { C, NAV, PERMS, ROLE_META, clamp, PID_KP, PID_KI, PID_KD } from "./constants";
import { INIT_USERS, INIT_COMPS, INIT_SENSORS, INIT_AIR_DRYER, uid } from "./mocks";
import { compressorsApi, sensorsApi, alarmsApi, logsApi, airDryerApi, settingsApi, authApi, IS_SIM } from "./api";
import { IS_MQTT } from "./api/mqtt.client";
import { useLogs } from "./hooks/useLogs";
import { useAlarms } from "./hooks/useAlarms";
import { useSimulation } from "./hooks/useSimulation";
import { useNodeRedTelemetry } from "./hooks/useNodeRedTelemetry";
import { ClockDisplay } from "./components/ui/ClockDisplay";
import { Factory, LayoutDashboard, Settings2, Wind, Radio, ArrowLeftRight, Zap, ScrollText, Bell, SlidersHorizontal, Users } from 'lucide-react';
import Login from "./components/Login";
import CompSpecModal from "./components/CompSpecModal";
import OverviewPage from "./pages/OverviewPage";
import AirDryerPage from "./pages/AirDryerPage";
import DashboardPage from "./pages/DashboardPage";
import CompressorsPage from "./pages/CompressorsPage";
import SensorSystemPage from "./pages/SensorSystemPage";
import SequencePage from "./pages/SequencePage";
import EnergyPage from "./pages/EnergyPage";
import SystemLogPage from "./pages/SystemLogPage";
import AlarmsPage from "./pages/AlarmsPage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";

const FLOW_TOTAL_MAX = 12000;

export default function App() {
  const SENSOR_NAME_FALLBACK = {
    s1: "Pressure Sensor 1",
    s2: "Pressure Sensor 2",
    s3: "Flow Meter 1",
    s4: "Temp Sensor 1",
    s5: "Dew Point 1",
  };
  const [users, setUsers] = useState(()=>INIT_USERS.map(u=>({...u,avatar:null})));
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("OVERVIEW");
  const [collapsed, setCollapsed] = useState(false);
  const [comps, setComps] = useState(INIT_COMPS);
  const [sp, setSp] = useState(7.0);
  const [db, setDb] = useState(0.3);
  const [demand, setDemand] = useState(1.8);
  const [seqMode, setSeqMode] = useState("AUTO");
  const [sysP, setSysP] = useState(5.5);
  const [simOn, setSimOn] = useState(IS_SIM);
  const [pressHist, setPressHist] = useState(()=>Array(60).fill(5.5));
  const [kwHist, setKwHist] = useState(()=>Array(60).fill(0));
  const [flowHist, setFlowHist] = useState(()=>Array(60).fill(0));
  const [flowTotal, setFlowTotal] = useState(0);
  const [energy, setEnergy] = useState(0);
  // TODO: [BACKEND] logs + alarms fetched from MongoDB on mount via logsApi / alarmsApi
  const { logs, setLogs, addLog, logFilter, setLogFilter, logSearch, setLogSearch, filteredLogs } = useLogs();
  const [pidOut, setPidOut] = useState(0);
  const [pidI, setPidI] = useState(0);
  const [pidD, setPidD] = useState(0);
  const [pidKp, setPidKp] = useState(PID_KP);
  const [pidKi, setPidKi] = useState(PID_KI);
  const [pidKd, setPidKd] = useState(PID_KD);
  const [sensors, setSensors] = useState(INIT_SENSORS);
  const [airDryer, setAirDryer] = useState(INIT_AIR_DRYER);
  const [compModal, setCompModal] = useState(null);
  const [sensorModal, setSensorModal] = useState(null);
  const { alarms, setAlarms, addAlarm, aFilter, setAFilter, aSearch, setASearch } = useAlarms({ addLog });
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({un:"",pw:"",name:"",role:"OPERATOR"});

  const spRef = useRef(sp); useEffect(()=>{spRef.current=sp;},[sp]);
  const dbRef = useRef(db); useEffect(()=>{dbRef.current=db;},[db]);
  const demRef = useRef(demand); useEffect(()=>{demRef.current=demand;},[demand]);
  const seqRef = useRef(seqMode); useEffect(()=>{seqRef.current=seqMode;},[seqMode]);
  const pidKpRef = useRef(PID_KP); useEffect(()=>{pidKpRef.current=pidKp;},[pidKp]);
  const pidKiRef = useRef(PID_KI); useEffect(()=>{pidKiRef.current=pidKi;},[pidKi]);
  const pidKdRef = useRef(PID_KD); useEffect(()=>{pidKdRef.current=pidKd;},[pidKd]);

  // Load all resources from MongoDB when user logs in (has token)
  useEffect(()=>{
    if(IS_SIM||!user)return;
    Promise.all([
      compressorsApi.getAll(),
      sensorsApi.getAll().catch(()=>[]),
      airDryerApi.getAll().catch(()=>[]),
      settingsApi.get().catch(()=>null),
      authApi.getUsers().catch(()=>[]),
    ]).then(([cs,ss,ads,cfg,us])=>{
        if(cs?.length)setComps(cs);
        if(ss?.length)setSensors(ss.map(s=>({...s,id:s._id?.toString()??s.id})));
        if(ads?.[0])setAirDryer({...ads[0],id:ads[0]._id?.toString()??ads[0].id});
        if(cfg){
          if(cfg.sp!=null)setSp(cfg.sp);
          if(cfg.db!=null)setDb(cfg.db);
          if(cfg.demand!=null)setDemand(cfg.demand);
          if(cfg.seqMode)setSeqMode(cfg.seqMode);
          if(cfg.pidKp!=null)setPidKp(cfg.pidKp);
          if(cfg.pidKi!=null)setPidKi(cfg.pidKi);
          if(cfg.pidKd!=null)setPidKd(cfg.pidKd);
        }
        if(us?.length)setUsers(us.map(u=>({...u,id:u._id?.toString()??u.id})));
      }).catch(console.error);
  },[user]);

  // Persist settings changes to DB (debounced 800ms)
  useEffect(()=>{
    if(IS_SIM)return;
    const t=setTimeout(()=>settingsApi.patch({sp,db,demand,seqMode,pidKp,pidKi,pidKd}).catch(console.error),800);
    return()=>clearTimeout(t);
  },[sp,db,demand,seqMode,pidKp,pidKi,pidKd]);


  // ── Telemetry ───────────────────────────────────────────────────────────────
  const { tickRef } = useSimulation({
    simOn, spRef, dbRef, demRef, seqRef,
    pidKpRef, pidKiRef, pidKdRef,
    setComps, setSensors, setAirDryer,
    setSysP, setPressHist, setKwHist, setFlowHist, setFlowTotal, setEnergy,
    setPidOut, setPidI, setPidD,
    addLog, addAlarm,
  });

  useNodeRedTelemetry({
    setComps, setSensors, setAirDryer,
    setSysP, setPressHist, setKwHist, setFlowHist, setFlowTotal, setEnergy,
    addLog, addAlarm,
  });

  // ── handlers ────────────────────────────────────────────────────────────────
  const p=user?PERMS[user.role]:{};
  const handleLogin=async(un,pw)=>{
    try{
      const data=await authApi.login(un,pw);
      if(!data)return null;
      const u={...(data.user||data),id:((data.user||data)._id?.toString())||(data.user||data).id};
      setUser(u);
      addLog("AUTH",`เข้าสู่ระบบ: ${u.name} (${u.role})`,u.name);
      return u;
    }catch{return null;}
  };
  const handleLogout=()=>{addLog("AUTH",`ออกจากระบบ: ${user.name}`,user.name);if(!IS_SIM)authApi.logout().catch(()=>{});setUser(null);};
  const toggleComp=async id=>{
    const c=comps.find(x=>x.id===id||x._id?.toString()===id);
    if(!c)return;
    const nx=c.status==="RUNNING"?"STANDBY":"RUNNING";
    addLog("CTRL",`[MANUAL] ${nx==="RUNNING"?"START":"STOP"} C-${String(c.seq).padStart(2,"0")} ${c.brand} ${c.model}`,user.name);
    if(!IS_SIM)await compressorsApi.control(c._id?.toString()||c.id,nx==="RUNNING"?"START":"STOP").catch(console.error);
    setComps(prev=>prev.map(x=>{
      if(x.id!==id&&x._id?.toString()!==id)return x;
      return{...x,status:nx,load:nx==="STANDBY"?0:x.load,curr:nx==="STANDBY"?0:x.curr};
    }));
  };
  const toggleAirDryer=async()=>{ const nx=airDryer.status==="RUNNING"?"STANDBY":"RUNNING"; addLog("CTRL",`[MANUAL] ${nx==="RUNNING"?"START":"STOP"} ${airDryer.name}`,user.name); if(!IS_SIM)await airDryerApi.control(airDryer._id?.toString()||airDryer.id,nx==="RUNNING"?"START":"STOP").catch(console.error); setAirDryer(prev=>({...prev,status:nx,temp:nx==="STANDBY"?prev.temp:32})); };
  const removeComp=async id=>{
    const c=comps.find(x=>x.id===id||x._id?.toString()===id);
    if(!c)return;
    if(!IS_SIM)await compressorsApi.remove(c._id?.toString()||c.id).catch(console.error);
    addLog("CFG",`ลบปั้มลม: ${c.brand} ${c.model}`,user.name);
    setComps(prev=>prev.filter(x=>x.id!==id&&x._id?.toString()!==id).map((x,i)=>({...x,seq:i+1,lead:i===0})));
  };

  const handleSaveComp=async(spec)=>{
    if(compModal==="new"){
      if(IS_SIM){const nc=mkComp(spec,comps.length);setComps(prev=>[...prev,nc]);}
      else{const nc=await compressorsApi.create(spec).catch(e=>{console.error(e);return null;});if(nc)setComps(prev=>[...prev,nc]);}
      addLog("CFG",`เพิ่มปั้มลม: ${spec.brand} ${spec.model} ${spec.kw}kW`,user.name);
    } else {
      const cid=compModal._id?.toString()||compModal.id;
      if(IS_SIM){setComps(prev=>prev.map(c=>c.id===cid?{...c,...spec,name:spec.name||spec.model}:c));}
      else{const u=await compressorsApi.update(cid,spec).catch(e=>{console.error(e);return null;});if(u)setComps(prev=>prev.map(c=>(c._id?.toString()||c.id)===cid?u:c));}
      addLog("CFG",`แก้ไขสเปค: ${spec.brand} ${spec.model}`,user.name);
    }
    setCompModal(null);
  };

  const changeSeq=m=>{ addLog("CFG",`Sequence: ${seqMode} → ${m}`,user.name); setSeqMode(m); if(!IS_SIM)settingsApi.patch({seqMode:m}).catch(console.error); };

  const handleSaveSensor=async(spec)=>{
    if(sensorModal==="new"){
      if(IS_SIM){setSensors(prev=>[...prev,{id:uid(),...spec,value:parseFloat(spec.min)||0}]);}
      else{const s=await sensorsApi.create(spec).catch(e=>{console.error(e);return null;});if(s)setSensors(prev=>[...prev,{...s,id:s._id?.toString()??s.id}]);}
      addLog("CFG",`เพิ่ม Sensor: ${spec.name} (${spec.type})`,user.name);
    } else {
      const sid=sensorModal._id?.toString()||sensorModal.id;
      if(IS_SIM){setSensors(prev=>prev.map(s=>s.id===sid?{...s,...spec}:s));}
      else{const u=await sensorsApi.update(sid,spec).catch(e=>{console.error(e);return null;});if(u)setSensors(prev=>prev.map(s=>(s._id?.toString()||s.id)===sid?{...u,id:u._id?.toString()??u.id}:s));}
      addLog("CFG",`แก้ไข Sensor: ${spec.name}`,user.name);
    }
    setSensorModal(null);
  };
  const handleAddUser=async()=>{ if(!newUser.un||!newUser.pw||!newUser.name)return; if(users.find(u=>u.un===newUser.un))return; if(IS_SIM){setUsers(prev=>[...prev,{id:uid(),...newUser,on:true}]);}else{const created=await authApi.createUser(newUser).catch(e=>{console.error(e);return null;});if(!created)return;setUsers(prev=>[...prev,{...created,id:created._id?.toString()??created.id}]);} addLog("AUTH",`เพิ่มผู้ใช้: ${newUser.name}`,user.name); setNewUser({un:"",pw:"",name:"",role:"OPERATOR"}); setShowAddUser(false); };

  const ackAlarm=async id=>{ if(!IS_SIM)await alarmsApi.ack(id,user.name).catch(console.error); setAlarms(prev=>prev.filter(x=>(x.id||x._id?.toString())!==id)); addLog("ALARM",`ACK alarm`,user.name); };
  const ackAllAlarms=async()=>{ addLog("ALARM",`ACK ALL (${alarms.length})`,user.name); if(!IS_SIM)await Promise.all(alarms.map(a=>alarmsApi.ack(a._id?.toString()||a.id,user.name).catch(()=>{}))).catch(()=>{}); setAlarms([]); };
  const clearLogs=async()=>{ if(!IS_SIM)await logsApi.clear().catch(console.error); setLogs([]); };
  const toggleUser=async id=>{ const tu=users.find(x=>(x.id||x._id?.toString())===id); if(!tu)return; const newOn=!tu.on; if(!IS_SIM)await authApi.updateUser(id,{on:newOn}).catch(console.error); setUsers(prev=>prev.map(x=>(x.id||x._id?.toString())===id?{...x,on:newOn}:x)); addLog("AUTH",`${newOn?"เปิด":"ปิด"}ผู้ใช้: ${tu.name}`,user?.name||"SYSTEM"); };

  const runComps=comps.filter(c=>c.status==="RUNNING");
  const totalKw=runComps.reduce((s,c)=>s+c.kw*c.load/100,0);
  const actualDemand = clamp(demand + Math.sin((tickRef?.current ?? 0) * 0.07) * 0.5, 0.1, 20);
  const totalFlow=actualDemand;
  const pressOk=sysP>=sp-db&&sysP<=sp+db;
  const pressLow=sysP<sp-db;
  const pressClr=pressLow?C.red:pressOk?C.green:C.amber;


  if(!user) return <Login users={users} onLogin={handleLogin}/>;

  const rm=ROLE_META[user.role];
  const SIDEBAR_W=collapsed?64:220;

  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.bg,fontFamily:"system-ui,sans-serif",color:C.text}}>
      <style>{`
        @keyframes pulse{0%,100%{box-shadow:0 0 0 3px #16A34A33}50%{box-shadow:0 0 0 5px #16A34A11}}
        *{box-sizing:border-box} button{cursor:pointer;transition:all .15s} button:hover{filter:brightness(0.93)}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:${C.bg}} ::-webkit-scrollbar-thumb{background:${C.accentBorder};border-radius:4px}
        input:focus,select:focus,textarea:focus{border-color:${C.accent}!important;outline:none}
      `}</style>

      {compModal&&<CompSpecModal initial={compModal==="new"?null:compModal} onSave={handleSaveComp} onClose={()=>setCompModal(null)} existingCount={comps.length}/>}

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <div style={{width:SIDEBAR_W,minHeight:"100vh",background:C.bgSidebar,display:"flex",flexDirection:"column",transition:"width .25s ease",overflow:"hidden",flexShrink:0,boxShadow:"2px 0 12px rgba(0,0,0,0.15)"}}>
        <div style={{padding:"10px 10px 8px",borderBottom:"1px solid #00000010",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <button onClick={()=>setCollapsed(s=>!s)} title={collapsed?"ขยาย sidebar":"พับ sidebar"}
            style={{width:36,height:36,borderRadius:9,background:"rgba(0,0,0,0.05)",border:"1px solid rgba(0,0,0,0.1)",color:C.navy,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer",transition:"background .15s"}}>
            {collapsed?"›":"‹"}
          </button>
          {!collapsed&&(
            <img src="/Logo-FOSTEC.png" alt="FOSTEC" style={{height:80,maxWidth:140,objectFit:"contain",flexShrink:0}} />
          )}
        </div>

        <nav style={{flex:1,padding:"10px 8px",overflowY:"auto",display:"flex",flexDirection:"column"}}>
          <div style={{flex:1}}>
            {NAV.filter(n=>n.id!=="SETTINGS"&&n.id!=="USERS").map(n=>{
              const active=tab===n.id, hasAlert=n.id==="ALARMS"&&alarms.length>0;
              return (
                <div key={n.id} onClick={()=>setTab(n.id)} title={collapsed?n.label:""}
                  style={{display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px 0":"10px 12px",borderRadius:10,marginBottom:4,cursor:"pointer",justifyContent:collapsed?"center":"flex-start",background:active?"rgba(59,130,246,0.25)":"transparent",borderLeft:active?"3px solid #3B82F6":"3px solid transparent",transition:"all .15s",position:"relative"}}>
                  {n.id==="OVERVIEW"&&<Factory size={18} color={C.navy} style={{flexShrink:0,opacity:active?1:0.6}} />}
                  {n.id==="DASHBOARD"&&<LayoutDashboard size={18} color={C.navy} style={{flexShrink:0,opacity:active?1:0.6}} />}
                  {n.id==="COMPRESSORS"&&<Settings2 size={18} color={C.navy} style={{flexShrink:0,opacity:active?1:0.6}} />}
                  {n.id==="AIR_DRYER"&&<Wind size={18} color={C.navy} style={{flexShrink:0,opacity:active?1:0.6}} />}
                  {n.id==="SENSORS"&&<Radio size={18} color={C.navy} style={{flexShrink:0,opacity:active?1:0.6}} />}
                  {n.id==="SEQUENCE"&&<ArrowLeftRight size={18} color={C.navy} style={{flexShrink:0,opacity:active?1:0.6}} />}
                  {n.id==="ENERGY"&&<Zap size={18} color={C.navy} style={{flexShrink:0,opacity:active?1:0.6}} />}
                  {n.id==="LOG"&&<ScrollText size={18} color={C.navy} style={{flexShrink:0,opacity:active?1:0.6}} />}
                  {n.id==="ALARMS"&&<Bell size={18} color={C.navy} style={{flexShrink:0,opacity:active?1:0.6}} />}
                  {!collapsed&&<span style={{fontSize:12,fontWeight:active?700:500,color:active?"#fff":C.text}}>{n.label}</span>}
                  {hasAlert&&<span style={{position:"absolute",top:6,right:collapsed?6:10,background:C.red,color:"#fff",borderRadius:"50%",width:14,height:14,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{alarms.length}</span>}
                </div>
              );
            })}
          </div>
          <div style={{borderTop:"1px solid #00000010",paddingTop:8,marginTop:8}}>
            {NAV.filter(n=>n.id==="SETTINGS"||n.id==="USERS").map(n=>{
              const active=tab===n.id;
              return (
                <div key={n.id} onClick={()=>setTab(n.id)} title={collapsed?n.label:""}
                  style={{display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px 0":"10px 12px",borderRadius:10,marginBottom:4,cursor:"pointer",justifyContent:collapsed?"center":"flex-start",background:active?"rgba(59,130,246,0.25)":"transparent",borderLeft:active?"3px solid #3B82F6":"3px solid transparent",transition:"all .15s",position:"relative"}}>
                  {n.id==="SETTINGS"&&<SlidersHorizontal size={18} color={C.navy} style={{flexShrink:0,opacity:active?1:0.6}} />}
                  {n.id==="USERS"&&<Users size={18} color={C.navy} style={{flexShrink:0,opacity:active?1:0.6}} />}
                  {!collapsed&&<span style={{fontSize:12,fontWeight:active?700:500,color:active?"#fff":C.text}}>{n.label}</span>}
                </div>
              );
            })}
          </div>
        </nav>

        <div style={{padding:collapsed?"10px 0":"10px 14px",borderTop:"1px solid #00000010"}}>
          {!collapsed?(
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:10,color:C.navy,fontWeight:600}}>SIMULATION</span>
              <div onClick={()=>setSimOn(s=>!s)} style={{width:36,height:20,borderRadius:10,background:simOn?"#3B82F6":"#374151",cursor:"pointer",position:"relative",transition:"background .3s"}}>
                <div style={{position:"absolute",top:3,left:simOn?18:3,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left .3s"}}/>
              </div>
            </div>
          ):(
            <div onClick={()=>setSimOn(s=>!s)} style={{display:"flex",justifyContent:"center",cursor:"pointer"}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:simOn?"#4ADE80":"#6B7280"}}/>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN ─────────────────────────────────────────────────────────────── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>

        {/* TOP BAR */}
        <div style={{background:C.bgCard,borderBottom:`1px solid ${C.border}`,padding:"0 20px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:C.shadow}}>
          <div>
            <h1 style={{fontSize:16,fontWeight:800,color:C.navy,margin:0}}>FOSTEC</h1>
            <div style={{fontSize:9,color:C.textFaint,marginTop:1}}>FOSTEC Compressed air management system</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:6,background:C.bg,border:`1px solid ${C.border}`,borderRadius:20,padding:"5px 14px"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:pressClr,boxShadow:`0 0 0 3px ${pressClr}33`}}/>
              <span style={{fontSize:12,fontWeight:700,color:pressClr,fontFamily:"monospace"}}>{sysP.toFixed(3)} bar</span>
              <span style={{fontSize:10,color:C.textFaint}}>/ SP {sp.toFixed(2)}</span>
            </div>
            <div style={{background:C.accentSoft,border:`1px solid ${C.accentBorder}`,borderRadius:20,padding:"5px 12px",fontSize:11,color:C.accent,fontWeight:700}}>
              {runComps.length}/{comps.length} Running
            </div>
            <div style={{background:seqMode==="AUTO"?C.greenLight:C.amberLight,border:`1px solid ${seqMode==="AUTO"?C.greenBorder:C.amberBorder}`,borderRadius:20,padding:"5px 12px",fontSize:11,color:seqMode==="AUTO"?C.green:C.amber,fontWeight:700}}>
              {seqMode}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <ClockDisplay/>
            <div style={{width:1,height:36,background:C.border}}/>
            <div style={{display:"flex",alignItems:"center",gap:10,background:rm.bg,border:`1.5px solid ${rm.bd}`,borderRadius:10,padding:"7px 14px"}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:C.bgCard,border:`2px solid ${rm.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,overflow:"hidden"}}>
                {user.avatar?<img src={user.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:rm.icon}
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:rm.tx}}>{user.name}</div>
                <div style={{fontSize:8,color:rm.bd,letterSpacing:1,fontWeight:600}}>{user.role}</div>
              </div>
              <button onClick={handleLogout} title="ออกจากระบบ"
                style={{background:C.redLight,border:`1.5px solid ${C.redBorder}`,color:C.red,borderRadius:8,padding:"4px 10px",fontSize:10,fontWeight:700,marginLeft:4}}>
                ออก
              </button>
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={{flex:1,overflowY:"auto",padding:tab==="OVERVIEW"?0:20}}>
          {/* OVERVIEW */}
          {tab==="OVERVIEW"&&(
            <OverviewPage
              comps={comps}
              sensors={sensors}
              flowTotal={flowTotal}
              flowTotalMax={FLOW_TOTAL_MAX}
              logs={logs}
              alarms={alarms}
              sysP={sysP}
              sp={sp}
              db={db}
              pressOk={pressOk}
              pressLow={pressLow}
              pressClr={pressClr}
              runComps={runComps}
              totalKw={totalKw}
              totalFlow={totalFlow}
              energy={energy}
              seqMode={seqMode}
            />
          )}

          {/* DASHBOARD */}
          {tab==="DASHBOARD"&&(
            <DashboardPage
              sysP={sysP}
              sp={sp}
              db={db}
              pressOk={pressOk}
              pressLow={pressLow}
              pressClr={pressClr}
              pressHist={pressHist}
              comps={comps}
              runComps={runComps}
              totalKw={totalKw}
              totalFlow={totalFlow}
              energy={energy}
              seqMode={seqMode}
              kwHist={kwHist}
              logs={logs}
            />
          )}

          {/* COMPRESSORS */}
          {tab==="COMPRESSORS"&&(
            <CompressorsPage
              comps={comps}
              permissions={p}
              onAdd={()=>setCompModal("new")}
              onToggle={toggleComp}
              onRemove={removeComp}
              onEdit={c=>setCompModal(c)}
            />
          )}

          {/* AIR DRYER */}
          {tab==="AIR_DRYER"&&(
            <AirDryerPage
              airDryer={airDryer}
              toggleAirDryer={toggleAirDryer}
              permissions={p}
            />
          )}

          {/* SENSORS */}
          {tab==="SENSORS"&&(
            <SensorSystemPage
              sensors={sensors}
              setSensors={setSensors}
              sensorModal={sensorModal}
              setSensorModal={setSensorModal}
              handleSaveSensor={handleSaveSensor}
              permissions={p}
              flowTotal={flowTotal}
              flowTotalMax={FLOW_TOTAL_MAX}
              sensorNameFallback={SENSOR_NAME_FALLBACK}
            />
          )}

          {/* SEQUENCE */}
          {tab==="SEQUENCE"&&(
            <SequencePage
              permissions={p}
              user={user}
              seqMode={seqMode}
              changeSeq={changeSeq}
              comps={comps}
              sp={sp}
              setSp={setSp}
              db={db}
              setDb={setDb}
              demand={demand}
              setDemand={setDemand}
              pidOut={pidOut}
              pidI={pidI}
              pidD={pidD}
              pidKp={pidKp}
              setPidKp={setPidKp}
              pidKi={pidKi}
              setPidKi={setPidKi}
              pidKd={pidKd}
              setPidKd={setPidKd}
              totalFlow={totalFlow}
              runComps={runComps}
              sysP={sysP}
            />
          )}

          {/* ENERGY */}
          {tab==="ENERGY"&&(
            <EnergyPage
              energy={energy}
              comps={comps}
              totalKw={totalKw}
              totalFlow={totalFlow}
              kwHist={kwHist}
              flowHist={flowHist}
            />
          )}

          {/* SYSTEM LOG */}
          {tab==="LOG"&&(
            <SystemLogPage
              logs={logs}
              clearLogs={clearLogs}
              filteredLogs={filteredLogs}
              logFilter={logFilter}
              setLogFilter={setLogFilter}
              logSearch={logSearch}
              setLogSearch={setLogSearch}
            />
          )}

          {/* ALARMS */}
          {tab==="ALARMS"&&(
            <AlarmsPage
              alarms={alarms}
              aFilter={aFilter}
              setAFilter={setAFilter}
              aSearch={aSearch}
              setASearch={setASearch}
              addLog={addLog}
              user={user}
              ackAlarm={ackAlarm}
              ackAllAlarms={ackAllAlarms}
            />
          )}

          {/* SETTINGS */}
          {tab==="SETTINGS"&&(
            <SettingsPage
              permissions={p}
              sp={sp}
              setSp={setSp}
              db={db}
              setDb={setDb}
              demand={demand}
              setDemand={setDemand}
              comps={comps}
              setComps={setComps}
            />
          )}

          {/* USERS */}
          {tab==="USERS"&&(
            <UsersPage
              users={users}
              setUsers={setUsers}
              user={user}
              setUser={setUser}
              permissions={p}
              showAddUser={showAddUser}
              setShowAddUser={setShowAddUser}
              newUser={newUser}
              setNewUser={setNewUser}
              handleAddUser={handleAddUser}
              addLog={addLog}
              toggleUser={toggleUser}
            />
          )}

        </div>
      </div>
    </div>
  );
}
