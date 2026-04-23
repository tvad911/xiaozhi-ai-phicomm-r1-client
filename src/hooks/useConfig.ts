import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

export interface AppConfig {
  serverUrl: string;
  systemPrompt: string;
  voiceSpeed: number;
  activationSensitivity: number;
  silenceTimeout: number;
  macAddress: string;
  otaVersion: string;
}

export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConfig = async () => {
    try {
      const data = await fetchApi<AppConfig>('/api/config');
      setConfig(data);
    } catch (err) {
      console.error('Failed to load config', err);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfig: Partial<AppConfig>) => {
    try {
      const updated = await fetchApi<AppConfig>('/api/config', {
        method: 'POST',
        data: newConfig
      });
      setConfig(updated);
      return true;
    } catch (err) {
      console.error('Failed to update config', err);
      return false;
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return { config, loading, updateConfig, refetch: loadConfig };
}
