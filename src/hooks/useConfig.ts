import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

export interface Persona {
  id: string;
  name: string;
  prompt: string;
}

export interface AppConfig {
  isWebAuthEnabled: boolean;
  webUiPin: string;
  useStandaloneMode: boolean;
  serverUrl: string;
  picovoiceAccessKey: string;
  wakeWord: string;
  llmProvider: string;
  llmApiKey: string;
  ttsProvider: string;
  ttsApiKey: string;
  activePersonaId: string;
  personas: Persona[];
  voiceSpeed: number;
  activationSensitivity: number;
  silenceTimeout: number;
  macAddress: string;
  otaVersion: string;
}

export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  const loadConfig = async () => {
    try {
      const data = await fetchApi<AppConfig>('/api/config');
      setConfig(data);
      setAuthRequired(false);
    } catch (err: any) {
      console.error('Failed to load config', err);
      if (err?.status === 401) {
        setAuthRequired(true);
      }
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
    // Check auth status first
    fetchApi<{authRequired: boolean}>('/api/auth-status')
      .then(res => {
        if (res.authRequired && !localStorage.getItem('r1_web_pin')) {
          setAuthRequired(true);
          setLoading(false);
        } else {
          loadConfig();
        }
      })
      .catch(() => loadConfig());
  }, []);

  return { config, loading, authRequired, setAuthRequired, updateConfig, refetch: loadConfig };
}
