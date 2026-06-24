import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Center, ContactShadows, Html } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import { C, ST_META, ALARM_META } from '../constants';
import {
  AC_CUBE_MAP,
  TANK_A_TARGET,
  TANK_B_TARGET,
  FLOW_TARGET,
  BBOX_PANEL_TARGETS,
  TRACKED_CUBES,
  MESH_NAME_MAP,
  PANEL_KEY_MAP,
  getPanelKeyFromName,
} from '../constants/3d-objects';
import { Card, STitle } from '../components/ui/Card';
import { StatCard } from '../components/ui/Gauge';

const DEFAULT_LOCK_VIEW = {
  pos: [-6.27, 14.7, -18.03],
  target: [-4.69, -0.59, 0.07],
};
const LOCK_VIEW_STORAGE_KEY = 'fostec-overview-lock-view-v2';

function Model({ onMeshClick, onCubePositions }) {
  const { scene } = useGLTF('/try2.glb');
  const panelBoxRef = useRef(new Box3());
  const panelCenterRef = useRef(new Vector3());

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.cursor = 'pointer';
      }
    });
  }, [scene]);

  useFrame(() => {
    const positions = {};
    scene.traverse((child) => {
      if (TRACKED_CUBES.has(child.name)) {
        if (BBOX_PANEL_TARGETS.has(child.name)) {
          const box = panelBoxRef.current.setFromObject(child);
          const center = box.getCenter(panelCenterRef.current);
          positions[child.name] = [center.x, box.max.y + 0.7, center.z];
        } else {
          const wp = child.getWorldPosition(child.position.clone());
          positions[child.name] = [wp.x, wp.y, wp.z];
        }
      }
    });
    onCubePositions(positions);
  });

  const findMeaningfulName = (obj) => {
    if (obj.name && MESH_NAME_MAP[obj.name]) {
      return MESH_NAME_MAP[obj.name];
    }
    let current = obj;
    while (current) {
      if (current.name && !current.name.startsWith('Mesh_') && !current.name.startsWith('Object_')) {
        return current.name;
      }
      current = current.parent;
    }
    return obj.name || 'unnamed';
  };

  const findPanelName = (obj) => {
    if (obj.name && PANEL_KEY_MAP[obj.name]) {
      return obj.name;
    }
    let current = obj;
    while (current) {
      if (getPanelKeyFromName(current.name)) return current.name;
      current = current.parent;
    }
    return null;
  };

  const handleClick = (e) => {
    e.stopPropagation();
    const obj = e.object;
    if (obj && obj.isMesh) {
      const worldPos = obj.getWorldPosition(obj.position.clone());
      const meaningfulName = findPanelName(obj) || findMeaningfulName(obj);
      onMeshClick({
        name: meaningfulName,
        meshName: obj.name,
        position: [+worldPos.x.toFixed(2), +worldPos.y.toFixed(2), +worldPos.z.toFixed(2)],
      });
    }
  };

  return <primitive object={scene} onClick={handleClick} />;
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#3B82F6" wireframe />
    </mesh>
  );
}

function CameraTracker({ onUpdate }) {
  useFrame(({ camera }) => {
    const pos = camera.position;
    onUpdate({
      pos: [+pos.x.toFixed(2), +pos.y.toFixed(2), +pos.z.toFixed(2)],
    });
  });
  return null;
}

function InitialCameraView({ controlsRef, view }) {
  const { camera } = useThree();
  const appliedRef = useRef(false);

  useFrame(() => {
    if (appliedRef.current || !controlsRef.current) return;
    camera.position.set(...view.pos);
    controlsRef.current.target.set(...view.target);
    controlsRef.current.update();
    appliedRef.current = true;
  });

  return null;
}

