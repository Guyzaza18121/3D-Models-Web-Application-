import { useEffect } from 'react';
import { connectMqtt, onMqttMessage, publishCommand } from '../api/mqtt.client';

export function useNodeRedTelemetry({
  setComps, setSensors, setAirDryer, setSysP, setPressHist,
  setKwHist, setFlowHist, setFlowTotal, setEnergy,
  addLog, addAlarm
}) {
  useEffect(() => {
    connectMqtt();
    const unsub = onMqttMessage((topic, data) => {
      const suffix = topic.split('/').pop();

      if (suffix === 'compressors' && Array.isArray(data)) {
        setComps(data);
      }
      if (suffix === 'sensors' && Array.isArray(data)) {
        setSensors(data);
      }
      if (suffix === 'airDryer' && data) {
        setAirDryer(data);
      }
      if (suffix === 'pressure' && typeof data.value === 'number') {
        setSysP(data.value);
        setPressHist(h => [...h.slice(1), data.value]);
      }
      if (suffix === 'kw' && typeof data.value === 'number') {
        setKwHist(h => [...h.slice(1), data.value]);
      }
      if (suffix === 'flow' && typeof data.value === 'number') {
        setFlowHist(h => [...h.slice(1), data.value]);
        setFlowTotal(prev => {
          const next = prev + data.value;
          return next >= 12000 ? 0 : next;
        });
      }
      if (suffix === 'energy' && typeof data.value === 'number') {
        setEnergy(data.value);
      }
      if (suffix === 'alarm' && data.code && data.msg) {
        addAlarm(data.code, data.msg, data.level || 'WARNING');
      }
      if (suffix === 'log' && data.type && data.msg) {
        addLog(data.type, data.msg, data.who || 'SYSTEM');
      }
    });
    return unsub;
  }, []);
}

export { publishCommand };
