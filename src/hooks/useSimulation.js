import { useRef, useEffect } from 'react';
import { clamp } from '../constants';
import { uid } from '../mocks';
import { K, VOL, computeActualDemand, computePressureDelta, calcCompressorState } from '../mocks/simulation.service';
import { pidTick } from '../services/pid.service';

const FLOW_TOTAL_MAX = 12000;

export function useSimulation({
  simOn, spRef, dbRef, demRef, seqRef,
  pidKpRef, pidKiRef, pidKdRef,
  setComps, setSensors, setAirDryer,
  setSysP, setPressHist, setKwHist, setFlowHist, setFlowTotal, setEnergy,
  setPidOut, setPidI, setPidD,
  addLog, addAlarm
}) {
  const tickRef = useRef(0);
  const sysPRef = useRef(5.5);
  const pidIntRef = useRef(0);
  const pidPrevErrRef = useRef(0);

  useEffect(() => {
    if (!simOn) return;
    const iv = setInterval(() => {
      tickRef.current += 1;
      const tk = tickRef.current;
      const SP = spRef.current, DB = dbRef.current, baseDem = demRef.current, mode = seqRef.current;
      const Kp = pidKpRef.current, Ki = pidKiRef.current, Kd = pidKdRef.current;

      setComps(prevCs => {
        let cs = prevCs.map(c => ({ ...c }));
        const runCS = cs.filter(c => c.status === "RUNNING");
        const supply = runCS.reduce((s, c) => s + c.flow * (c.load / 100), 0);
        const dem = computeActualDemand(baseDem, tk);
        const dP = computePressureDelta(supply, dem);

        setSysP(prev => {
          const newP = clamp(prev + dP, 0.1, 13);
          sysPRef.current = newP;

          if (mode === "AUTO") {
            const err = SP - newP;
            const pid = pidTick({ err, prevErr: pidPrevErrRef.current, integral: pidIntRef.current, Kp, Ki, Kd });
            pidIntRef.current = pid.newIntegral;
            pidPrevErrRef.current = err;
            const output = pid.output;

            if (tk % 2 === 0) {
              setPidOut(parseFloat(output.toFixed(3)));
              setPidI(parseFloat(pid.iTerm.toFixed(3)));
              setPidD(parseFloat(pid.dTerm.toFixed(3)));
            }

            const bySeq = [...cs].sort((a, b) => a.seq - b.seq);
            const onCS = bySeq.filter(c => c.status === "RUNNING");
            const offCS = bySeq.filter(c => c.status === "STANDBY");

            if (output > 0.3 && newP < SP - DB * 0.8 && offCS.length > 0) {
              const nx = offCS[0];
              cs = cs.map(c => c.id === nx.id ? { ...c, status: "RUNNING", load: 25 } : c);
              addLog("SEQ", `[PID] START C-${String(nx.seq).padStart(2, "0")} ${nx.brand} ${nx.model} | PID=${output.toFixed(3)} err=${err.toFixed(3)} P=${newP.toFixed(3)}`);
            }
            if (output < -0.3 && newP > SP + DB * 0.8 && onCS.length > 1) {
              const ls = onCS[onCS.length - 1];
              cs = cs.map(c => c.id === ls.id ? { ...c, status: "STANDBY", load: 0, curr: 0 } : c);
              addLog("SEQ", `[PID] STOP C-${String(ls.seq).padStart(2, "0")} ${ls.brand} ${ls.model} | PID=${output.toFixed(3)} err=${err.toFixed(3)} P=${newP.toFixed(3)}`);
            }
          } else if (mode === "MANUAL") {
            pidIntRef.current = 0; pidPrevErrRef.current = 0;
          }

          if (newP < SP - 1.8) addAlarm("LOW_P", `แรงดันต่ำวิกฤต: ${newP.toFixed(3)} bar`, "CRITICAL");
          if (newP > SP + 2.0) addAlarm("HIGH_P", `แรงดันสูงเกิน: ${newP.toFixed(3)} bar`, "WARNING");
          setPressHist(h => [...h.slice(1), newP]);
          return newP;
        });

        cs = cs.map(c => {
          const { updated, newFault } = calcCompressorState(c, { sysP: sysPRef.current, SP });
          if (newFault) addAlarm(`FLT_${c.id}`, `${c.brand} ${c.model} C-${String(c.seq).padStart(2, "0")}: ${newFault}`, "FAULT");
          return updated;
        });

        const kwNow = cs.filter(c => c.status === "RUNNING").reduce((s, c) => s + c.kw * c.load / 100, 0);
        const flowNow = cs.filter(c => c.status === "RUNNING").reduce((s, c) => s + c.flow * c.load / 100, 0);
        setKwHist(h => [...h.slice(1), kwNow]);
        setFlowHist(h => [...h.slice(1), flowNow]);
        setEnergy(e => e + kwNow / 3600);

        setSensors(prev => {
          let flowMeterOneValue = null;
          const nextSensors = prev.map(s => {
            if (s.type === "Pressure") return { ...s, value: clamp(sysPRef.current + rnd(-0.05, 0.05), 0, 12) };
            if (s.type === "Flow") {
              const nextValue = clamp(flowNow + rnd(-0.1, 0.1), 0, 15);
              if (s.id === "s3" || (s.name || "") === "Flow Meter 1") flowMeterOneValue = nextValue;
              return { ...s, value: nextValue };
            }
            if (s.type === "Temp") return { ...s, value: clamp(s.value + rnd(-0.2, 0.2), s.min, s.max) };
            return s;
          });
          if (flowMeterOneValue != null) {
            setFlowTotal(prevTotal => {
              const nextTotal = prevTotal + flowMeterOneValue;
              return nextTotal >= FLOW_TOTAL_MAX ? 0 : nextTotal;
            });
          }
          return nextSensors;
        });

        setAirDryer(prev => {
          if (prev.status !== "RUNNING") return prev;
          const newTemp = clamp(prev.temp + rnd(-0.3, 0.5), 20, 55);
          if (newTemp > prev.maxTemp) addAlarm("AD_TEMP", `Air Dryer อุณหภูมิสูง: ${newTemp.toFixed(1)}°C`, "WARNING");
          return { ...prev, temp: newTemp };
        });
        return cs;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [simOn]);

  return { tickRef, sysPRef };
}
