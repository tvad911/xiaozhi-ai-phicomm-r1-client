import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

export function useCasting() {
  const [airplayStatus, setAirplayStatus] = useState(true);
  const [dlnaStatus, setDlnaStatus] = useState(true);
  const [castingName, setCastingName] = useState('Xiaozhi R1');

  useEffect(() => {
    fetchApi<{airplay: boolean, dlna: boolean, name: string}>('/api/casting/status')
      .then(d => {
        setAirplayStatus(d.airplay);
        setDlnaStatus(d.dlna);
        setCastingName(d.name);
      })
      .catch(console.error);
  }, []);

  const updateAirplay = async (enabled: boolean) => {
    setAirplayStatus(enabled);
    fetchApi('/api/casting/airplay', { method: 'POST', data: { enabled } }).catch(console.error);
  };

  const updateDlna = async (enabled: boolean) => {
    setDlnaStatus(enabled);
    fetchApi('/api/casting/dlna', { method: 'POST', data: { enabled } }).catch(console.error);
  };

  const updateName = async (name: string) => {
    setCastingName(name);
    fetchApi('/api/casting/name', { method: 'POST', data: { name } }).catch(console.error);
  };

  return {
    airplayStatus, setAirplayStatus: updateAirplay,
    dlnaStatus, setDlnaStatus: updateDlna,
    castingName, setCastingName: updateName
  };
}
