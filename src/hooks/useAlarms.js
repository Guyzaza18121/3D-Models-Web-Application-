import { useState, useCallback } from 'react';
import { uid, tsNow } from '../mocks';

// ──────────────────────────────────────────────────────────────────────────────
// useAlarms — alarm state + addAlarm helper
// Requires addLog from useLogs (stable ref — useCallback with []).
// TODO: [BACKEND] On mount: fetch active alarms via alarmsApi.getAll({ acked: false })
//                 addAlarm: persist via alarmsApi.create(entry)
//                 setAlarms: replaced by WebSocket push from backend
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ addLog: (type: string, msg: string, who?: string) => void }} deps
 */
export function useAlarms({ addLog }) {
  const [alarms,  setAlarms]  = useState([]);
  const [aFilter, setAFilter] = useState('ALL');
  const [aSearch, setASearch] = useState('');

  const addAlarm = useCallback((code, msg, level) => {
    setAlarms(p => {
      if (p.find(a => a.code === code && Date.now() - a.ts < 10000)) return p;
      addLog('ALARM', msg);
      return [{ id: uid(), code, msg, level, time: tsNow(), ts: Date.now() }, ...p];
    });
  }, [addLog]);

  return {
    alarms, setAlarms, addAlarm,
    aFilter, setAFilter,
    aSearch, setASearch,
  };
}
