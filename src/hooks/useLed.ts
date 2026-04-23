import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

export function useLed() {
  const [ledMode, setLedMode] = useState<'off' | 'on' | 'music'>('music');
  const [ledColor, setLedColor] = useState('#ea580c');
  const [ledDuration, setLedDuration] = useState(2000);

  useEffect(() => {
    fetchApi<{mode: 'off'|'on'|'music', color: string, duration: number}>('/api/led/status')
      .then(data => {
        setLedMode(data.mode);
        setLedColor(data.color);
        setLedDuration(data.duration);
      })
      .catch(console.error);
  }, []);

  const updateLedMode = async (mode: 'off' | 'on' | 'music') => {
    setLedMode(mode);
    fetchApi('/api/led/mode', { method: 'POST', data: { mode } }).catch(console.error);
  };

  const updateLedColor = async (color: string) => {
    setLedColor(color);
    fetchApi('/api/led/color', { method: 'POST', data: { color } }).catch(console.error);
  };

  const updateLedDuration = async (duration: number) => {
    setLedDuration(duration);
    fetchApi('/api/led/speed', { method: 'POST', data: { duration } }).catch(console.error);
  };

  return {
    ledMode, setLedMode: updateLedMode,
    ledColor, setLedColor: updateLedColor,
    ledDuration, setLedDuration: updateLedDuration
  };
}
