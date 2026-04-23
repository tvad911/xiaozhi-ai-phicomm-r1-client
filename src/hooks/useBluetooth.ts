import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

export interface BluetoothDevice {
  id: string;
  name: string;
  connected: boolean;
  type?: 'audio' | 'input' | 'other';
  pairingStatus: 'none' | 'pairing' | 'paired' | 'failed';
  rssi?: number;
  batteryLevel?: number;
  codec?: string;
  audioOutput?: 'standard' | 'enhanced' | 'mono';
  isPlaying?: boolean;
  volume?: number;
  profileId?: string;
}

export interface BluetoothProfile {
  id: string;
  name: string;
  deviceName: string;
  deviceId: string;
  audioOutput: 'standard' | 'enhanced' | 'mono';
  autoConnect: boolean;
  autoReconnect: boolean;
}

export interface BluetoothGroup {
  id: string;
  name: string;
  deviceIds: string[];
  isPlaying: boolean;
  volume: number;
}

export function useBluetooth() {
  const [btDevices, setBtDevices] = useState<BluetoothDevice[]>([]);
  const [profiles, setProfiles] = useState<BluetoothProfile[]>([]);
  const [btGroups, setBtGroups] = useState<BluetoothGroup[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const fetchDevices = async () => {
    try {
      const data = await fetchApi<BluetoothDevice[]>('/api/bluetooth/devices');
      setBtDevices(data);
    } catch (e) {
      console.error(e);
    }
  };

  const startScan = async () => {
    setIsScanning(true);
    try {
      await fetchApi('/api/bluetooth/scan', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
      fetchDevices();
    }
  };

  const toggleConnection = async (id: string) => {
    try {
      await fetchApi(`/api/bluetooth/connect`, { method: 'POST', data: { id } });
      fetchDevices();
    } catch (e) {
      console.error(e);
    }
  };

  const pairDevice = async (id: string) => {
    try {
      await fetchApi(`/api/bluetooth/pair`, { method: 'POST', data: { id } });
      fetchDevices();
    } catch (e) {
      console.error(e);
    }
  };
  
  const removeDevice = async (id: string) => {
    try {
      await fetchApi(`/api/bluetooth/devices/${id}`, { method: 'DELETE' });
      fetchDevices();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProfiles = async () => {
    try {
      const data = await fetchApi<BluetoothProfile[]>('/api/bluetooth/profiles');
      setProfiles(data);
    } catch (e) {
      console.error(e);
    }
  };
  
  const saveProfile = async (profile: Partial<BluetoothProfile>) => {
    try {
      await fetchApi('/api/bluetooth/profiles', { method: 'POST', data: profile });
      fetchProfiles();
    } catch (e) {
      console.error(e);
    }
  };
  
  const removeProfile = async (id: string) => {
    try {
      await fetchApi(`/api/bluetooth/profiles/${id}`, { method: 'DELETE' });
      fetchProfiles();
    } catch (e) {
      console.error(e);
    }
  };

  const applyProfile = async (profile: BluetoothProfile) => {
    try {
      await fetchApi(`/api/bluetooth/profiles/${profile.id}/apply`, { method: 'POST' });
      fetchDevices();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGroups = async () => {
    try {
      const data = await fetchApi<BluetoothGroup[]>('/api/bluetooth/groups');
      setBtGroups(data);
    } catch (e) {
      console.error(e);
    }
  };

  const createGroup = async (group: Partial<BluetoothGroup>) => {
    try {
      await fetchApi('/api/bluetooth/groups', { method: 'POST', data: group });
      fetchGroups();
    } catch (e) {
      console.error(e);
    }
  };
  
  const removeGroup = async (id: string) => {
    try {
      await fetchApi(`/api/bluetooth/groups/${id}`, { method: 'DELETE' });
      fetchGroups();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleGroupPlayback = async (id: string) => {
    try {
      await fetchApi(`/api/bluetooth/groups/${id}/toggle`, { method: 'POST' });
      fetchGroups();
    } catch (e) {
      console.error(e);
    }
  };

  const adjustGroupVolume = async (id: string, volume: number) => {
    try {
      await fetchApi(`/api/bluetooth/groups/${id}/volume`, { method: 'POST', data: { volume } });
      fetchGroups();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchProfiles();
    fetchGroups();
    const interval = setInterval(fetchDevices, 10000); // Polling status
    return () => clearInterval(interval);
  }, []);

  return {
    btDevices, setBtDevices,
    profiles, setProfiles,
    btGroups, setBtGroups,
    isScanning, startScan,
    toggleConnection, pairDevice, removeDevice, 
    saveProfile, applyProfile, removeProfile,
    createGroup, removeGroup, toggleGroupPlayback, adjustGroupVolume
  };
}
