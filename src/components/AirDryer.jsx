import { C } from '../constants';
import { Badge } from './ui/Card';
import { Ring } from './ui/Gauge';

export default function AirDryer({ airDryer, toggleAirDryer, permissions }) {
  const { name, status, temp, maxTemp, voltage, flow, clr } = airDryer;
  const isRunning = status === "RUNNING";
  const tempOk = temp <= maxTemp;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: C.textSoft }}>Air Dryer Unit</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14 }}>
        <div style={{ background: C.bgCard, border: `1.5px solid ${tempOk ? C.border : C.redBorder}22`, borderRadius: 14, padding: 16, boxShadow: C.shadowMd, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: clr + "18", border: `1.5px solid ${clr}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>❄️</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: isRunning ? C.green : C.textFaint, boxShadow: `0 0 0 3px ${isRunning ? C.green + "33" : "transparent"}`, animation: isRunning ? "pulse 1.5s infinite" : "none" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.navy }}>{name}</span>
                </div>
                <div style={{ fontSize: 11, color: C.textFaint }}>Refrigerated Air Dryer · {voltage}V</div>
              </div>
            </div>
            <Badge label={isRunning ? "RUNNING" : "STANDBY"} bg={isRunning ? C.greenLight : C.bg} bd={isRunning ? C.greenBorder : C.border} tx={isRunning ? C.green : C.textSoft} />
          </div>

          {/* Status Start / Stop */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            padding: "6px 12px",
            borderRadius: 8,
            background: isRunning ? C.greenLight : C.bg,
            border: `1px solid ${isRunning ? C.greenBorder : C.border}`,
          }}>
            <span style={{ fontSize: 14 }}>{isRunning ? "✓" : "⚠"}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: isRunning ? C.green : C.textSoft }}>
              {isRunning ? "Status Start" : "Status Stop"}
            </span>
          </div>

          {/* Temp Gauge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, padding: "12px 0", background: C.bg, borderRadius: 10 }}>
            <Ring val={temp} max={60} clr={tempOk ? C.green : C.red} unit="°C" label="TEMP" />
          </div>

          {/* Spec tags */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {[["Max Temp", `${maxTemp}°C`], ["Volt", `${voltage}V`], ["Flow", `${flow}m³`]].map(([l, v]) => (
              <div key={l} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "2px 8px", fontSize: 9 }}>
                <span style={{ color: C.textFaint }}>{l}: </span><span style={{ color: C.textMid, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Start / Stop */}
          {permissions.ctrl && (
            <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
              <button
                onClick={toggleAirDryer}
                style={{
                  flex: 1,
                  background: isRunning ? C.redLight : C.greenLight,
                  border: `1.5px solid ${isRunning ? C.red : C.green}`,
                  color: isRunning ? C.red : C.green,
                  borderRadius: 8,
                  padding: "10px 0",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {isRunning ? "■ STOP" : "▶ START"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
