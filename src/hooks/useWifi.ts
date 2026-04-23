import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

export interface WifiNetwork {
  ssid: string;
  signal: number;
  security: string;
  connected: boolean;
  saved: boolean;
}

export function useWifi() {
  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([]);
  const [isWifiScanning, setIsWifiScanning] = useState(false);
  const [wifiAutoConnect, setWifiAutoConnect] = useState(true);

  const scanWifi = async () => {
    setIsWifiScanning(true);
    try {
      const data = await fetchApi<WifiNetwork[]>('/api/wifi/list');
      setWifiNetworks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsWifiScanning(false);
    }
  };

  const connectWifi = async (ssid: string, password?: string) => {
    try {
      await fetchApi('/api/wifi/connect', {
        method: 'POST',
        data: { ssid, password }
      });
      scanWifi();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  useEffect(() => {
    scanWifi();
  }, []);

  return { 
    wifiNetworks, setWifiNetworks, 
    isWifiScanning, scanWifi, connectWifi,
    wifiAutoConnect, setWifiAutoConnect
  };
}
