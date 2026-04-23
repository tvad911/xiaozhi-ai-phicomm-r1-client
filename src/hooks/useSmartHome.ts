import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

export interface SmartDevice {
  id: string;
  name: string;
  type: 'light' | 'climate' | 'cover';
  state: 'on' | 'off' | 'open' | 'closed';
  temp?: number;
}

export function useSmartHome() {
  const [smartDevices, setSmartDevices] = useState<SmartDevice[]>([]);
  const [mqttStatus, setMqttStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [smarthomeEnabled, setSmarthomeEnabled] = useState(false);

  const fetchStatus = async () => {
    try {
      const st = await fetchApi<{status: 'disconnected'|'connecting'|'connected', enabled: boolean}>('/api/smarthome/status');
      setMqttStatus(st.status);
      setSmarthomeEnabled(st.enabled);
      const dev = await fetchApi<SmartDevice[]>('/api/smarthome/devices');
      setSmartDevices(dev);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleDevice = async (id: string) => {
    try {
      await fetchApi(`/api/smarthome/devices/${id}/toggle`, { method: 'POST' });
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return { 
    smartDevices, setSmartDevices, 
    mqttStatus, setMqttStatus, 
    smarthomeEnabled, setSmarthomeEnabled,
    toggleDevice 
  };
}