export default function Overview({ comps = [], sensors = [], flowTotal = 0, flowTotalMax = 12000, logs = [], alarms = [], sysP, sp, db, pressOk, pressLow, pressClr, runComps, totalKw, totalFlow, energy, seqMode }) {
  const controlsRef = useRef();
  const [camInfo, setCamInfo] = useState({ pos: DEFAULT_LOCK_VIEW.pos });
  const [locked, setLocked] = useState(false);
  const [clickedMesh, setClickedMesh] = useState(null);
  const [cubePositions, setCubePositions] = useState({});
  const [panelScale, setPanelScale] = useState(0.8);
  const [panelMode, setPanelMode] = useState('all');
  const [selectedPanelKey, setSelectedPanelKey] = useState(null);
  const [lockSaved, setLockSaved] = useState(false);
  const saveTimerRef = useRef(null);

  const [lockView, setLockView] = useState(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_LOCK_VIEW;
      const saved = window.localStorage.getItem(LOCK_VIEW_STORAGE_KEY);
      if (!saved) return DEFAULT_LOCK_VIEW;
      const parsed = JSON.parse(saved);
      const valid = [parsed?.pos, parsed?.target].every(v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite));
      return valid ? parsed : DEFAULT_LOCK_VIEW;
    } catch {
      return DEFAULT_LOCK_VIEW;
    }
  });
  const makeSensorPanel = (target, label, sensorId, sensorName, metricLabel, fallbackColor, screenOffset, total) => {
    const sensor = sensors.find(s => s.id === sensorId) || sensors.find(s => s.name === sensorName);
    const value = sensor?.value ?? 0;
    const min = sensor?.min ?? 0;
    const max = sensor?.max ?? 12;
    const warnLo = sensor?.warnLo ?? min;
    const warnHi = sensor?.warnHi ?? max;
    const pct = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
    const warn = value <= warnLo || value >= warnHi;
    const color = warn ? '#F87171' : (sensor?.clr || fallbackColor);
    return { target, label, sensor, value, unit: sensor?.unit || '', pct, warn, color, metricLabel, screenOffset, total };
  };
  const sensorPanels = [
    makeSensorPanel(TANK_A_TARGET, 'TANK-A', 's1', 'Pressure Sensor 1', 'Pressure', '#60A5FA', [90, 24]),
    makeSensorPanel(TANK_B_TARGET, 'TANK-B', 's2', 'Pressure Sensor 2', 'Pressure', '#10B981', [-90, -24]),
    makeSensorPanel(FLOW_TARGET, 'Flow', 's3', 'Flow Meter 1', 'Flow', '#F59E0B', [0, -38], {
      label: 'Flow Total',
      value: flowTotal,
      max: flowTotalMax,
    }),
  ];
  const shouldShowPanel = (panelKey) => panelMode === 'all' || selectedPanelKey === panelKey;

  const handleMeshClick = (meshInfo) => {
    const panelKey = getPanelKeyFromName(meshInfo.name) || getPanelKeyFromName(meshInfo.meshName);
    if (panelKey) {
      setPanelMode('selected');
      setSelectedPanelKey(panelKey);
      setClickedMesh(null);
      return;
    }
    setClickedMesh(meshInfo);
  };

  const handleLock = () => {
    const next = !locked;
    setLocked(next);
    if (next && controlsRef.current) {
      const cam = controlsRef.current.object;
      cam.position.set(...lockView.pos);
      controlsRef.current.target.set(...lockView.target);
      controlsRef.current.update();
      setPanelMode('all');
      setSelectedPanelKey(null);
      setClickedMesh(null);
    }
  };

  const handleOrbitStart = () => {
    if (locked) return;
    setPanelMode('selected');
    setSelectedPanelKey(null);
    setClickedMesh(null);
  };

  const handleSaveLockView = () => {
    if (!controlsRef.current) return;
    const cam = controlsRef.current.object.position;
    const target = controlsRef.current.target;
    const next = {
      pos: [+cam.x.toFixed(2), +cam.y.toFixed(2), +cam.z.toFixed(2)],
      target: [+target.x.toFixed(2), +target.y.toFixed(2), +target.z.toFixed(2)],
    };
    setLockView(next);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LOCK_VIEW_STORAGE_KEY, JSON.stringify(next));
      }
    } catch {
      // Keep the current session lock view even when storage is unavailable.
    }
    setLockSaved(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setLockSaved(false), 1800);
  };

  const getTarget = () => {
    if (controlsRef.current) {
      const t = controlsRef.current.target;
      return [+t.x.toFixed(2), +t.y.toFixed(2), +t.z.toFixed(2)];
    }
    return [0, 0, 0];
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Stat Cards — float over 3D viewer */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 280, zIndex: 10, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}><StatCard label="System Pressure" value={sysP.toFixed(3)} unit="bar" clr={pressClr} icon="🌡" sub={pressOk ? '✓ Normal' : pressLow ? '▼ Low' : '▲ High'} /></div>
        <div style={{ pointerEvents: 'auto' }}><StatCard label="A/C RUNNING" value={`${runComps.length}/${comps.length}`} unit="units" clr={C.accent} icon="⚙" /></div>
        <div style={{ pointerEvents: 'auto' }}><StatCard label="SYSTEM POWER" value={totalKw.toFixed(1)} unit="kW" clr="#8B5CF6" icon="⚡" sub={`${energy.toFixed(3)} kWh`} /></div>
        <div style={{ pointerEvents: 'auto' }}><StatCard label="FLOW RATE" value={totalFlow.toFixed(2)} unit="m³/min" clr={C.green} icon="💨" /></div>
        <div style={{ pointerEvents: 'auto' }}><StatCard label="SYSTEM EFFICIENCY" value={totalFlow > 0 ? (totalKw / totalFlow).toFixed(2) : '—'} unit="kW/m³/min" clr={C.amber} icon="📈" /></div>
        <div style={{ pointerEvents: 'auto' }}><StatCard label="Seq Mode" value={seqMode} unit={`${comps.filter(c => c.status === 'FAULT').length} fault`} clr={C.accent} icon="🔄" /></div>
      </div>

      {/* 3D Viewer — fills entire area */}
      <div style={{ width: '100%', height: '100%', background: '#1a1a2e', overflow: 'hidden' }}>
        <Canvas
          camera={{ position: DEFAULT_LOCK_VIEW.pos, fov: 50 }}
          style={{ width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.3} />
          <pointLight position={[0, 10, 0]} intensity={0.5} />

          <Suspense fallback={<LoadingFallback />}>
            <Center>
              <Model onMeshClick={handleMeshClick} onCubePositions={setCubePositions} />
            </Center>
            <ContactShadows
              position={[0, -1.5, 0]}
              opacity={0.4}
              scale={10}
              blur={2}
              far={4}
            />
            <Environment preset="warehouse" />
          </Suspense>

          {Object.entries(AC_CUBE_MAP).map(([acName, cubeName]) => {
            const seqNum = parseInt(acName.replace('AC-', ''), 10);
            const comp = comps.find(c => c.seq === seqNum);
            if (!comp || !cubePositions[cubeName]) return null;
            const s = ST_META[comp.status] || ST_META.STANDBY;
            const isRunning = comp.status === 'RUNNING';
            const kw = comp.kw * comp.load / 100;
            if (!shouldShowPanel(cubeName)) return null;
            return (
              <Html key={acName} position={cubePositions[cubeName]} center sprite transform={false} zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
                <div style={{
                  transform: `scale(${panelScale})`,
                  transformOrigin: 'center center',
                  background: 'rgba(0,0,0,0.85)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  border: `1.5px solid ${s.bd}`,
                  whiteSpace: 'nowrap',
                  minWidth: 130,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: s.tx, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
                    C-{String(comp.seq).padStart(2, '0')} {comp.brand}
                  </div>
                  <div><span style={{ color: '#94A3B8' }}>Press: </span><span style={{ color: '#60A5FA' }}>{comp.press.toFixed(1)} bar</span></div>
                  <div><span style={{ color: '#94A3B8' }}>Temp: </span><span style={{ color: comp.temp > 85 ? '#F87171' : '#FBBF24' }}>{comp.temp.toFixed(1)}°C</span></div>
                  <div><span style={{ color: '#94A3B8' }}>Curr: </span><span style={{ color: '#A78BFA' }}>{comp.curr.toFixed(1)} A</span></div>
                  <div><span style={{ color: '#94A3B8' }}>Load: </span><span style={{ color: '#4ADE80' }}>{comp.load.toFixed(0)}%</span></div>
                  <div><span style={{ color: '#94A3B8' }}>Power: </span><span style={{ color: '#FB923C' }}>{kw.toFixed(1)} / {comp.kw} kW</span></div>
                </div>
              </Html>
            );
          })}

          {sensorPanels.map(({ target, label, sensor, value, unit, pct, warn, color, metricLabel, screenOffset, total }) => (
            sensor && cubePositions[target] && shouldShowPanel(target) && (
              <Html key={target} position={cubePositions[target]} center sprite transform={false} zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
                <div style={{
                  transform: `translate(${screenOffset[0]}px, ${screenOffset[1]}px) scale(${panelScale})`,
                  transformOrigin: 'center center',
                  background: 'rgba(0,0,0,0.85)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  border: `1.5px solid ${color}`,
                  whiteSpace: 'nowrap',
                  minWidth: 150,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' }} />
                    {label}
                  </div>
                  <div><span style={{ color: '#94A3B8' }}>{metricLabel}: </span><span style={{ color }}>{value.toFixed(2)} {unit}</span></div>
                  {total&&<div><span style={{ color: '#94A3B8' }}>{total.label}: </span><span style={{ color }}>{total.value.toFixed(2)} / {total.max}</span></div>}
                  <div style={{ marginTop: 6, background: '#374151', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${pct * 100}%`, height: '100%', background: color, transition: 'width .5s' }} />
                  </div>
                </div>
              </Html>
            )
          ))}

          <CameraTracker onUpdate={setCamInfo} />
          <OrbitControls
            ref={controlsRef}
            enablePan={!locked}
            enableZoom={!locked}
            enableRotate={!locked}
            autoRotate={false}
            autoRotateSpeed={0}
            minDistance={2}
            maxDistance={100}
            onStart={handleOrbitStart}
          />
          <InitialCameraView controlsRef={controlsRef} view={DEFAULT_LOCK_VIEW} />
        </Canvas>

        {/* Clicked Mesh Info */}
        {clickedMesh && !AC_CUBE_MAP[clickedMesh.name] && (
          <div style={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#fff',
            fontSize: 10,
            fontFamily: 'monospace',
            border: '1px solid #3B82F6',
          }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: '#60A5FA', marginBottom: 4 }}>🎯 Clicked Mesh</div>
            <div><span style={{ color: '#94A3B8' }}>name: </span><span style={{ color: '#4ADE80' }}>{clickedMesh.name}</span></div>
            <div><span style={{ color: '#94A3B8' }}>mesh: </span><span style={{ color: '#FB923C' }}>{clickedMesh.meshName}</span></div>
            <div><span style={{ color: '#94A3B8' }}>pos: </span><span style={{ color: '#FBBF24' }}>[{clickedMesh.position.join(', ')}]</span></div>
            <button onClick={() => setClickedMesh(null)} style={{ marginTop: 6, background: '#374151', border: 'none', color: '#94A3B8', borderRadius: 4, padding: '3px 8px', fontSize: 9, cursor: 'pointer' }}>✕ Close</button>
          </div>
        )}

        {/* Panel Scale Slider */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          borderRadius: 8,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ color: '#94A3B8', fontSize: 10, fontWeight: 600 }}>Size</span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={panelScale}
            onChange={(e) => setPanelScale(parseFloat(e.target.value))}
            style={{ width: 80, cursor: 'pointer' }}
          />
          <span style={{ color: '#60A5FA', fontSize: 10, fontFamily: 'monospace', minWidth: 30 }}>{panelScale.toFixed(1)}x</span>
        </div>

        {/* Lock View Controls */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}>
          <button
            onClick={handleLock}
            style={{
              background: locked ? '#DC2626' : '#16A34A',
              border: 'none',
              color: '#fff',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            {locked ? '🔒 LOCKED — Click to Unlock' : '🔓 Lock View'}
          </button>
          <button
            onClick={handleSaveLockView}
            title={`Camera [${camInfo.pos.join(', ')}] Target [${getTarget().join(', ')}]`}
            style={{
              background: lockSaved ? '#2563EB' : 'rgba(0,0,0,0.72)',
              border: `1px solid ${lockSaved ? '#60A5FA' : '#475569'}`,
              color: '#fff',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            {lockSaved ? 'Saved Lock View' : 'Set Lock View'}
          </button>
        </div>
      </div>

      {/* Sidebar — floats over 3D viewer on the right */}
      <div style={{
        position: 'absolute',
        top: '50%',
        right: 12,
        bottom: 64,
        width: 260,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        overflowY: 'auto',
        pointerEvents: 'none',
      }}>
        {/* Active Alarms */}
        <div style={{
          background: 'rgba(255,255,255,1)',
          backdropFilter: 'blur(10px)',
          borderRadius: 10,
          padding: 14,
          border: '1px solid rgba(255,255,255,0.08)',
          pointerEvents: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}>
          <STitle>Active Alarms ({alarms.length})</STitle>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {alarms.slice(0, 6).map(a => {
              const m = ALARM_META[a.level] || ALARM_META.WARNING;
              return (
                <div key={a.id} style={{ background: m.bg, border: `1.5px solid ${m.bd}`, borderLeft: `3px solid ${m.clr}`, borderRadius: '0 8px 8px 0', padding: '6px 8px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{m.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: m.clr, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.msg}</div>
                    <div style={{ fontSize: 8, color: '#94A3B8', marginTop: 1 }}>{a.time}</div>
                  </div>
                </div>
              );
            })}
            {alarms.length === 0 && (
              <div style={{ color: C.textFaint, fontSize: 10, textAlign: 'center', padding: 12 }}>
                ไม่มี Alarm ที่กำลังใช้งาน
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
