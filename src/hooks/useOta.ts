import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

export function useOta() {
  const [otaVersion, setOtaVersion] = useState('1.0.0');
  const [isCheckingOTA, setIsCheckingOTA] = useState(false);
  const [autoOtaEnabled, setAutoOtaEnabled] = useState(true);

  useEffect(() => {
    fetchApi<{version: string, auto: boolean}>('/api/ota/info')
      .then(d => {
        setOtaVersion(d.version);
        setAutoOtaEnabled(d.auto);
      })
      .catch(console.error);
  }, []);

  const checkOTAUpdate = async () => {
    setIsCheckingOTA(true);
    try {
      await fetchApi('/api/ota/check', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingOTA(false);
    }
  };

  return { 
    otaVersion, 
    isCheckingOTA, setIsCheckingOTA, checkOTAUpdate,
    autoOtaEnabled, setAutoOtaEnabled
  };
}
