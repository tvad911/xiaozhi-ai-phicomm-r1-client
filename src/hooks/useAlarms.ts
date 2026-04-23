import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

export interface Alarm {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  days: string[];
}

export interface Timer {
  id: string;
  label: string;
  duration: number;
  remaining: number;
  active: boolean;
}

export function useAlarms() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [timers, setTimers] = useState<Timer[]>([]);

  const fetchAll = async () => {
    try {
      const a = await fetchApi<Alarm[]>('/api/alarms');
      setAlarms(a);
      const t = await fetchApi<Timer[]>('/api/timers');
      setTimers(t);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []);

  const setAlarmsWithApi = (newAlarms: React.SetStateAction<Alarm[]>) => {
    setAlarms((prev) => {
      const updated = typeof newAlarms === 'function' ? newAlarms(prev) : newAlarms;
      fetchApi('/api/alarms/sync', { method: 'POST', data: updated }).catch(console.error);
      return updated;
    });
  };

  const setTimersWithApi = (newTimers: React.SetStateAction<Timer[]>) => {
    setTimers((prev) => {
      const updated = typeof newTimers === 'function' ? newTimers(prev) : newTimers;
      fetchApi('/api/timers/sync', { method: 'POST', data: updated }).catch(console.error);
      return updated;
    });
  };

  return { 
    alarms, setAlarms: setAlarmsWithApi,
    timers, setTimers: setTimersWithApi
  };
}
