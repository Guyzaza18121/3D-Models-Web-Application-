import { useState, useCallback } from 'react';
import { uid, tsFull } from '../mocks';

// ──────────────────────────────────────────────────────────────────────────────
// useLogs — system log state + addLog helper
// TODO: [BACKEND] On mount: fetch recent logs via logsApi.getAll()
//                 addLog:   persist via logsApi.create(entry)
//                 setLogs:  replaced by WebSocket push from backend
// ──────────────────────────────────────────────────────────────────────────────

export function useLogs() {
  const [logs,      setLogs]      = useState([]);
  const [logFilter, setLogFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');

  const addLog = useCallback((type, msg, who = 'SYSTEM') => {
    setLogs(p => [{ id: uid(), type, msg, who, time: tsFull() }, ...p].slice(0, 400));
  }, []);

  const filteredLogs = logs.filter(l =>
    (logFilter === 'ALL' || l.type === logFilter) &&
    (logSearch === '' ||
      l.msg.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.who.toLowerCase().includes(logSearch.toLowerCase()))
  );

  return {
    logs, setLogs, addLog,
    logFilter, setLogFilter,
    logSearch, setLogSearch,
    filteredLogs,
  };
}
