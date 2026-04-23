import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

export interface SystemStatus {
  cpuUsage: number;
  ramUsage: number;
  uptime: string;
  temperature: number;
  storage: {
    total: number; // GB
    used: number; // GB
  };
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await fetchApi<SystemStatus>('/api/status');
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 5 seconds
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return { status, loading, error, refetch: fetchStatus };
}
