import React, { useState, useEffect, useRef } from 'react';

import { motion, AnimatePresence } from "motion/react";
import { 
  Speaker, 
  Settings, 
  Activity, 
  MessageSquare, 
  Cpu, 
  Signal, 
  Terminal,
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  Bluetooth,
  BluetoothSearching,
  BluetoothConnected,
  BluetoothOff,
  Trash2,
  Plus,
  Pencil,
  Check,
  X,
  Save,
  BookMarked,
  Volume2,
  Play,
  Pause,
  Layers,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  Network,
  Youtube,
  Music,
  Search,
  ExternalLink,
  ChevronRight,
  SkipBack,
  SkipForward,
  PlayCircle,
  ListMusic,
  GripVertical,
  ChevronUp,
  ChevronDown,
  List,
  Users,
  Shuffle,
  Repeat,
  Battery,
  Wand2,
  Bot,
  Mic2,
  FastForward,
  History,
  HardDrive,
  Airplay,
  Cast,
  MonitorPlay,
  Sun,
  Palette,
  Clock,
  MicOff,
  WifiHigh,
  Settings2,
  Waves,
  History,
  Music2,
  Sliders,
  Home,
  Lightbulb,
  Thermometer,
  Bell,
  Timer,
  DownloadCloud
} from 'lucide-react';
import { useConfig } from './hooks/useConfig';

interface BluetoothDevice {
  id: string;
  name: string;
  connected: boolean;
  rssi?: number;
  type?: 'audio' | 'input' | 'other';
  pairingStatus?: 'none' | 'pairing' | 'paired' | 'failed';
  profileId?: string;
  audioOutput?: 'standard' | 'enhanced' | 'mono';
  isPlaying?: boolean;
  volume?: number;
  batteryLevel?: number;
  codec?: 'SBC' | 'AAC' | 'aptX' | 'LDAC';
}

interface BluetoothProfile {
  id: string;
  name: string;
  deviceName: string;
  audioOutput: 'standard' | 'enhanced' | 'mono';
  createdAt: string;
  autoConnect: boolean;
  autoReconnect: boolean;
}

interface BluetoothGroup {
  id: string;
  name: string;
  deviceIds: string[];
  isPlaying: boolean;
  volume: number;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  source: 'soundcloud' | 'youtube' | 'zing' | 'local';
  url: string;
  duration: number;
}

interface WifiNetwork {
  ssid: string;
  strength: number;
  secure: boolean;
  connected: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'status' | 'chat' | 'setup' | 'bluetooth' | 'media' | 'casting' | 'security'>('status');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isScanningWifi, setIsScanningWifi] = useState(false);
  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([
    { ssid: 'Phicomm_Guest_5G', strength: 80, secure: true, connected: true },
    { ssid: 'Home_Network', strength: 45, secure: true, connected: false },
  ]);
  const [connectingWifi, setConnectingWifi] = useState<string | null>(null);
  const [wifiPassword, setWifiPassword] = useState('');
  const [btDevices, setBtDevices] = useState<BluetoothDevice[]>([
    { id: '1', name: 'Phicomm R1 Speaker (Built-in)', connected: true, type: 'audio', pairingStatus: 'paired', audioOutput: 'standard', isPlaying: false, volume: 60, batteryLevel: 100, codec: 'AAC' },
    { id: '2', name: 'Sony WH-1000XM4', connected: true, type: 'audio', pairingStatus: 'paired', audioOutput: 'enhanced', isPlaying: false, volume: 50, batteryLevel: 75, codec: 'LDAC' },
    { id: '3', name: 'Marshall Major IV', connected: false, type: 'audio', pairingStatus: 'paired', audioOutput: 'standard', isPlaying: false, volume: 40, batteryLevel: 90, codec: 'aptX' },
    { id: '4', name: 'Smart Phone X', connected: false, type: 'other', pairingStatus: 'paired', audioOutput: 'standard', isPlaying: false, volume: 50 },
  ]);
  const [profiles, setProfiles] = useState<BluetoothProfile[]>([
    { id: 'p1', name: 'Night Mode', deviceName: 'Phicomm R1 Speaker (Built-in)', audioOutput: 'mono', createdAt: new Date().toISOString(), autoConnect: true, autoReconnect: false }
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [showProfileCreator, setShowProfileCreator] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileAudio, setNewProfileAudio] = useState<'standard' | 'enhanced' | 'mono'>('standard');
  const [newProfileAutoConnect, setNewProfileAutoConnect] = useState(true);
  const [newProfileAutoReconnect, setNewProfileAutoReconnect] = useState(false);
  const [pairingPin, setPairingPin] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [pairingLogs, setPairingLogs] = useState<string[]>([]);
  const [btGroups, setBtGroups] = useState<BluetoothGroup[]>([]);
  const [showGroupCreator, setShowGroupCreator] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [tempGroupName, setTempGroupName] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'audio' | 'input' | 'other'>('all');
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupDevices, setSelectedGroupDevices] = useState<string[]>([]);

  // Missing Features State
  const [systemPrompt, setSystemPrompt] = useState('Bạn là một trợ lý ảo thông minh cho loa Phicomm R1. Hãy trả lời ngắn gọn, lịch sự và thân thiện. Tuyệt đối không nhắc đến "lala school", không yêu cầu "like" hay "subscribe" hoặc bất kỳ nội dung quảng cáo nào khác.');

  // Unwanted phrases filter list
  const BLACKLIST_PHRASES = [
    /lala school/gi,
    /hãy like/gi,
    /nhấn like/gi,
    /đăng ký kênh/gi,
    /subscribe/gi,
    /vui lòng thích/gi
  ];

  const scrubResponse = (text: string) => {
    let cleanText = text;
    BLACKLIST_PHRASES.forEach(pattern => {
      cleanText = cleanText.replace(pattern, '');
    });
    return cleanText.trim();
  };
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [uiTheme, setUiTheme] = useState<'system' | 'matrix' | 'classic'>('matrix');
  // AI & Mic settings
  const { config, loading, authRequired, setAuthRequired, updateConfig, refetch, fetchApi } = useConfig();
  
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length < 4) return;
    
    // Test the PIN
    localStorage.setItem('r1_web_pin', pinInput);
    try {
      const data = await fetchApi<any>('/api/config');
      if (data) {
        setAuthRequired(false);
        setPinError(false);
        refetch();
      }
    } catch (err: any) {
      if (err?.status === 401) {
        setPinError(true);
        localStorage.removeItem('r1_web_pin');
      }
    }
  };
  const [activationSensitivity, setActivationSensitivity] = useState(70);
  const [silenceTimeout, setSilenceTimeout] = useState(1500);
  const [otaVersion, setOtaVersion] = useState('1.5.2');
  const [isCheckingOTA, setIsCheckingOTA] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  // LED & Visuals State
  const [ledMode, setLedMode] = useState<'off' | 'on' | 'music'>('music');
  const [ledColor, setLedColor] = useState('#ea580c'); // Target orange
  const [ledDuration, setLedDuration] = useState(2000);
  
  // Audio/Amp Settings
  const [eqBands, setEqBands] = useState({ bass: 5, mid: 0, treble: 3 });
  
  // AI & Mic settings
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [isVoiceRecognitionActive, setIsVoiceRecognitionActive] = useState(true);
  const [micLevel, setMicLevel] = useState(0);

  // Advanced Network & OTA
  const [autoOtaEnabled, setAutoOtaEnabled] = useState(true);
  const [wifiAutoConnect, setWifiAutoConnect] = useState(true);
  const [macAddress, setMacAddress] = useState('00:E0:4C:68:01:AF');
  const [micInterval, setMicInterval] = useState<NodeJS.Timeout | null>(null);

  // Smart Home & IoT State
  const [smarthomeEnabled, setSmarthomeEnabled] = useState(false);
  const [mqttStatus, setMqttStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [smartDevices, setSmartDevices] = useState([
    { id: 'dev1', name: 'Living Room Light', type: 'light', state: 'off' },
    { id: 'dev2', name: 'Air Conditioner', type: 'climate', state: 'on', temp: 24 },
    { id: 'dev3', name: 'Curtains', type: 'cover', state: 'open' }
  ]);

  // Utilities / Routines State
  const [alarms, setAlarms] = useState([
    { id: 'a1', time: '06:30', label: 'Morning Wakeup', enabled: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    { id: 'a2', time: '14:00', label: 'Workout Time', enabled: false, days: ['Sat', 'Sun'] }
  ]);
  const [timers, setTimers] = useState([
    { id: 'ti1', label: 'Boil Eggs', duration: 5 * 60, remaining: 5 * 60, active: false }
  ]);
  
  const [ringingAlarmId, setRingingAlarmId] = useState<string | null>(null);
  const [ringingTimerId, setRingingTimerId] = useState<string | null>(null);
  const [lastCheckedTime, setLastCheckedTime] = useState('');
  
  const [showAddAlarm, setShowAddAlarm] = useState(false);
  const [newAlarmTime, setNewAlarmTime] = useState('07:00');
  const [newAlarmLabel, setNewAlarmLabel] = useState('New Alarm');
  
  const [showAddTimer, setShowAddTimer] = useState(false);
  const [newTimerLabel, setNewTimerLabel] = useState('New Timer');
  const [newTimerMinutes, setNewTimerMinutes] = useState(5);

  // Initial Setup / Provisioning State
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [isSpeakerInApMode, setIsSpeakerInApMode] = useState(false);
  const [isConnectedToSpeakerAp, setIsConnectedToSpeakerAp] = useState(false);
  const [provisioningStatus, setProvisioningStatus] = useState<'idle' | 'scanning' | 'connecting' | 'success' | 'failed'>('idle');

  // Streaming (AirPlay / DLNA) State
  const [airplayStatus, setAirplayStatus] = useState(true);
  const [dlnaStatus, setDlnaStatus] = useState(true);
  const [castingName, setCastingName] = useState('Phicomm R1 Hub');
  const [showNamingModal, setShowNamingModal] = useState(false);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isMediaPlaying, setIsMediaPlaying] = useState(false);
  const [mediaVolume, setMediaVolume] = useState(70);
  const [mediaSource, setMediaSource] = useState<'soundcloud' | 'youtube' | 'zing'>('youtube');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearchingMedia, setIsSearchingMedia] = useState(false);
  const [mediaQueue, setMediaQueue] = useState<Track[]>([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [trackProgress, setTrackProgress] = useState(0);

  const mockTracks: Track[] = [
    { id: 't1', title: 'Nấu Ăn Cho Em', artist: 'Đen Vâu ft. PiaLinh', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop', source: 'youtube', url: '#', duration: 240 },
    { id: 't2', title: 'Waiting For You', artist: 'MONO', cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=200&h=200&fit=crop', source: 'soundcloud', url: '#', duration: 215 },
    { id: 't3', title: 'Cắt Đôi Nỗi Sầu', artist: 'Tăng Duy Tân', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop', source: 'zing', url: '#', duration: 180 },
    { id: 't4', title: 'Making My Way', artist: 'Sơn Tùng M-TP', cover: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?w=200&h=200&fit=crop', source: 'youtube', url: '#', duration: 248 },
    { id: 't5', title: 'See Tình', artist: 'Hoàng Thùy Linh', cover: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a1?w=200&h=200&fit=crop', source: 'zing', url: '#', duration: 190 },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);

  // Persistence logic
  useEffect(() => {
    const savedDevices = localStorage.getItem('btDevices');
    const savedGroups = localStorage.getItem('btGroups');
    const savedProfiles = localStorage.getItem('profiles');
    const savedQueue = localStorage.getItem('mediaQueue');

    if (savedDevices) setBtDevices(JSON.parse(savedDevices));
    if (savedGroups) setBtGroups(JSON.parse(savedGroups));
    if (savedProfiles) setProfiles(JSON.parse(savedProfiles));
    if (savedQueue) setMediaQueue(JSON.parse(savedQueue));
    
    // Load Casting settings
    const savedAirplay = localStorage.getItem('airplayStatus');
    const savedDlna = localStorage.getItem('dlnaStatus');
    const savedCastingName = localStorage.getItem('castingName');
    
    if (savedAirplay !== null) setAirplayStatus(savedAirplay === 'true');
    if (savedDlna !== null) setDlnaStatus(savedDlna === 'true');
    if (savedCastingName) setCastingName(savedCastingName);
  }, []);

  useEffect(() => {
    localStorage.setItem('btDevices', JSON.stringify(btDevices));
  }, [btDevices]);

  useEffect(() => {
    localStorage.setItem('btGroups', JSON.stringify(btGroups));
  }, [btGroups]);

  useEffect(() => {
    localStorage.setItem('profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('mediaQueue', JSON.stringify(mediaQueue));
  }, [mediaQueue]);

  useEffect(() => {
    localStorage.setItem('airplayStatus', airplayStatus.toString());
    localStorage.setItem('dlnaStatus', dlnaStatus.toString());
    localStorage.setItem('castingName', castingName);
  }, [airplayStatus, dlnaStatus, castingName]);

  const handleNextTrack = () => {
    if (mediaQueue.length > 0) {
      if (repeatMode === 'one') {
        setTrackProgress(0);
        return;
      }
      
      const nextIndex = isShuffle 
        ? Math.floor(Math.random() * mediaQueue.length)
        : 0;
      
      const next = mediaQueue[nextIndex];
      setCurrentTrack(next);
      setMediaQueue(prev => prev.filter((_, i) => i !== nextIndex));
      setTrackProgress(0);
      setIsMediaPlaying(true);
    } else if (repeatMode === 'all' && currentTrack) {
      setTrackProgress(0);
    } else {
      setIsMediaPlaying(false);
      setTrackProgress(0);
    }
  };

  // Media Progress Simulation
  useEffect(() => {
    let interval: any;
    if (isMediaPlaying && currentTrack) {
      interval = setInterval(() => {
        setTrackProgress(prev => {
          if (prev >= currentTrack.duration) {
            handleNextTrack();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMediaPlaying, currentTrack, mediaQueue, isShuffle, repeatMode]);

  // Timers Tick Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        let hasChanges = false;
        const newTimers = prev.map(t => {
          if (t.active && t.remaining > 0) {
            hasChanges = true;
            const newRem = t.remaining - 1;
            if (newRem <= 0) {
              setRingingTimerId(t.id);
              return { ...t, remaining: 0, active: false };
            }
            return { ...t, remaining: newRem };
          }
          return t;
        });
        return hasChanges ? newTimers : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Alarms Checker Logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      setLastCheckedTime(prev => {
        if (prev !== currentString) {
          const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const currentDay = dayMap[now.getDay()];
          
          setAlarms(currentAlarms => {
            currentAlarms.forEach(a => {
              if (a.enabled && a.time === currentString && a.days.includes(currentDay)) {
                setRingingAlarmId(a.id);
              }
            });
            return currentAlarms;
          });
          return currentString;
        }
        return prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startScan = () => {
    setIsScanning(true);
    // Simulate finding a new device after 2 seconds
    setTimeout(() => {
      const codecs: ('SBC' | 'AAC' | 'aptX' | 'LDAC')[] = ['SBC', 'AAC', 'aptX', 'LDAC'];
      const randomCodec = codecs[Math.floor(Math.random() * codecs.length)];
      
      const newDevice: BluetoothDevice = { 
        id: Math.random().toString(36).substr(2, 9), 
        name: `Audio Adapter ${Math.floor(Math.random() * 100)}`, 
        connected: false, 
        type: 'audio',
        rssi: -Math.floor(50 + Math.random() * 40),
        pairingStatus: 'none',
        codec: randomCodec,
        batteryLevel: Math.floor(20 + Math.random() * 80)
      };
      setBtDevices(prev => {
        if (prev.some(d => d.name === newDevice.name)) return prev;
        return [...prev, newDevice];
      });
      setIsScanning(false);
    }, 2500);
  };

  const pairDevice = (id: string) => {
    setBtDevices(prev => prev.map(d => 
      d.id === id ? { ...d, pairingStatus: 'pairing' } : d
    ));
    setPairingLogs(['Initializing secure handshake...', 'Requesting identity from peripheral...']);

    // Simulate network delay then show PIN
    setTimeout(() => {
      setPairingLogs(prev => [...prev, 'Identity received. Negotiating encryption keys...', 'Waiting for PIN synchronization...']);
      
      setTimeout(() => {
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        setPairingPin(pin);
        setVerifyingId(id);
        setPairingLogs(prev => [...prev, 'PIN generated. Please verify on your device.']);
      }, 1500);
    }, 1500);
  };

  const confirmPairing = (success: boolean) => {
    if (!verifyingId) return;

    if (success) {
      setPairingLogs(prev => [...prev, 'PIN verified. Finalizing encryption setup...', 'Binding device to Phicomm R1 Peripherals list...']);
      
      setTimeout(() => {
        setBtDevices(prev => prev.map(d => 
          d.id === verifyingId ? { ...d, pairingStatus: 'paired', connected: true } : d
        ));
        setPairingPin(null);
        setVerifyingId(null);
        setPairingLogs([]);
      }, 1500);
    } else {
      setPairingLogs(prev => [...prev, 'Pairing rejected by user or timeout.', 'Cleaning up secure session...']);
      
      setTimeout(() => {
        setBtDevices(prev => prev.map(d => 
          d.id === verifyingId ? { ...d, pairingStatus: 'failed', connected: false } : d
        ));
        setPairingPin(null);
        setVerifyingId(null);
        setPairingLogs([]);
      }, 1000);
    }
  };

  const toggleConnection = (id: string) => {
    setBtDevices(prev => prev.map(d => 
      d.id === id ? { ...d, connected: !d.connected } : d
    ));
  };

  const removeDevice = (id: string) => {
    setBtDevices(prev => prev.filter(d => d.id !== id));
  };

  const saveProfile = (deviceId: string) => {
    const device = btDevices.find(d => d.id === deviceId);
    if (!device || !newProfileName) return;

    const newProfile: BluetoothProfile = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProfileName,
      deviceName: device.name,
      audioOutput: newProfileAudio,
      autoConnect: newProfileAutoConnect,
      autoReconnect: newProfileAutoReconnect,
      createdAt: new Date().toISOString()
    };

    setProfiles(prev => [...prev, newProfile]);
    setShowProfileCreator(null);
    setNewProfileName('');
  };

  const applyProfile = (profile: BluetoothProfile) => {
    setBtDevices(prev => prev.map(d => {
      // Find device by name (simulated logic)
      if (d.name === profile.deviceName) {
        return { 
          ...d, 
          profileId: profile.id, 
          audioOutput: profile.audioOutput,
          connected: profile.autoConnect ? true : d.connected
        };
      }
      return d;
    }));
  };

  const removeProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  const createGroup = () => {
    if (!newGroupName || selectedGroupDevices.length === 0) return;
    
    if (editingGroup) {
      setBtGroups(prev => prev.map(g => {
        if (g.id === editingGroup) {
          // Sync playback state and volume to all devices in group
          setBtDevices(devices => devices.map(d => 
            selectedGroupDevices.includes(d.id) ? { ...d, isPlaying: g.isPlaying, volume: g.volume } : d
          ));
          return { ...g, name: newGroupName, deviceIds: selectedGroupDevices };
        }
        return g;
      }));
      setEditingGroup(null);
    } else {
      const newGroup: BluetoothGroup = {
        id: Math.random().toString(36).substr(2, 9),
        name: newGroupName,
        deviceIds: selectedGroupDevices,
        isPlaying: false,
        volume: 50,
      };
      // For new groups, sync initial volume (50) to all selected devices
      setBtDevices(devices => devices.map(d => 
        selectedGroupDevices.includes(d.id) ? { ...d, volume: 50, isPlaying: false } : d
      ));
      setBtGroups(prev => [...prev, newGroup]);
    }
    
    setShowGroupCreator(false);
    setNewGroupName('');
    setSelectedGroupDevices([]);
  };

  const startEditGroup = (group: BluetoothGroup) => {
    setEditingGroup(group.id);
    setNewGroupName(group.name);
    setSelectedGroupDevices(group.deviceIds);
    setShowGroupCreator(true);
  };

  const removeGroup = (id: string) => {
    setBtGroups(prev => prev.filter(g => g.id !== id));
  };

  const toggleGroupPlayback = (groupId: string) => {
    setBtGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const newState = !g.isPlaying;
        // Sync devices in group
        setBtDevices(devices => devices.map(d => 
          g.deviceIds.includes(d.id) ? { ...d, isPlaying: newState } : d
        ));
        return { ...g, isPlaying: newState };
      }
      return g;
    }));
  };

  const adjustGroupVolume = (groupId: string, newVolume: number) => {
    setBtGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        // Sync devices in group
        setBtDevices(devices => devices.map(d => 
          g.deviceIds.includes(d.id) ? { ...d, volume: newVolume } : d
        ));
        return { ...g, volume: newVolume };
      }
      return g;
    }));
  };

  const startWifiScan = () => {
    setIsScanningWifi(true);
    setTimeout(() => {
      const discovered: WifiNetwork[] = [
        { ssid: 'Phicomm_Guest_5G', strength: 80, secure: true, connected: true },
        { ssid: 'Home_Network', strength: 45, secure: true, connected: false },
        { ssid: 'Cafe_Free_WiFi', strength: 30, secure: false, connected: false },
        { ssid: 'Hidden_SSD', strength: 20, secure: true, connected: false },
      ];
      setWifiNetworks(discovered);
      setIsScanningWifi(false);
    }, 2000);
  };

  const connectToWifi = (ssid: string) => {
    // Simulated connection logic
    setIsScanningWifi(true);
    setTimeout(() => {
      setWifiNetworks(prev => prev.map(n => ({
        ...n,
        connected: n.ssid === ssid
      })));
      setConnectingWifi(null);
      setWifiPassword('');
      setIsScanningWifi(false);
    }, 3000);
  };

  const performMediaSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchingMedia(true);
    
    // Simulated search results depending on active source
    setTimeout(() => {
      const results: Track[] = mockTracks.map(t => ({
        ...t,
        source: mediaSource,
        title: `${searchQuery} - ${t.title}`,
        id: Math.random().toString(36).substr(2, 9)
      }));
      setSearchResults(results);
      setIsSearchingMedia(false);
    }, 1200);
  };

  const playMediaTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsMediaPlaying(true);
    // Sync with Bluetooth groups - if a group is found, set it to playing
    if (btGroups.length > 0) {
      toggleGroupPlayback(btGroups[0].id);
    } else {
      // Sync with first connected audio device
      const audioDev = btDevices.find(d => d.connected && d.type === 'audio');
      if (audioDev) {
        setBtDevices(prev => prev.map(d => d.id === audioDev.id ? { ...d, isPlaying: true } : d));
      }
    }
  };

  const addToQueue = (track: Track) => {
    setMediaQueue(prev => [...prev, { ...track, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const removeFromQueue = (index: number) => {
    setMediaQueue(prev => prev.filter((_, i) => i !== index));
  };

  const moveInQueue = (index: number, direction: 'up' | 'down') => {
    setMediaQueue(prev => {
      const newQueue = [...prev];
      if (direction === 'up' && index > 0) {
        [newQueue[index], newQueue[index - 1]] = [newQueue[index - 1], newQueue[index]];
      } else if (direction === 'down' && index < newQueue.length - 1) {
        [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
      }
      return newQueue;
    });
  };

  const playNext = () => {
    if (mediaQueue.length === 0) return;
    const nextTrack = mediaQueue[0];
    playMediaTrack(nextTrack);
    setMediaQueue(prev => prev.slice(1));
  };

  const checkOTAUpdate = () => {
    setIsCheckingOTA(true);
    setTimeout(() => {
      setIsCheckingOTA(false);
      // Simulate no update or new version
      alert(`Current Version: ${otaVersion}. System is up to date.`);
    }, 2000);
  };

  const startProvisioningScan = () => {
    setProvisioningStatus('scanning');
    setTimeout(() => {
      setProvisioningStatus('idle');
    }, 2000);
  };

  const finalizeWifiSetup = (ssid: string) => {
    setProvisioningStatus('connecting');
    setTimeout(() => {
      setWifiNetworks(prev => prev.map(n => ({ ...n, connected: n.ssid === ssid })));
      setProvisioningStatus('success');
      setTimeout(() => {
        setSetupStep(4);
      }, 1500);
    }, 3000);
  };

  const toggleMicTest = () => {
    if (!isMicTesting) {
      setIsMicTesting(true);
      const interval = setInterval(() => {
        setMicLevel(Math.floor(Math.random() * 40) + (Math.random() > 0.7 ? 40 : 0));
      }, 80);
      setMicInterval(interval as any);
    } else {
      if (micInterval) clearInterval(micInterval);
      setMicInterval(null);
      setIsMicTesting(false);
      setMicLevel(0);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      // Call the Android Native Proxy Server instead of Google API directly
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      
      const data = await response.json();
      const cleanedText = scrubResponse(data.response || "");
      
      setMessages(prev => [...prev, { role: 'ai', text: cleanedText || "No response received from Android Native." }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to Android service: " + (error instanceof Error ? error.message : "AI processing failed") }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white font-bold">Loading R1 Interface...</div>;

  if (authRequired) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <form onSubmit={handlePinSubmit} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl">
          <Lock size={48} className="text-orange-500 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Yêu cầu truy cập</h2>
          <p className="text-zinc-500 text-sm mb-6">Nhập mã PIN để mở khoá Web UI</p>
          <input 
            type="password" 
            maxLength={6}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-center text-2xl font-mono text-white mb-4 outline-none focus:border-orange-500"
            placeholder="●●●●"
          />
          {pinError && <p className="text-red-500 text-xs mb-4">Mã PIN không chính xác!</p>}
          <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-all">Mở khoá</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-orange-500/30">
      {/* Background Grid Accent */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      <div className="relative max-w-6xl mx-auto px-6 py-12 flex flex-col min-h-screen">
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(234,88,12,0.3)]">
                <Speaker className="text-white w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Xiaozhi R1 Hub
              </h1>
            </div>
            <p className="text-zinc-500 font-medium">Phicomm R1 AI Integration Center</p>
          </div>

          <nav className="flex flex-wrap gap-1 p-1 bg-zinc-900/50 rounded-lg border border-zinc-800">
            {[
              { id: 'status', label: 'Dashboard', icon: Activity },
              { id: 'chat', label: 'Core AI', icon: MessageSquare },
              { id: 'media', label: 'Entertainment', icon: Music },
              { id: 'bluetooth', label: 'Connectivity', icon: Network },
              { id: 'casting', label: 'Streaming', icon: Cast },
              { id: 'smarthome', label: 'Smart Home', icon: Home },
              { id: 'security', label: 'Security', icon: ShieldCheck },
              { id: 'setup', label: 'Setup Guide', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-zinc-800 text-white shadow-sm shadow-black/50' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <tab.icon size={18} />
                <span className="text-sm font-semibold">{tab.label}</span>
              </button>
            ))}
          </nav>
        </header>

        {/* Content Area */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'status' && (
              <motion.div
                key="status"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {/* Stats Cards */}
                <StatusCard label="Backend Status" value="Online" sub="v1.0.4 - Cloud Run" icon={Activity} color="text-emerald-400" />
                <StatusCard label="Active Model" value="Gemini 3 Flash" sub="Latency: ~450ms" icon={Cpu} color="text-orange-400" />
                <StatusCard label="Speaker Logic" value="Ready" sub="STT/TTS Connected" icon={Signal} color="text-blue-400" />

                {/* Main Dashboard Panel */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 bg-zinc-100 group-hover:opacity-10 transition-opacity">
                      <Terminal size={120} />
                    </div>
                    
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Activity className="text-orange-500" size={24} />
                      System Overview
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-zinc-800/40 rounded-xl border border-zinc-700/50">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center border transition-all ${
                              ledMode !== 'off' ? 'bg-orange-600/10 border-orange-500/20' : 'bg-zinc-900 border-zinc-800'
                            }`}>
                              <Sun className={ledMode !== 'off' ? 'text-orange-500' : 'text-zinc-700'} size={20} />
                            </div>
                            <div>
                              <p className="font-bold">Light Ring</p>
                              <p className="text-xs text-zinc-500">{ledMode === 'music' ? 'Pulsing to Audio' : ledMode === 'on' ? 'Solid Dynamic' : 'Dark Mode'}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {(['off', 'on', 'music'] as const).map(mode => (
                              <button 
                                key={mode}
                                onClick={() => setLedMode(mode)}
                                className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                                  ledMode === mode ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500'
                                }`}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>

                        {ledMode !== 'off' && (
                          <div className="p-4 bg-zinc-800/20 rounded-xl border border-zinc-800 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Effect Settings</span>
                              <div className="flex items-center gap-2">
                                <Palette size={14} className="text-zinc-600" />
                                <div 
                                  className="w-4 h-4 rounded-full border border-white/20" 
                                  style={{ backgroundColor: ledColor }}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {['#ea580c', '#3b82f6', '#10b981', '#a855f7', '#ef4444'].map(c => (
                                <button 
                                  key={c}
                                  onClick={() => setLedColor(c)}
                                  className={`w-full h-2 rounded-full transition-all ${ledColor === c ? 'scale-y-150 ring-1 ring-white/50' : 'opacity-40 hover:opacity-100'}`}
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                            <div className="flex items-center justify-between group/dur">
                              <span className="text-[10px] font-bold text-zinc-500">CYCLE SPEED</span>
                              <div className="flex items-center gap-3">
                                <Clock size={12} className="text-zinc-600" />
                                <span className="text-xs font-mono">{ledDuration}ms</span>
                                <div className="flex bg-zinc-800 rounded-lg p-0.5">
                                  <button onClick={() => setLedDuration(d => Math.max(500, d - 500))} className="p-1 hover:text-white text-zinc-600"><ChevronDown size={12} /></button>
                                  <button onClick={() => setLedDuration(d => d + 500)} className="p-1 hover:text-white text-zinc-600"><ChevronUp size={12} /></button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-zinc-800/40 rounded-xl border border-zinc-700/50 p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <Sliders className="text-emerald-400" size={20} />
                          <h4 className="font-bold text-sm uppercase tracking-widest text-zinc-300">Acoustic Equalizer</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                          {(['bass', 'mid', 'treble'] as const).map(band => (
                            <div key={band} className="flex flex-col items-center gap-3">
                              <div className="h-24 w-1.5 bg-zinc-800 rounded-full relative">
                                <motion.div 
                                  initial={false}
                                  animate={{ height: `${(eqBands[band] + 10) * 5}%` }}
                                  className={`absolute bottom-0 w-full rounded-full ${
                                    band === 'bass' ? 'bg-orange-500' : band === 'mid' ? 'bg-blue-500' : 'bg-emerald-500'
                                  }`}
                                />
                              </div>
                              <span className="text-[10px] font-bold uppercase text-zinc-500">{band}</span>
                              <div className="flex flex-col gap-1">
                                <button onClick={() => setEqBands(prev => ({ ...prev, [band]: Math.min(10, prev[band] + 1) }))} className="p-1.5 bg-zinc-800 rounded hover:text-white text-zinc-500"><ChevronUp size={10} /></button>
                                <button onClick={() => setEqBands(prev => ({ ...prev, [band]: Math.max(-10, prev[band] - 1) }))} className="p-1.5 bg-zinc-800 rounded hover:text-white text-zinc-500"><ChevronDown size={10} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-800/20 rounded-xl border border-zinc-800 flex flex-col gap-2">
                      <MessageSquare className="text-orange-500" size={18} />
                      <span className="text-2xl font-bold">12.4k</span>
                      <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Requests Today</span>
                    </div>
                      <div className="p-4 bg-zinc-800/20 rounded-xl border border-zinc-800 flex flex-col gap-2">
                        <Zap className="text-blue-400" size={18} />
                        <span className="text-2xl font-bold">1.2s</span>
                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Avg Response</span>
                      </div>
                    </div>
                  </div>

                {/* Fast Setup Alert */}
                <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-2xl p-8 flex flex-col justify-between shadow-xl shadow-orange-950/20">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 leading-tight">Ready to connect your R1?</h3>
                    <p className="text-orange-100/80 text-sm mb-6 uppercase tracking-wider font-bold">Step 1: Get the App</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('setup')}
                    className="flex items-center justify-between bg-white text-orange-700 px-6 py-4 rounded-xl font-bold hover:bg-orange-50 transition-colors group"
                  >
                    Setup Guide
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-4xl mx-auto h-[620px] bg-zinc-900/40 border border-zinc-800 rounded-[32px] flex flex-col backdrop-blur-md overflow-hidden shadow-2xl relative"
              >
                {/* Chat Head */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-950/20">
                      <Bot size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-none mb-1">Xiaozhi AI Context</p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em] leading-none">Vortex Brain Active</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={toggleMicTest}
                      className={`p-2.5 rounded-xl transition-all flex items-center gap-3 ${
                        isMicTesting ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                      title="Test Microphone"
                    >
                      <div className="relative">
                        {isMicTesting ? <Waves className="animate-pulse" size={20} /> : <Mic2 size={20} />}
                        {isMicTesting && (
                          <div className="absolute -bottom-1 -left-1 -right-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-white"
                              animate={{ width: `${micLevel}%` }}
                            />
                          </div>
                        )}
                      </div>
                      {isMicTesting && <span className="text-xs font-bold font-mono min-w-[3ch]">{micLevel}%</span>}
                    </button>

                    <button 
                      onClick={() => setIsVoiceRecognitionActive(!isVoiceRecognitionActive)}
                      className={`p-2.5 rounded-xl transition-all ${
                        isVoiceRecognitionActive ? 'bg-blue-600/20 text-blue-400' : 'bg-zinc-800 text-zinc-600'
                      }`}
                      title={isVoiceRecognitionActive ? "Voice Commands: ON" : "Voice Commands: OFF"}
                    >
                      {isVoiceRecognitionActive ? <Mic2 size={20} /> : <MicOff size={20} />}
                    </button>

                    <div className="h-6 w-[1px] bg-zinc-800 mx-1" />

                    <button 
                      onClick={() => setShowPromptEditor(!showPromptEditor)}
                      className={`p-2.5 rounded-xl transition-all ${showPromptEditor ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/20' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                      title="AI Personality"
                    >
                      <Wand2 size={20} />
                    </button>
                    <button className="p-2.5 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
                      <History size={20} />
                    </button>
                  </div>
                </div>

                {/* Prompt Editor Overlay */}
                <AnimatePresence>
                  {showPromptEditor && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-zinc-800/80 border-b border-zinc-700/50 overflow-hidden"
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Global Personality Instruction</h4>
                          <button 
                            onClick={() => setSystemPrompt('Bạn là một trợ lý ảo thông minh cho loa Phicomm R1. Hãy trả lời ngắn gọn, lịch sự và thân thiện.')}
                            className="text-[10px] text-orange-500 font-bold uppercase hover:underline tracking-tighter"
                          >
                            Reset to Default
                          </button>
                        </div>
                        <textarea 
                          value={systemPrompt}
                          onChange={(e) => setSystemPrompt(e.target.value)}
                          className="w-full bg-black/40 border border-zinc-700 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-orange-500 outline-none text-zinc-300 min-h-[100px] resize-none transition-all placeholder:text-zinc-700"
                          placeholder="Describe the AI's role and tone..."
                        />
                        <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                          <ShieldCheck size={12} />
                          <span>This setting will be included in every AI request header.</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                      <MessageSquare size={48} className="mb-4" />
                      <p className="font-bold text-lg">Test the Speaker's Brain</p>
                      <p className="text-sm max-w-[280px]">Type a command to see how Gemini will respond on your Phicomm R1.</p>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-5 py-3 rounded-2xl ${
                        m.role === 'user' 
                          ? 'bg-zinc-100 text-black font-medium' 
                          : 'bg-zinc-800 border border-zinc-700/50 text-zinc-200'
                      }`}>
                        <p className="text-sm leading-relaxed">{m.text}</p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-800 border border-zinc-700/50 px-4 py-2 rounded-full flex gap-1 items-center">
                        <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" />
                        <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <form onSubmit={handleChat} className="p-4 p-8 border-t border-zinc-800 bg-zinc-900/50">
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask the AI speaker..."
                      className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all placeholder:text-zinc-500"
                    />
                    <button 
                      type="submit"
                      disabled={isTyping}
                      className="absolute right-2 top-2 p-1.5 bg-orange-600 rounded-lg text-white disabled:opacity-50 hover:bg-orange-500 transition-colors"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === 'media' && (
              <motion.div
                key="media"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-5xl mx-auto space-y-8"
              >
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Player & Search Column */}
                  <div className="flex-1 space-y-6">
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-[32px] p-8 backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                          <PlayCircle className="text-white" size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">Media Center</h3>
                          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">SoundCloud • YouTube • Zing MP3</p>
                        </div>
                      </div>

                      {/* Search Bar */}
                      <form onSubmit={performMediaSearch} className="space-y-4">
                        <div className="flex bg-zinc-800/50 p-1 rounded-xl border border-zinc-700/50 mb-4">
                          {[
                            { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500' },
                            { id: 'soundcloud', label: 'SoundCloud', icon: Music, color: 'text-orange-500' },
                            { id: 'zing', label: 'Zing MP3', icon: Music, color: 'text-purple-400' },
                          ].map((src) => (
                            <button
                              key={src.id}
                              type="button"
                              onClick={() => setMediaSource(src.id as any)}
                              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                                mediaSource === src.id 
                                  ? 'bg-zinc-700 text-white shadow-lg' 
                                  : 'text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              <src.icon className={mediaSource === src.id ? src.color : 'text-current'} size={14} />
                              {src.label}
                            </button>
                          ))}
                        </div>
                        
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                          <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search on ${mediaSource.charAt(0).toUpperCase() + mediaSource.slice(1)}...`}
                            className="w-full bg-zinc-800/80 border border-zinc-700 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
                          />
                          <button 
                            type="submit"
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                          >
                            Search
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Results */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest pl-2">
                        {isSearchingMedia ? 'Searching...' : searchResults.length > 0 ? 'Search Results' : 'Trending Now'}
                      </h4>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {(searchResults.length > 0 ? searchResults : mockTracks).map((track) => (
                          <div 
                            key={track.id} 
                            className="bg-zinc-900/40 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between hover:border-zinc-700 transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-xl overflow-hidden relative shrink-0">
                                <img src={track.cover} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                                <button 
                                  onClick={() => playMediaTrack(track)}
                                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <PlayCircle className="text-white" size={24} />
                                </button>
                              </div>
                              <div>
                                <h5 className="font-bold text-sm leading-tight mb-0.5">{track.title}</h5>
                                <p className="text-xs text-zinc-500 font-medium">{track.artist}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 uppercase font-bold border border-zinc-700/50">
                                    {track.source}
                                  </span>
                                  <span className="text-[10px] text-zinc-600 font-mono italic">
                                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                                  </span>
                                </div>
                              </div>
                            </div>
                             <div className="flex items-center gap-1.5 shrink-0">
                              <button 
                                onClick={() => addToQueue(track)}
                                className="p-2 bg-zinc-800 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
                                title="Add to Queue"
                              >
                                <Plus size={16} />
                              </button>
                              <button 
                                onClick={() => playMediaTrack(track)}
                                className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Play size={16} fill="currentColor" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Now Playing Sidebar */}
                  <div className="w-full md:w-80 shrink-0 space-y-6">
                    <div className="bg-gradient-to-b from-zinc-900/60 to-black/60 border border-zinc-800 rounded-[40px] p-6 shadow-2xl sticky top-8">
                      <div className="aspect-square rounded-3xl bg-zinc-800 mb-6 overflow-hidden shadow-2xl relative group/cover">
                        {currentTrack ? (
                          <img src={currentTrack.cover} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-3">
                            <Music size={64} strokeWidth={1} />
                            <p className="text-xs font-bold uppercase tracking-widest">No Media Playing</p>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/cover:opacity-100 transition-opacity flex justify-center gap-4">
                           <button className="p-2 bg-white/10 rounded-full blur-md absolute inset-0" />
                           <div className="flex items-center gap-4 relative">
                              <button className="text-white/60 hover:text-white"><SkipBack size={20} /></button>
                              <button className="text-white/60 hover:text-white"><SkipForward size={20} /></button>
                           </div>
                        </div>
                      </div>

                      <div className="text-center mb-8">
                        <h4 className="text-lg font-bold truncate px-2">{currentTrack?.title || 'Phicomm R1 Ready'}</h4>
                        <p className="text-sm text-zinc-500 font-medium">{currentTrack?.artist || 'Select a track to start'}</p>
                      </div>

                      {/* Loop/Shuffle Controls */}
                      <div className="flex justify-center gap-4 mb-8">
                        <button 
                          onClick={() => setIsShuffle(!isShuffle)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                            isShuffle ? 'bg-red-600/10 border-red-500 text-red-500' : 'bg-zinc-800/50 border-zinc-700 text-zinc-500'
                          }`}
                        >
                          <Shuffle size={12} />
                          Shuffle
                        </button>
                        <button 
                          onClick={() => {
                            const next: any = { none: 'all', all: 'one', one: 'none' };
                            setRepeatMode(next[repeatMode]);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                            repeatMode !== 'none' ? 'bg-red-600/10 border-red-500 text-red-500' : 'bg-zinc-800/50 border-zinc-700 text-zinc-500'
                          }`}
                        >
                          <Repeat size={12} />
                          Repeat {repeatMode === 'one' ? '(1)' : repeatMode === 'all' ? '(All)' : ''}
                        </button>
                      </div>

                      {/* Timeline */}
                      <div className="space-y-2 mb-8">
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden relative">
                          <motion.div 
                            className="h-full bg-red-600" 
                            initial={{ width: '0%' }}
                            animate={{ width: currentTrack ? `${(trackProgress / currentTrack.duration) * 100}%` : '0%' }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                          <span>{Math.floor(trackProgress / 60)}:{(trackProgress % 60).toString().padStart(2, '0')}</span>
                          <span>{currentTrack ? `${Math.floor(currentTrack.duration / 60)}:${(currentTrack.duration % 60).toString().padStart(2, '0')}` : '00:00'}</span>
                        </div>
                      </div>

                      {/* Main Controls */}
                      <div className="flex items-center justify-center gap-6 mb-8">
                        <button className="text-zinc-500 hover:text-white transition-colors"><SkipBack size={24} /></button>
                        <button 
                          onClick={() => setIsMediaPlaying(!isMediaPlaying)}
                          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                            isMediaPlaying ? 'bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.3)]' : 'bg-white text-black hover:scale-105'
                          }`}
                        >
                          {isMediaPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                        </button>
                        <button className="text-zinc-500 hover:text-white transition-colors"><SkipForward size={24} /></button>
                      </div>

                      {/* Volume */}
                      <div className="flex items-center gap-3 px-2 mb-4">
                        <Volume2 size={16} className="text-zinc-500" />
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={mediaVolume}
                          onChange={(e) => setMediaVolume(parseInt(e.target.value))}
                          className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                        <span className="text-[10px] font-mono text-zinc-500 w-8">{mediaVolume}%</span>
                      </div>

                      {/* Queue Section */}
                      <div className="border-t border-zinc-800 pt-6 mt-6">
                        <div className="flex items-center justify-between mb-4 px-2">
                          <h5 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                            <ListMusic size={14} className="text-red-500" />
                            Up Next
                          </h5>
                          <div className="flex items-center gap-2">
                            {mediaQueue.length > 0 && (
                              <button 
                                onClick={() => setMediaQueue([])}
                                className="text-[9px] text-zinc-600 hover:text-red-400 font-bold uppercase tracking-widest transition-colors mr-2"
                              >
                                Clear All
                              </button>
                            )}
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-bold">
                              {mediaQueue.length} Tracks
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                          {mediaQueue.length > 0 ? (
                            mediaQueue.map((track, index) => (
                              <div key={track.id} className="group/queue flex items-center gap-3 p-2 rounded-xl bg-zinc-800/10 border border-transparent hover:border-zinc-800 hover:bg-zinc-800/20 transition-all">
                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                                  <img src={track.cover} alt="alt" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-bold truncate leading-tight">{track.title}</p>
                                  <p className="text-[9px] text-zinc-500 truncate">{track.artist}</p>
                                </div>
                                <div className="flex flex-col gap-0.5 opacity-0 group-hover/queue:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => moveInQueue(index, 'up')}
                                    disabled={index === 0}
                                    className="p-0.5 text-zinc-600 hover:text-zinc-300 disabled:opacity-0"
                                  >
                                    <ChevronUp size={12} />
                                  </button>
                                  <button 
                                    onClick={() => moveInQueue(index, 'down')}
                                    disabled={index === mediaQueue.length - 1}
                                    className="p-0.5 text-zinc-600 hover:text-zinc-300 disabled:opacity-0"
                                  >
                                    <ChevronDown size={12} />
                                  </button>
                                </div>
                                <button 
                                  onClick={() => removeFromQueue(index)}
                                  className="p-1.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover/queue:opacity-100 transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="py-8 text-center bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800/50">
                              <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest px-4">Queue is empty. Add some tracks!</p>
                            </div>
                          )}
                        </div>
                        
                        {mediaQueue.length > 0 && (
                          <button 
                            onClick={playNext}
                            className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-all"
                          >
                            <Play size={12} fill="currentColor" />
                            Play Next in Queue
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 text-center">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-3">Target Output</p>
                      <button 
                        onClick={() => setActiveTab('bluetooth')}
                        className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition-all"
                      >
                        <Network size={14} />
                        {btGroups.length > 0 ? btGroups[0].name : btDevices.find(d => d.connected)?.name || 'Internal Speaker'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'bluetooth' && (
              <motion.div
                key="bluetooth"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto space-y-12"
              >
                {/* Wi-Fi Section */}
                <section className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-2xl font-bold flex items-center gap-2">
                        <Wifi className="text-emerald-400" />
                        Wi-Fi Configuration
                      </h3>
                      <p className="text-zinc-500 text-sm">Manage network connectivity for your Phicomm R1 Hub</p>
                    </div>
                    <button 
                      onClick={startWifiScan}
                      disabled={isScanningWifi}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-900/20"
                    >
                      {isScanningWifi ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={18} />
                          Scan Networks
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {wifiNetworks.map((net) => (
                      <div 
                        key={net.ssid}
                        className={`bg-zinc-900/40 border p-5 rounded-2xl flex items-center justify-between transition-all group ${
                          net.connected ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            net.connected ? 'bg-emerald-500/20' : 'bg-zinc-800'
                          }`}>
                            <Wifi size={20} className={net.connected ? 'text-emerald-400' : 'text-zinc-500'} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{net.ssid}</span>
                              {net.connected && (
                                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-emerald-500/30">Active</span>
                              )}
                              {net.secure ? (
                                <Lock size={12} className="text-zinc-600" title="Secure Network" />
                              ) : (
                                <Unlock size={12} className="text-orange-500/50" title="Open Network" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                              <span>Signal: {net.strength}%</span>
                              <span className="w-1 h-1 rounded-full bg-zinc-800" />
                              <span>{net.secure ? 'WPA2 Personal' : 'Open Network'}</span>
                            </div>
                          </div>
                        </div>

                        {net.connected ? (
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                            <Check size={14} />
                            Connected
                          </div>
                        ) : (
                          <button 
                            onClick={() => setConnectingWifi(net.ssid)}
                            className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-zinc-200"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Password Entry Modal-like Overlay (Simplified) */}
                  {connectingWifi && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-zinc-900 border border-zinc-700 p-6 rounded-3xl space-y-4 shadow-2xl relative z-10"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
                          <Lock size={18} />
                          Join "{connectingWifi}"
                        </h4>
                        <button onClick={() => setConnectingWifi(null)} className="text-zinc-500 hover:text-white">
                          <X size={20} />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <input 
                          type="password" 
                          value={wifiPassword}
                          onChange={(e) => setWifiPassword(e.target.value)}
                          placeholder="Network Password"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                        <div className="flex gap-3">
                          <button 
                            onClick={() => setConnectingWifi(null)}
                            className="flex-1 py-3 text-zinc-400 font-bold hover:text-white"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => connectToWifi(connectingWifi)}
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-950/20"
                          >
                            Connect Now
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </section>

                <div className="h-px bg-zinc-800 w-full" />

                {/* Bluetooth Section */}
                <section className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-2xl font-bold flex items-center gap-2">
                        <Bluetooth className="text-blue-400" />
                        Bluetooth Peripherals
                      </h3>
                      <p className="text-zinc-500 text-sm">Scan and manage wireless peripherals for Phicomm R1</p>
                    </div>
                  <button 
                    onClick={startScan}
                    disabled={isScanning}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-blue-900/20"
                  >
                    {isScanning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <BluetoothSearching size={18} />
                        Scan for Devices
                      </>
                    )}
                  </button>
                </div>

                  <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.2em] pl-1">Connection Status</label>
                      <div className="flex gap-1 bg-zinc-800/50 p-1 rounded-xl border border-zinc-800">
                        {(['all', 'connected', 'disconnected'] as const).map(status => (
                          <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all ${
                              statusFilter === status 
                                ? 'bg-zinc-700 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.2em] pl-1">Device Category</label>
                      <div className="flex gap-1 bg-zinc-800/50 p-1 rounded-xl border border-zinc-800">
                        {(['all', 'audio', 'input', 'other'] as const).map(type => (
                          <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={`px-4 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all ${
                              typeFilter === type 
                                ? 'bg-zinc-700 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {(() => {
                      const filtered = btDevices
                        .filter(d => statusFilter === 'all' || (statusFilter === 'connected' ? d.connected : !d.connected))
                        .filter(d => typeFilter === 'all' || d.type === typeFilter);

                      if (filtered.length === 0 && btDevices.length > 0) {
                        return (
                          <div className="text-center py-12 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
                            <BluetoothOff className="text-zinc-600 mx-auto mb-4" size={32} />
                            <h4 className="text-lg font-bold text-zinc-400">No devices match your filters</h4>
                            <button 
                              onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }}
                              className="mt-4 text-blue-400 hover:text-blue-300 font-bold transition-colors"
                            >
                              Clear all filters
                            </button>
                          </div>
                        );
                      }

                      return filtered.map((device) => (
                        <div 
                          key={device.id}
                          className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between hover:border-zinc-700 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              device.connected ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-zinc-800 border border-zinc-700'
                            }`}>
                              {device.connected ? (
                                <BluetoothConnected className="text-emerald-400" size={24} />
                              ) : (
                                <BluetoothOff className="text-zinc-500" size={24} />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {editingId === device.id ? (
                                  <div className="flex items-center gap-2 flex-1">
                                    <input
                                      autoFocus
                                      type="text"
                                      value={tempName}
                                      onChange={(e) => setTempName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          setBtDevices(prev => prev.map(d => d.id === device.id ? { ...d, name: tempName } : d));
                                          setEditingId(null);
                                        } else if (e.key === 'Escape') {
                                          setEditingId(null);
                                        }
                                      }}
                                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm font-bold w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <button
                                      onClick={() => {
                                        setBtDevices(prev => prev.map(d => d.id === device.id ? { ...d, name: tempName } : d));
                                        setEditingId(null);
                                      }}
                                      className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded"
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button
                                      onClick={() => setEditingId(null)}
                                      className="p-1 hover:bg-red-500/20 text-red-400 rounded"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="font-bold text-lg">{device.name}</span>
                                    <button
                                      onClick={() => {
                                        setEditingId(device.id);
                                        setTempName(device.name);
                                      }}
                                      className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    {device.connected ? (
                                      <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold px-2 py-1 rounded border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Connected
                                      </span>
                                    ) : (
                                      <span className="bg-zinc-800/50 text-zinc-500 text-[10px] uppercase font-bold px-2 py-1 rounded border border-zinc-700/50">
                                        Disconnected
                                      </span>
                                    )}
                                    {device.id === '1' && (
                                      <span className="bg-orange-500/10 text-orange-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-orange-500/20">System</span>
                                    )}
                                    {device.profileId && (
                                      <span className="flex items-center gap-1 bg-zinc-800 text-zinc-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-zinc-700">
                                        <BookMarked size={10} />
                                        {profiles.find(p => p.id === device.profileId)?.name}
                                      </span>
                                    )}
                                    {btGroups.filter(g => g.deviceIds.includes(device.id)).map(group => (
                                      <span key={group.id} className="flex items-center gap-1 bg-blue-500/10 text-blue-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-blue-500/20">
                                        <Users size={10} />
                                        {group.name}
                                      </span>
                                    ))}
                                    {device.connected && (
                                      <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 bg-zinc-800 text-zinc-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-zinc-700">
                                          <Battery size={10} className={(device.batteryLevel ?? 85) < 20 ? 'text-red-500' : 'text-emerald-500'} />
                                          {device.batteryLevel ?? 85}%
                                        </span>
                                        <span className="flex items-center gap-1 bg-zinc-800 text-zinc-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-zinc-700">
                                          {device.codec ?? 'AAC'}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium">
                                <span className="uppercase tracking-widest">{device.type || 'Generic'}</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                {device.pairingStatus === 'failed' ? (
                                  <span className="text-red-500 uppercase font-bold tracking-tighter">Pairing Failed</span>
                                ) : device.pairingStatus === 'pairing' ? (
                                  <span className="text-blue-400 uppercase font-bold tracking-tighter animate-pulse">
                                    {verifyingId === device.id && pairingPin ? 'Verifying PIN Security' : 'Establishing Secure Pair...'}
                                  </span>
                                ) : device.pairingStatus === 'none' ? (
                                  <span className="uppercase">Ready to Pair</span>
                                ) : (
                                  <span className="text-emerald-500 uppercase font-bold tracking-tighter">Paired</span>
                                )}
                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                <span>ID: {device.id}</span>
                                {device.rssi && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                    <span>Signal: {device.rssi}dBm</span>
                                  </>
                                )}
                              </div>

                              {/* Audio Output Settings */}
                              {device.connected && device.type === 'audio' && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Volume2 size={12} className="text-zinc-500" />
                                  <span className="text-[10px] text-zinc-500 font-bold uppercase mr-1">Output:</span>
                                  <div className="flex bg-zinc-800/50 p-0.5 rounded-lg border border-zinc-700/50">
                                    {(['standard', 'enhanced', 'mono'] as const).map((mode) => (
                                      <button
                                        key={mode}
                                        onClick={() => {
                                          setBtDevices(prev => prev.map(d => d.id === device.id ? { ...d, audioOutput: mode } : d));
                                        }}
                                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all ${
                                          device.audioOutput === mode 
                                            ? 'bg-zinc-700 text-white shadow-sm' 
                                            : 'text-zinc-500 hover:text-zinc-400'
                                        }`}
                                      >
                                        {mode}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Playback & Volume Control */}
                              {device.connected && device.type === 'audio' && (
                                <div className="flex items-center gap-4 mt-3 bg-zinc-800/30 p-2 rounded-xl border border-zinc-700/30">
                                  <button 
                                    onClick={() => setBtDevices(prev => prev.map(d => d.id === device.id ? { ...d, isPlaying: !d.isPlaying } : d))}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                      device.isPlaying ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/20' : 'bg-zinc-700 text-zinc-400 hover:text-white'
                                    }`}
                                  >
                                    {device.isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                                  </button>
                                  
                                  <div className="flex-1 flex items-center gap-2 relative group/vol">
                                    <Volume2 size={14} className={btGroups.some(g => g.deviceIds.includes(device.id)) ? 'text-blue-400' : 'text-zinc-500'} />
                                    <input 
                                      type="range"
                                      min="0"
                                      max="100"
                                      value={device.volume || 0}
                                      onChange={(e) => {
                                        const newVol = parseInt(e.target.value);
                                        setBtDevices(prev => prev.map(d => d.id === device.id ? { ...d, volume: newVol } : d));
                                      }}
                                      className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                    />
                                    {btGroups.some(g => g.deviceIds.includes(device.id)) && (
                                      <div className="absolute -top-6 left-0 right-0 flex justify-center opacity-0 group-hover/vol:opacity-100 transition-opacity pointer-events-none">
                                        <span className="bg-blue-600 text-[8px] px-1.5 py-0.5 rounded-full font-bold text-white uppercase tracking-tighter">Volume Synced</span>
                                      </div>
                                    )}
                                    <span className="text-[10px] font-mono text-zinc-500 w-6">{device.volume}%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {device.pairingStatus === 'pairing' ? (
                              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg text-xs font-bold text-blue-400">
                                <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                                Pairing...
                              </div>
                            ) : device.pairingStatus === 'failed' ? (
                              <button
                                onClick={() => pairDevice(device.id)}
                                className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all"
                              >
                                Retry Pairing
                              </button>
                            ) : device.pairingStatus === 'none' ? (
                              <button
                                onClick={() => pairDevice(device.id)}
                                className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all"
                              >
                                Pair Device
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleConnection(device.id)}
                                className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${
                                  device.connected 
                                    ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white' 
                                    : 'bg-white text-black hover:bg-zinc-200 shadow-lg'
                                }`}
                              >
                                {device.connected ? 'Disconnect' : 'Connect'}
                              </button>
                            )}
                            {device.pairingStatus === 'paired' && device.connected && (
                              <button 
                                onClick={() => {
                                  setShowProfileCreator(device.id);
                                  setNewProfileName(`${device.name} Profile`);
                                  setNewProfileAudio(device.audioOutput || 'standard');
                                  setNewProfileAutoConnect(true);
                                  setNewProfileAutoReconnect(false);
                                }}
                                className="p-2 text-zinc-600 hover:text-orange-400 transition-colors opacity-0 group-hover:opacity-100"
                                title="Save as Profile"
                              >
                                <Save size={18} />
                              </button>
                            )}
                            {device.id !== '1' && (
                              <button 
                                onClick={() => removeDevice(device.id)}
                                className="p-2 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      ));
                    })()}

                  {btDevices.length === 0 && !isScanning && (
                    <div className="text-center py-12 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
                      <div className="inline-flex w-16 h-16 rounded-full bg-zinc-800 items-center justify-center mb-4">
                        <BluetoothOff className="text-zinc-500" size={32} />
                      </div>
                      <h4 className="text-lg font-bold">No Bluetooth Devices Found</h4>
                      <p className="text-zinc-500 max-w-xs mx-auto mt-2">Make sure your peripheral is in pairing mode and nearby.</p>
                      <button 
                        onClick={startScan}
                        className="mt-6 text-blue-400 hover:text-blue-300 font-bold flex items-center justify-center gap-2 mx-auto"
                      >
                        <Plus size={18} />
                        Try scanning again
                      </button>
                    </div>
                  )}
                </div>

                {/* PIN Verification Overlay */}
                {pairingPin && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-zinc-900 border border-zinc-700 p-8 rounded-[40px] max-w-md w-full space-y-8 shadow-2xl text-center relative overflow-hidden"
                    >
                      {/* Background Detail */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 animate-pulse" />

                      <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-900/10">
                          <ShieldCheck className="text-blue-400" size={40} />
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold">Secure Pair Request</h4>
                          <p className="text-zinc-500 text-sm mt-2 max-w-[280px] mx-auto">
                            Check the display on <strong>{btDevices.find(d => d.id === verifyingId)?.name}</strong> and confirm the code match.
                          </p>
                        </div>
                      </div>

                      <div className="bg-black/40 border border-zinc-800 rounded-3xl p-8 relative flex flex-col items-center">
                        <span className="text-5xl font-mono font-bold tracking-[0.4em] text-white pl-[0.4em]">
                          {pairingPin}
                        </span>
                        <div className="mt-4 flex gap-1">
                          {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500/30" />
                          ))}
                        </div>
                      </div>

                      {/* Dynamic Pairing Logs */}
                      <div className="bg-zinc-800/30 rounded-2xl p-4 text-left border border-zinc-700/30">
                        <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-3 flex items-center gap-2">
                          <Terminal size={12} />
                          Pairing Sequence
                        </p>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                          {pairingLogs.map((log, idx) => (
                            <div key={idx} className="flex gap-2 text-[11px]">
                              <span className="text-blue-500 font-mono mt-0.5">[{idx + 1}]</span>
                              <span className={idx === pairingLogs.length - 1 ? 'text-zinc-200 font-bold' : 'text-zinc-500'}>
                                {log}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4 pt-2">
                        <button 
                          onClick={() => confirmPairing(false)}
                          className="flex-1 px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl font-bold transition-all border border-zinc-700/50"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => confirmPairing(true)}
                          className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/30"
                        >
                          Confirm & Bind
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Profile Creator Overlay */}
                {showProfileCreator && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-zinc-900 border border-zinc-700 p-6 rounded-3xl space-y-4 shadow-2xl relative z-10"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold flex items-center gap-2">
                        <Save className="text-orange-500" />
                        Create Connection Profile
                      </h4>
                      <button onClick={() => setShowProfileCreator(null)} className="text-zinc-500 hover:text-white">
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Profile Name</label>
                        <input 
                          type="text" 
                          value={newProfileName}
                          onChange={(e) => setNewProfileName(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 focus:ring-1 focus:ring-orange-500 outline-none"
                          placeholder="e.g. Morning Focus"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Target Device</label>
                        <select 
                          value={showProfileCreator}
                          onChange={(e) => setShowProfileCreator(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 focus:ring-1 focus:ring-orange-500 outline-none h-[42px]"
                        >
                          {btDevices.filter(d => d.pairingStatus === 'paired' || d.id === '1').map(device => (
                            <option key={device.id} value={device.id}>{device.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Audio Output</label>
                        <select 
                          value={newProfileAudio}
                          onChange={(e) => setNewProfileAudio(e.target.value as any)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 focus:ring-1 focus:ring-orange-500 outline-none h-[42px]"
                        >
                          <option value="standard">Standard Stereo</option>
                          <option value="enhanced">Enhanced Bass</option>
                          <option value="mono">Mono (Clear Voice)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-6 py-2 px-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div 
                          onClick={() => setNewProfileAutoConnect(!newProfileAutoConnect)}
                          className={`w-10 h-5 rounded-full transition-all relative ${newProfileAutoConnect ? 'bg-orange-600' : 'bg-zinc-700'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${newProfileAutoConnect ? 'left-6' : 'left-1'}`} />
                        </div>
                        <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200">Auto-Connect on Apply</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div 
                          onClick={() => setNewProfileAutoReconnect(!newProfileAutoReconnect)}
                          className={`w-10 h-5 rounded-full transition-all relative ${newProfileAutoReconnect ? 'bg-emerald-600' : 'bg-zinc-700'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${newProfileAutoReconnect ? 'left-6' : 'left-1'}`} />
                        </div>
                        <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200">Auto-Reconnect</span>
                      </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button 
                        onClick={() => setShowProfileCreator(null)}
                        className="px-4 py-2 text-zinc-400 font-bold hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => saveProfile(showProfileCreator)}
                        className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-orange-950/20"
                      >
                        Save Profile
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Saved Profiles Section */}
                <div className="pt-8 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <BookMarked className="text-orange-500" size={20} />
                      <h4 className="text-lg font-bold tracking-tight">Saved Connection Profiles</h4>
                    </div>
                    <button 
                      onClick={() => {
                        const pairedDevice = btDevices.find(d => d.pairingStatus === 'paired');
                        setShowProfileCreator(pairedDevice?.id || 'manual');
                        setNewProfileName('');
                        setNewProfileAudio('standard');
                        setNewProfileAutoConnect(true);
                        setNewProfileAutoReconnect(false);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-orange-600/10 text-orange-500 hover:bg-orange-600/20 rounded-lg text-xs font-bold transition-all border border-orange-500/20"
                    >
                      <Plus size={14} />
                      New Profile
                    </button>
                  </div>

                  {profiles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profiles.map(profile => (
                        <div key={profile.id} className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700 transition-all flex justify-between items-center group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                              <Volume2 className="text-orange-400" size={18} />
                            </div>
                            <div>
                              <p className="font-bold leading-none mb-1">{profile.name}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
                                  {profile.deviceName} • {profile.audioOutput}
                                </p>
                                {profile.autoReconnect && (
                                  <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold uppercase">
                                    <RefreshCw size={10} className="animate-spin-slow" />
                                    Auto
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => applyProfile(profile)}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-lg transition-colors"
                            >
                              Apply
                            </button>
                            <button 
                              onClick={() => removeProfile(profile.id)}
                              className="p-1.5 text-zinc-600 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl p-8 text-center">
                      <p className="text-zinc-500 text-sm">No saved profiles. Create one to quickly apply settings to your devices.</p>
                    </div>
                  )}
                </div>
                </section>

                <div className="h-px bg-zinc-800 w-full" />

                {/* Audio Groups Section */}
                <section className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="text-blue-500" />
                        Audio Groups
                      </h3>
                      <p className="text-zinc-500 text-sm">Create and synchronize playback across multiple devices</p>
                    </div>
                    <button 
                      onClick={() => setShowGroupCreator(true)}
                      className="flex items-center gap-2 bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg"
                    >
                      <Plus size={18} />
                      Create Group
                    </button>
                  </div>

                  {btGroups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {btGroups.map((group) => (
                        <div key={group.id} className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl space-y-4 hover:border-zinc-700 transition-all relative group">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Users className="text-blue-400" size={20} />
                              </div>
                              <div>
                                {renamingGroupId === group.id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      autoFocus
                                      type="text"
                                      value={tempGroupName}
                                      onChange={(e) => setTempGroupName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          setBtGroups(prev => prev.map(g => g.id === group.id ? { ...g, name: tempGroupName } : g));
                                          setRenamingGroupId(null);
                                        } else if (e.key === 'Escape') {
                                          setRenamingGroupId(null);
                                        }
                                      }}
                                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-sm font-bold w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <button
                                      onClick={() => {
                                        setBtGroups(prev => prev.map(g => g.id === group.id ? { ...g, name: tempGroupName } : g));
                                        setRenamingGroupId(null);
                                      }}
                                      className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"
                                    >
                                      <Check size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 group/name">
                                    <h4 className="font-bold text-lg leading-none">{group.name}</h4>
                                    <button 
                                      onClick={() => {
                                        setRenamingGroupId(group.id);
                                        setTempGroupName(group.name);
                                      }}
                                      className="p-1 text-zinc-600 hover:text-zinc-400 opacity-0 group-hover/name:opacity-100 transition-opacity"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                  </div>
                                )}
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                                  {group.deviceIds.length} Devices Linked
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => startEditGroup(group)}
                                className="p-1.5 text-zinc-600 hover:text-blue-400 transition-colors"
                                title="Edit Group"
                              >
                                <Pencil size={14} />
                              </button>
                              <button 
                                onClick={() => removeGroup(group.id)}
                                className="p-1.5 text-zinc-600 hover:text-red-500 transition-colors"
                                title="Remove Group"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Group-wide Controls */}
                          <div className="flex items-center gap-3 bg-black/30 p-2 rounded-2xl border border-zinc-800/50">
                            <button 
                              onClick={() => toggleGroupPlayback(group.id)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                group.isPlaying ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-zinc-700 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {group.isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                            </button>
                            
                            <div className="flex-1 flex items-center gap-2">
                              <button 
                                onClick={() => adjustGroupVolume(group.id, group.volume === 0 ? 50 : 0)}
                                className="p-1 text-zinc-500 hover:text-white transition-colors"
                              >
                                <Volume2 size={16} className={group.volume === 0 ? 'text-red-500/50' : ''} />
                              </button>
                              <input 
                                type="range"
                                min="0"
                                max="100"
                                value={group.volume}
                                onChange={(e) => adjustGroupVolume(group.id, parseInt(e.target.value))}
                                className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              />
                              <span className="text-xs font-mono text-zinc-400 w-8">{group.volume}%</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {group.deviceIds.map(devId => {
                              const dev = btDevices.find(d => d.id === devId);
                              return (
                                <span key={devId} className="px-2 py-0.5 bg-zinc-800/50 border border-zinc-700/50 rounded-md text-[10px] text-zinc-500 font-medium">
                                  {dev?.name || 'Unknown'}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
                      <div className="inline-flex w-16 h-16 rounded-full bg-zinc-800 items-center justify-center mb-4">
                        <Layers className="text-zinc-500" size={32} />
                      </div>
                      <h4 className="text-lg font-bold text-zinc-300">No Audio Groups</h4>
                      <p className="text-zinc-500 max-w-xs mx-auto mt-2 text-sm">Group multiple speakers to play audio in sync across your Phicomm R1 system.</p>
                    </div>
                  )}

                  {/* Group Creator Modal */}
                  {showGroupCreator && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] max-w-md w-full space-y-6 shadow-2xl"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="text-blue-400" />
                            {editingGroup ? 'Edit Audio Group' : 'Create Audio Group'}
                          </h3>
                          <button 
                            onClick={() => {
                              setShowGroupCreator(false);
                              setEditingGroup(null);
                              setNewGroupName('');
                              setSelectedGroupDevices([]);
                            }} 
                            className="text-zinc-500 hover:text-white"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-zinc-500 tracking-widest pl-1">Group Name</label>
                            <input 
                              type="text" 
                              value={newGroupName}
                              onChange={(e) => setNewGroupName(e.target.value)}
                              placeholder="e.g. Living Room Sync"
                              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-zinc-500 tracking-widest pl-1">Select Devices</label>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                              {btDevices.filter(d => d.connected && d.type === 'audio').length === 0 && (
                                <p className="text-zinc-500 text-xs italic p-4 bg-zinc-800/30 rounded-xl text-center">No connected audio devices found.</p>
                              )}
                              {btDevices.filter(d => d.connected && d.type === 'audio').map(device => (
                                <label key={device.id} className="flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl cursor-pointer hover:bg-zinc-800 transition-all">
                                  <div className="flex items-center gap-3">
                                    <Volume2 size={16} className="text-zinc-500" />
                                    <span className="font-bold text-sm">{device.name}</span>
                                  </div>
                                  <input 
                                    type="checkbox"
                                    checked={selectedGroupDevices.includes(device.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) setSelectedGroupDevices(prev => [...prev, device.id]);
                                      else setSelectedGroupDevices(prev => prev.filter(id => id !== device.id));
                                    }}
                                    className="w-5 h-5 rounded-lg accent-blue-500"
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                          <button 
                            onClick={() => {
                              setShowGroupCreator(false);
                              setEditingGroup(null);
                              setNewGroupName('');
                              setSelectedGroupDevices([]);
                            }}
                            className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-2xl transition-all"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={createGroup}
                            disabled={!newGroupName || selectedGroupDevices.length < 1}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/20"
                          >
                            {editingGroup ? 'Save Changes' : 'Create Group'}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </section>

                <div className="h-px bg-zinc-800 w-full" />

                {/* LED & Visuals Section */}
                <section className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-2xl font-bold flex items-center gap-2">
                        <Palette className="text-pink-500" />
                        LED Ring Visualizer
                      </h3>
                      <p className="text-zinc-500 text-sm">Control the R1 hardware LED ring array colors and behavior</p>
                    </div>
                  </div>

                  <div className="bg-zinc-900/60 border border-zinc-800 p-8 rounded-[32px] space-y-8">
                    <div className="grid grid-cols-3 gap-4">
                      {/* LED Modes */}
                      {(['off', 'on', 'music'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setLedMode(mode)}
                          className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${
                            ledMode === mode 
                              ? 'bg-pink-600/10 border-pink-500/50 text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.15)]' 
                              : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                          }`}
                        >
                          {mode === 'off' && <Sun size={24} className="opacity-50" />}
                          {mode === 'on' && <Sun size={24} fill="currentColor" />}
                          {mode === 'music' && <Activity size={24} />}
                          <span className="text-xs uppercase font-bold tracking-widest">
                            {mode === 'on' ? 'Solid' : mode === 'music' ? 'Pulsing' : 'Disabled'}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className={`space-y-6 transition-opacity duration-300 ${ledMode === 'off' ? 'opacity-30 pointer-events-none' : ''}`}>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm font-bold text-zinc-300">
                          <span>Base Color</span>
                          <span className="font-mono text-xs px-2 py-1 bg-zinc-800 rounded-md text-pink-400">{ledColor.toUpperCase()}</span>
                        </div>
                        <div className="flex gap-4 items-center">
                          <input 
                            type="color" 
                            value={ledColor} 
                            onChange={(e) => setLedColor(e.target.value)}
                            className="w-12 h-12 rounded-xl cursor-pointer bg-zinc-800 border-0 p-1"
                          />
                          <div className="flex-1 grid grid-cols-7 gap-2">
                            {['#ea580c', '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#ffffff'].map(preset => (
                              <button
                                key={preset}
                                onClick={() => setLedColor(preset)}
                                className={`h-10 rounded-lg transition-transform hover:scale-105 border-2 ${
                                  ledColor === preset ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: preset }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {ledMode === 'music' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm font-bold text-zinc-300">
                            <span>Effect Speed / Cycle Duration</span>
                            <span className="font-mono text-xs">{ledDuration}ms</span>
                          </div>
                          <input 
                            type="range"
                            min="500"
                            max="5000"
                            step="100"
                            value={ledDuration}
                            onChange={(e) => setLedDuration(parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                          />
                          <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                            <span>Fast</span>
                            <span>Slow</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <div className="bg-blue-600/5 border border-blue-500/20 p-6 rounded-3xl mt-8 flex gap-4 items-start">
                  <ShieldCheck className="text-blue-400 shrink-0 mt-1" size={24} />
                  <div>
                    <h5 className="font-bold text-blue-400 mb-1">Security Note</h5>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Bluetooth pairing on Phicomm R1 Hub is handled via secure legacy pairing or SSP (Secure Simple Pairing) 
                      depending on your peripheral's capabilities. Ensure you verify the PIN on the device if prompted.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'casting' && (
              <motion.div
                key="casting"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Streaming Services</h2>
                    <p className="text-zinc-500">Manage AirPlay and DLNA protocols for your speaker.</p>
                  </div>
                  <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-[24px] border border-zinc-800">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest leading-none mb-1">Broadcasting as</p>
                      <p className="font-bold text-zinc-200">{castingName}</p>
                    </div>
                    <button 
                      onClick={() => setShowNamingModal(true)}
                      className="p-3 bg-zinc-800 hover:bg-zinc-700 text-blue-400 rounded-xl transition-all"
                    >
                      <Pencil size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* AirPlay Card */}
                  <div className={`p-8 rounded-[40px] border transition-all duration-500 ${
                    airplayStatus ? 'bg-zinc-900/40 border-blue-500/30' : 'bg-zinc-900/10 border-zinc-800 grayscale'
                  }`}>
                    <div className="flex items-start justify-between mb-8">
                      <div className={`p-4 rounded-2xl ${airplayStatus ? 'bg-blue-600/10 text-blue-400' : 'bg-zinc-800 text-zinc-600'}`}>
                        <Airplay size={32} />
                      </div>
                      <div className="flex flex-col items-end">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={airplayStatus} onChange={() => setAirplayStatus(!airplayStatus)} className="sr-only peer" />
                          <div className="w-14 h-8 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                        </label>
                        <span className={`text-[10px] font-bold uppercase mt-2 ${airplayStatus ? 'text-blue-400' : 'text-zinc-600'}`}>
                          {airplayStatus ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-2">Apple AirPlay 2</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                      Stream audio from your iPhone, iPad, or Mac directly to your Phicomm R1. 
                      Supports lossless audio and multi-room synchronization.
                    </p>
                    
                    {airplayStatus && (
                      <div className="space-y-4">
                        <div className="p-4 bg-zinc-800/30 rounded-2xl border border-zinc-700/30 flex items-center justify-between">
                          <span className="text-xs text-zinc-500 font-bold uppercase">Target Host</span>
                          <span className="text-sm font-mono text-zinc-300">{castingName}.local</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-400/60 font-medium">
                          <Check size={14} />
                          Compatible with iOS 11.4+
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DLNA Card */}
                  <div className={`p-8 rounded-[40px] border transition-all duration-500 ${
                    dlnaStatus ? 'bg-zinc-900/40 border-orange-500/30' : 'bg-zinc-900/10 border-zinc-800 grayscale'
                  }`}>
                    <div className="flex items-start justify-between mb-8">
                      <div className={`p-4 rounded-2xl ${dlnaStatus ? 'bg-orange-600/10 text-orange-400' : 'bg-zinc-800 text-zinc-600'}`}>
                        <MonitorPlay size={32} />
                      </div>
                      <div className="flex flex-col items-end">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={dlnaStatus} onChange={() => setDlnaStatus(!dlnaStatus)} className="sr-only peer" />
                          <div className="w-14 h-8 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600 peer-checked:after:bg-white"></div>
                        </label>
                        <span className={`text-[10px] font-bold uppercase mt-2 ${dlnaStatus ? 'text-orange-400' : 'text-zinc-600'}`}>
                          {dlnaStatus ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-2">DLNA / UPnP</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                      Industry standard media sharing protocol. Cast music from Android apps, 
                      Windows Media Player, and NAS servers like Synology or Plex.
                    </p>
                    
                    {dlnaStatus && (
                      <div className="space-y-4">
                        <div className="p-4 bg-zinc-800/30 rounded-2xl border border-zinc-700/30 flex items-center justify-between">
                          <span className="text-xs text-zinc-500 font-bold uppercase">Discovery</span>
                          <span className="text-sm font-mono text-zinc-300">mDNS / SSDP</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-orange-400/60 font-medium">
                          <Check size={14} />
                          Open Standard Protocol
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] flex gap-6 items-start">
                  <div className="p-3 bg-zinc-800 rounded-2xl text-zinc-400">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-2">Protocol Priority</h4>
                    <p className="text-sm text-zinc-500 leading-relaxed max-w-2xl">
                      When multiple streams are initiated (e.g. AirPlay starts while Bluetooth is playing), 
                      the R1 system prioritizes <strong className="text-zinc-300">AirPlay</strong> &gt; <strong className="text-zinc-300">Bluetooth</strong> &gt; <strong className="text-zinc-300">DLNA</strong>. You can change 
                      this priority in the Advanced Settings under Setup Guide.
                    </p>
                  </div>
                </div>

                {/* Naming Modal */}
                <AnimatePresence>
                  {showNamingModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowNamingModal(false)}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[40px] p-8 relative z-10"
                      >
                        <h3 className="text-2xl font-bold mb-2">Broadcast Identity</h3>
                        <p className="text-sm text-zinc-500 mb-8">This name will appear on your phone when selecting a playback device.</p>
                        
                        <div className="space-y-4 mb-8">
                          <div className="relative">
                            <MonitorPlay className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input 
                              type="text" 
                              value={castingName}
                              onChange={(e) => setCastingName(e.target.value)}
                              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-12 py-4 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <button 
                            onClick={() => setShowNamingModal(false)}
                            className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold rounded-2xl transition-all"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => setShowNamingModal(false)}
                            className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/20"
                          >
                            Update Name
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'smarthome' && (
              <motion.div
                key="smarthome"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                {/* Integration Status Hub */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 flex flex-col md:flex-row gap-8 items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                      <Home className="text-purple-500" />
                      Smart Home Control
                    </h3>
                    <p className="text-zinc-500 text-sm">Integrate with Home Assistant or via raw MQTT. Allows voice commands like "Turn off the lights".</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button 
                      onClick={() => {
                        setMqttStatus('connecting');
                        setTimeout(() => {
                          setMqttStatus(prev => prev === 'connected' ? 'disconnected' : 'connected');
                          setSmarthomeEnabled(prev => !prev);
                        }, 1500);
                      }}
                      className={`px-8 py-4 rounded-xl font-bold transition-all ${
                        mqttStatus === 'connected' ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20' 
                        : mqttStatus === 'connecting' ? 'bg-zinc-700 text-zinc-300 cursor-wait' 
                        : 'bg-zinc-800 text-purple-400 hover:bg-zinc-700 border border-purple-500/30'
                      }`}
                    >
                      {mqttStatus === 'connected' ? 'Connected to HASS' : mqttStatus === 'connecting' ? 'Negotiating...' : 'Enable Integration'}
                    </button>
                    {mqttStatus === 'connected' && (
                      <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Broker Online
                      </span>
                    )}
                  </div>
                </div>

                {/* Device Mappings Grid */}
                <div className={`transition-all duration-500 ${!smarthomeEnabled ? 'opacity-30 pointer-events-none' : ''}`}>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 px-2">Voice-Mapped Devices</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {smartDevices.map(device => (
                      <div key={device.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all flex flex-col justify-between aspect-square group">
                        <div className="flex justify-between items-start">
                          <div className={`p-3 rounded-xl ${device.state === 'on' || device.state === 'open' ? 'bg-purple-500/10 text-purple-400' : 'bg-zinc-800 text-zinc-600'}`}>
                            {device.type === 'light' ? <Lightbulb size={24} /> : device.type === 'climate' ? <Thermometer size={24} /> : <Home size={24} />}
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={device.state === 'on' || device.state === 'open'} 
                              onChange={() => {
                                setSmartDevices(prev => prev.map(d => {
                                  if (d.id === device.id) {
                                    const newState = d.type === 'cover' ? (d.state === 'open' ? 'closed' : 'open') : (d.state === 'on' ? 'off' : 'on');
                                    return { ...d, state: newState };
                                  }
                                  return d;
                                }));
                              }}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white"></div>
                          </label>
                        </div>
                        <div>
                          <p className="font-bold text-lg mb-1">{device.name}</p>
                          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                            {device.state} {device.temp && `• ${device.temp}°C`}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="bg-zinc-900/20 border border-zinc-800 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-zinc-600 hover:text-purple-400 hover:bg-purple-500/5 hover:border-purple-500/30 transition-all cursor-pointer aspect-square gap-3">
                      <Plus size={32} />
                      <span className="text-xs font-bold uppercase tracking-widest">Map New Entity</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'utilities' && (
              <motion.div
                key="utilities"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                {/* Alarms Area */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 space-y-6 shadow-xl">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Bell className="text-yellow-500" />
                      Daily Alarms
                    </h3>
                    <button 
                      onClick={() => setShowAddAlarm(true)}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {alarms.map(alarm => (
                      <div key={alarm.id} className={`p-6 rounded-2xl border transition-all ${alarm.enabled ? 'bg-zinc-800/80 border-zinc-700 shadow-lg' : 'bg-zinc-900/50 border-zinc-800 opacity-60'} group relative`}>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setAlarms(prev => prev.filter(a => a.id !== alarm.id))}
                            className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex justify-between items-center mb-4 pr-10">
                          <span className={`text-4xl font-mono font-bold tracking-tighter ${alarm.enabled ? 'text-zinc-100' : 'text-zinc-600'}`}>{alarm.time}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={alarm.enabled} 
                              onChange={() => {
                                setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, enabled: !a.enabled } : a));
                              }}
                              className="sr-only peer" 
                            />
                            <div className="w-14 h-8 bg-zinc-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-zinc-500 after:border-zinc-400 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-yellow-500 peer-checked:after:bg-yellow-100"></div>
                          </label>
                        </div>
                        <div className="flex items-center gap-2 mb-3 text-sm font-bold text-zinc-400">
                          {alarm.label}
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <button 
                              key={day}
                              onClick={() => {
                                setAlarms(prev => prev.map(a => {
                                  if (a.id === alarm.id) {
                                    const newDays = a.days.includes(day) 
                                      ? a.days.filter(d => d !== day) 
                                      : [...a.days, day];
                                    return { ...a, days: newDays };
                                  }
                                  return a;
                                }));
                              }}
                              className={`text-[10px] px-2 py-1 uppercase font-bold rounded-md transition-colors ${alarm.days.includes(day) ? (alarm.enabled ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-zinc-700 text-zinc-300') : 'text-zinc-600 bg-zinc-800/50 hover:bg-zinc-700'}`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timers Area */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 space-y-6 shadow-xl h-fit">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Timer className="text-cyan-400" />
                      Quick Timers
                    </h3>
                    <button 
                      onClick={() => setShowAddTimer(true)}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {timers.map(timer => (
                      <div key={timer.id} className="p-5 rounded-2xl bg-zinc-800/50 border border-zinc-700 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold">{timer.label}</p>
                            <p className="text-xs text-zinc-500">{timer.duration / 60} minutes</p>
                          </div>
                          <span className={`text-2xl font-mono ${timer.active ? 'text-cyan-400' : 'text-zinc-400'}`}>
                            {Math.floor(timer.remaining / 60).toString().padStart(2, '0')}:{(timer.remaining % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => {
                              setTimers(prev => prev.map(t => {
                                if (t.id === timer.id) {
                                  // If starting from 0 (finished), reset to duration. Else just toggle.
                                  const newRemaining = t.remaining === 0 ? t.duration : t.remaining;
                                  return { ...t, active: !t.active, remaining: newRemaining };
                                }
                                return t;
                              }));
                            }}
                            className={`py-2.5 rounded-xl font-bold text-sm transition-colors ${
                              timer.active 
                                ? 'bg-zinc-600 hover:bg-zinc-500 text-white' 
                                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20'
                            }`}
                          >
                            {timer.active ? 'Pause' : 'Start'}
                          </button>
                          <button 
                            onClick={() => {
                              setTimers(prev => prev.filter(t => t.id !== timer.id));
                            }}
                            className="py-2.5 bg-zinc-900 hover:bg-zinc-800 rounded-xl font-bold text-sm transition-colors text-red-400 border border-zinc-800"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Configuration Guide */}
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      <ShieldCheck className="text-emerald-400" />
                      Configuration Guide
                    </h3>
                    
                    <div className="space-y-4">
                      <Step number="1" title="Get xiaozhi-client-android" desc="Download the latest APK for your Android-based Phicomm R1 speaker." />
                      <Step number="2" title="Point to Hub URL" desc={`In settings, set the Server URL to this app: ${window.location.host}`} />
                      <Step number="3" title="Initialize Speaker" desc="Say 'Xiaoxi Xiaoxi' or use the action button to trigger Gemini." />
                    </div>

                    <div className="pt-6">
                      <button 
                        onClick={() => {
                          setShowSetupWizard(true);
                          setSetupStep(1);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-3"
                      >
                        <Wifi size={20} />
                        Start Interactive Wi-Fi Setup
                      </button>
                      <p className="text-[10px] text-zinc-500 mt-3 text-center uppercase tracking-widest font-bold">Use this if your speaker isn't connected to internet</p>
                    </div>

                    <div className="pt-4 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4 px-1">Hardware Parameters</h4>
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-bold flex items-center gap-2">
                              <Mic2 size={14} className="text-orange-400" />
                              Mic Sensitivity
                            </label>
                            <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{activationSensitivity}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="100" value={activationSensitivity} 
                            onChange={(e) => setActivationSensitivity(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500" 
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-bold flex items-center gap-2">
                              <FastForward size={14} className="text-blue-400" />
                              Voice Speed
                            </label>
                            <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{voiceSpeed}x</span>
                          </div>
                          <input 
                            type="range" min="0.5" max="2.0" step="0.1" value={voiceSpeed} 
                            onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                            <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Silence Timeout</p>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm">{silenceTimeout}ms</span>
                              <div className="flex flex-col">
                                <button onClick={() => setSilenceTimeout(s => s + 100)} className="hover:text-white text-zinc-600"><ChevronUp size={12} /></button>
                                <button onClick={() => setSilenceTimeout(s => Math.max(500, s - 100))} className="hover:text-white text-zinc-600"><ChevronDown size={12} /></button>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                            <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Visualizer</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className={`w-3 h-3 rounded-full ${ledMode !== 'off' ? 'bg-orange-500 animate-pulse' : 'bg-zinc-700'}`} />
                              <span className="text-xs font-bold">{ledMode === 'music' ? 'Music Sync' : ledMode === 'on' ? 'Manual' : 'Disabled'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-zinc-800/40 rounded-2xl border border-zinc-800">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Network Info</h5>
                              <WifiHigh size={12} className="text-emerald-500" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-zinc-400">MAC Address</span>
                                <span className="text-[10px] font-mono text-zinc-300">{macAddress}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-zinc-400">Auto-Join</span>
                                <button 
                                  onClick={() => setWifiAutoConnect(!wifiAutoConnect)}
                                  className={`w-8 h-4 rounded-full transition-colors relative ${wifiAutoConnect ? 'bg-emerald-600' : 'bg-zinc-700'}`}
                                >
                                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${wifiAutoConnect ? 'right-0.5' : 'left-0.5'}`} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-zinc-800/40 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">OTA Service</h5>
                                <Settings2 size={12} className="text-blue-500" />
                              </div>
                              <div className="space-y-2 mb-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-zinc-400">Current Version</span>
                                  <span className="text-[10px] font-mono text-zinc-300 font-bold">v{otaVersion}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-zinc-400">Auto-Update</span>
                                  <button 
                                    onClick={() => setAutoOtaEnabled(!autoOtaEnabled)}
                                    className={`w-8 h-4 rounded-full transition-colors relative ${autoOtaEnabled ? 'bg-blue-600' : 'bg-zinc-700'}`}
                                  >
                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${autoOtaEnabled ? 'right-0.5' : 'left-0.5'}`} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setIsCheckingOTA(true);
                                setTimeout(() => {
                                  setIsCheckingOTA(false);
                                  // In a real app we might update state. 
                                  // For simulation, we'll just stop the loader.
                                }, 2000);
                              }}
                              disabled={isCheckingOTA}
                              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-zinc-300 disabled:opacity-50"
                            >
                              {isCheckingOTA ? (
                                <>
                                  <RefreshCw size={12} className="animate-spin" />
                                  Checking...
                                </>
                              ) : (
                                <>
                                  <DownloadCloud size={12} />
                                  Check for Updates
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Standalone AI Routing */}
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 h-fit">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                          <Wand2 size={18} />
                          Standalone AI Mode
                        </h4>
                        <button 
                          onClick={() => updateConfig({ useStandaloneMode: !config?.useStandaloneMode })}
                          className={`w-12 h-6 rounded-full transition-colors relative ${config?.useStandaloneMode ? 'bg-emerald-600' : 'bg-zinc-700'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config?.useStandaloneMode ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>

                      {config?.useStandaloneMode ? (
                        <div className="font-mono text-sm space-y-4">
                          <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                            <p className="text-emerald-400 mb-2 leading-none font-bold">PICOVOICE PORCUPINE (WAKEWORD)</p>
                            <input 
                              type="password" 
                              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 rounded p-2 text-xs mb-2"
                              value={config?.picovoiceAccessKey || ''}
                              onChange={(e) => updateConfig({ picovoiceAccessKey: e.target.value })}
                              placeholder="Nhập Access Key..."
                            />
                            <select 
                              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 rounded p-2 text-xs"
                              value={config?.wakeWord || 'hey google'}
                              onChange={(e) => updateConfig({ wakeWord: e.target.value })}
                            >
                              <option value="hey google">Hey Google</option>
                              <option value="alexa">Alexa</option>
                              <option value="jarvis">Jarvis</option>
                              <option value="porcupine">Porcupine</option>
                              <option value="terminator">Terminator</option>
                            </select>
                          </div>
                          
                          <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                            <p className="text-orange-400 mb-2 leading-none font-bold">GOOGLE GEMINI API (LLM)</p>
                            <input 
                              type="password" 
                              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 rounded p-2 text-xs"
                              value={config?.llmApiKey || ''}
                              onChange={(e) => updateConfig({ llmApiKey: e.target.value })}
                              placeholder="Nhập Google API Key..."
                            />
                          </div>

                          <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                            <p className="text-blue-400 mb-2 leading-none font-bold">ACTIVE PERSONA (SYSTEM PROMPT)</p>
                            <select 
                              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 rounded p-2 text-xs mb-2"
                              value={config?.activePersonaId || 'default'}
                              onChange={(e) => updateConfig({ activePersonaId: e.target.value })}
                            >
                              {config?.personas?.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                            <p className="text-zinc-500 text-[10px]">
                              {config?.personas?.find(p => p.id === config.activePersonaId)?.prompt || "Bạn là một trợ lý ảo thông minh..."}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="font-mono text-sm space-y-4">
                          <div className="bg-black/50 p-4 rounded-xl border border-zinc-800 opacity-80">
                            <p className="text-orange-400 mb-2 leading-none font-bold">XIAOZHI BACKEND SERVER URL</p>
                            <input 
                              type="text" 
                              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 rounded p-2 text-xs"
                              value={config?.serverUrl || 'wss://api.xiaozhi.me'}
                              onChange={(e) => updateConfig({ serverUrl: e.target.value })}
                              placeholder="wss://api.xiaozhi.me"
                            />
                            <p className="text-zinc-500 text-[10px] mt-2">Loa sẽ đóng vai trò dummy microphone & speaker, giao tiếp hoàn toàn qua WebSocket với máy chủ.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 rounded-[32px] p-8 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Sliders size={120} />
                      </div>
                      <div className="relative z-10 w-full space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/20 flex items-center justify-center">
                            <Sliders className="text-orange-400" size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 leading-none mb-1">DSP Config</p>
                            <h4 className="text-xl font-bold">Audio Equalization</h4>
                          </div>
                        </div>

                        <div className="space-y-5">
                          {(['bass', 'mid', 'treble'] as const).map(band => (
                            <div key={band} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-sm font-bold uppercase text-zinc-400">{band}</label>
                                <span className={`text-xs font-mono font-bold w-6 text-right ${eqBands[band] > 0 ? 'text-emerald-400' : eqBands[band] < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                                  {eqBands[band] > 0 ? '+' : ''}{eqBands[band]}
                                </span>
                              </div>
                              <input 
                                type="range" 
                                min="-12" 
                                max="12" 
                                value={eqBands[band]} 
                                onChange={(e) => setEqBands(prev => ({ ...prev, [band]: parseInt(e.target.value) }))}
                                className={`w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer ${
                                  band === 'bass' ? 'accent-orange-500' : band === 'mid' ? 'accent-blue-500' : 'accent-emerald-500'
                                }`} 
                              />
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <span className="text-[10px] uppercase font-bold text-zinc-500">Amp Output</span>
                            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20 font-bold uppercase">Optimized</span>
                        </div>
                      </div>
                    </div>

                    {/* OTA Update Card */}
                    <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 rounded-[32px] p-8 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <HardDrive size={120} />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center">
                            <RefreshCw className={`text-blue-400 ${isCheckingOTA ? 'animate-spin' : ''}`} size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 leading-none mb-1">System Update</p>
                            <h4 className="text-xl font-bold">Firmware {otaVersion}</h4>
                          </div>
                        </div>
                        
                        <div className="bg-black/20 rounded-2xl p-4 mb-6 border border-white/5">
                          <div className="flex justify-between items-center text-sm mb-2">
                            <span className="text-zinc-400">Current build</span>
                            <span className="font-mono text-zinc-300">2026.04.22_STABLE</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-400">Security patch</span>
                            <span className="font-mono text-zinc-300">v2.1.0</span>
                          </div>
                        </div>

                        <button 
                          onClick={checkOTAUpdate}
                          disabled={isCheckingOTA}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isCheckingOTA ? 'Searching Servers...' : 'Check for Updates'}
                          {!isCheckingOTA && <ArrowRight size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl text-center">
                  <h4 className="text-xl font-bold mb-4">Loa Phicomm R1 + Google AI Studio</h4>
                  <p className="text-zinc-400 max-w-2xl mx-auto">
                    Biến chiếc loa Phicomm R1 cũ của bạn thành một trợ lý AI mạnh mẽ sử dụng trí tuệ nhân tạo từ Google. 
                    Mọi yêu cầu giọng nói sẽ được gửi qua hub này để xử lý bởi Gemini.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30">
                      <ShieldCheck className="text-red-400" size={24} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white tracking-tight">Bảo mật & Mã hoá</h2>
                      <p className="text-zinc-400">Kiểm soát quyền truy cập Web UI và mã hoá dữ liệu</p>
                    </div>
                  </div>

                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">Mã PIN Web UI</h4>
                        <p className="text-sm text-zinc-400">Yêu cầu nhập mã PIN 6 số mỗi khi truy cập trang cấu hình này.</p>
                      </div>
                      <button 
                        onClick={() => {
                          if (config?.isWebAuthEnabled) {
                            if (confirm("Bạn có chắc chắn muốn TẮT tính năng bảo mật bằng mã PIN không?")) {
                              updateConfig({ isWebAuthEnabled: false, webUiPin: "" });
                              localStorage.removeItem("r1_web_pin");
                            }
                          } else {
                            const pin = prompt("Nhập mã PIN mới (4-6 số):");
                            if (pin && /^\\d{4,6}$/.test(pin)) {
                              updateConfig({ isWebAuthEnabled: true, webUiPin: pin });
                              localStorage.setItem("r1_web_pin", pin);
                              alert("Đã bật xác thực PIN thành công! Hãy lưu lại mã PIN này.");
                            } else {
                              alert("Mã PIN không hợp lệ. Phải bao gồm 4-6 chữ số.");
                            }
                          }
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative ${config?.isWebAuthEnabled ? 'bg-emerald-600' : 'bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config?.isWebAuthEnabled ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    
                    {config?.isWebAuthEnabled && (
                      <div className="bg-black/50 p-4 rounded-xl border border-zinc-800 mt-4">
                        <p className="text-emerald-400 mb-1 text-sm font-bold">TRẠNG THÁI: ĐÃ BẬT</p>
                        <p className="text-zinc-300 text-sm">Giao diện này hiện đã được bảo vệ. Hãy cẩn thận không để mất mã PIN.</p>
                      </div>
                    )}

                    <div className="mt-8 border-t border-zinc-800 pt-8">
                      <h4 className="text-lg font-bold text-white mb-4">Mã hoá Bộ nhớ (Data Encryption)</h4>
                      <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                        <p className="text-emerald-400 mb-1 text-sm font-bold flex items-center gap-2">
                          <ShieldCheck size={16} /> BẢO VỆ TOÀN VẸN BẰNG AES-256
                        </p>
                        <p className="text-zinc-300 text-sm">Toàn bộ khoá bí mật (Secret Keys) của bạn được lưu trữ trên R1 đã được tự động mã hoá bằng thuật toán AES. Dù có bị trích xuất file XML, kẻ gian cũng không thể giải mã được.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}


          </AnimatePresence>

          {/* Provisioning Wizard Modal */}
          <AnimatePresence>
            {showSetupWizard && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowSetupWizard(false)}
                  className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                />
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl relative z-10"
                >
                  <div className="p-8 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">Phicomm R1 Setup</h3>
                      <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">Interactive Provisioning</p>
                    </div>
                    <button 
                      onClick={() => setShowSetupWizard(false)}
                      className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-2xl transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-10">
                    {/* Step 1: AP Mode Instructions */}
                    {setupStep === 1 && (
                      <div className="space-y-8">
                        <div className="flex justify-center">
                          <div className="w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center relative">
                            <Wifi className="text-blue-400 animate-pulse" size={40} />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-zinc-900">
                              <Check className="text-white" size={12} />
                            </div>
                          </div>
                        </div>
                        <div className="text-center space-y-3">
                          <h4 className="text-xl font-bold">Step 1: Enter Setup Mode</h4>
                          <p className="text-zinc-500 text-sm leading-relaxed">
                            Press and hold the <span className="text-zinc-200 font-bold">Action Button</span> on your R1 for 5 seconds until the light ring turns <span className="text-orange-400 font-bold">Orange</span>. 
                            The speaker is now emitting its own Wi-Fi.
                          </p>
                        </div>
                        <div className="bg-zinc-800/50 p-6 rounded-3xl border border-zinc-700/50 space-y-4">
                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest text-center">Available Setup Networks</p>
                          <button 
                            onClick={() => {
                              setIsConnectedToSpeakerAp(true);
                              setSetupStep(2);
                            }}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 p-4 rounded-2xl flex items-center justify-between transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <Network className="text-zinc-500 group-hover:text-blue-400" size={18} />
                              <span className="font-bold">Phicomm_R1_Setup_92A</span>
                            </div>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">OPEN</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Simulated Local UI */}
                    {setupStep === 2 && (
                      <div className="space-y-8">
                        <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                          <Check className="text-emerald-400" size={20} />
                          <p className="text-sm font-bold text-emerald-400 truncate">Connected to Phicomm_R1_Setup_92A</p>
                        </div>
                        
                        <div className="text-center space-y-3">
                          <h4 className="text-xl font-bold">Step 2: Configure Internet</h4>
                          <p className="text-zinc-500 text-sm">Select the Wi-Fi network you want the speaker to use.</p>
                        </div>

                        <div className="space-y-3">
                          <button 
                            onClick={() => setSetupStep(3)}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 p-5 rounded-2xl flex items-center justify-between border border-zinc-700 transition-all"
                          >
                            <span className="font-bold text-lg">My_Home_Fiber</span>
                            <Signal className="text-emerald-500" size={18} />
                          </button>
                          <button className="w-full bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between opacity-50">
                            <span className="font-bold text-lg">Neighbor_WiFi</span>
                            <Signal className="text-zinc-600" size={18} />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => setSetupStep(1)}
                          className="w-full text-zinc-500 text-xs font-bold uppercase hover:text-zinc-300 transition-colors"
                        >
                          Change Setup Network
                        </button>
                      </div>
                    )}

                    {/* Step 3: Password Entry */}
                    {setupStep === 3 && (
                      <div className="space-y-8">
                        <div className="text-center space-y-3">
                          <h4 className="text-xl font-bold">Step 3: Security</h4>
                          <p className="text-zinc-500 text-sm">Enter password for <span className="text-white">My_Home_Fiber</span></p>
                        </div>

                        <div className="space-y-4">
                          <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input 
                              type="password" 
                              placeholder="Wi-Fi Password"
                              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-12 py-4 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            />
                          </div>
                          
                          <button 
                            onClick={() => finalizeWifiSetup('My_Home_Fiber')}
                            disabled={provisioningStatus === 'connecting'}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                          >
                            {provisioningStatus === 'connecting' ? (
                              <>
                                <RefreshCw className="animate-spin" size={18} />
                                Provisioning Speaker...
                              </>
                            ) : (
                              <>
                                <Check size={18} />
                                Connect Speaker to Wifi
                              </>
                            )}
                          </button>
                        </div>

                        <button 
                          onClick={() => setSetupStep(2)}
                          className="w-full text-zinc-500 text-xs font-bold uppercase hover:text-zinc-300 transition-colors"
                        >
                          Pick another network
                        </button>
                      </div>
                    )}

                    {/* Step 4: Success */}
                    {setupStep === 4 && (
                      <div className="space-y-8 py-4">
                        <div className="flex justify-center">
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center"
                          >
                            <ShieldCheck className="text-emerald-500" size={48} />
                          </motion.div>
                        </div>
                        <div className="text-center space-y-3">
                          <h4 className="text-2xl font-bold">Success! Your R1 is Online</h4>
                          <p className="text-zinc-500 text-sm leading-relaxed px-4">
                            The speaker has joined <span className="text-emerald-400 font-bold">My_Home_Fiber</span> and reached the Gemini gateway.
                            You can now control it from the dashboard.
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            setShowSetupWizard(false);
                            setActiveTab('status');
                          }}
                          className="w-full bg-zinc-100 hover:bg-white text-black font-bold py-5 rounded-2xl transition-all shadow-xl"
                        >
                          Go to Dashboard
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
            {/* Global Modals for Utilities */}
            <AnimatePresence>
              {/* Ringing Timer/Alarm Overlay */}
              {(ringingTimerId || ringingAlarmId) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="bg-zinc-900 border border-zinc-700/50 p-12 rounded-[40px] text-center max-w-sm w-full shadow-2xl flex flex-col items-center"
                  >
                    <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse mb-6">
                      {ringingAlarmId ? (
                        <Bell className="text-red-500" size={48} />
                      ) : (
                        <Timer className="text-red-500" size={48} />
                      )}
                    </div>
                    <h2 className="text-4xl font-black mb-2 text-white">
                      {ringingAlarmId 
                        ? (alarms.find(a => a.id === ringingAlarmId)?.time || '00:00')
                        : '00:00'
                      }
                    </h2>
                    <p className="text-lg text-red-400 font-bold mb-8">
                      {ringingAlarmId 
                        ? alarms.find(a => a.id === ringingAlarmId)?.label 
                        : timers.find(t => t.id === ringingTimerId)?.label}
                    </p>
                    
                    <button 
                      onClick={() => {
                        if (ringingAlarmId) setRingingAlarmId(null);
                        if (ringingTimerId) setRingingTimerId(null);
                      }}
                      className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-red-900/20"
                    >
                      Dismiss
                    </button>
                  </motion.div>
                </div>
              )}

              {/* Add Alarm Modal */}
              {showAddAlarm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] max-w-sm w-full space-y-6 shadow-2xl"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold flex items-center gap-2">
                        <Bell className="text-yellow-500" />
                        New Alarm
                      </h3>
                      <button onClick={() => setShowAddAlarm(false)} className="text-zinc-500 hover:text-white">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-zinc-500 tracking-widest pl-1">Time</label>
                        <input 
                          type="time" 
                          value={newAlarmTime}
                          onChange={(e) => setNewAlarmTime(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 text-xl font-mono focus:ring-2 focus:ring-yellow-500/50 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-zinc-500 tracking-widest pl-1">Label</label>
                        <input 
                          type="text" 
                          value={newAlarmLabel}
                          onChange={(e) => setNewAlarmLabel(e.target.value)}
                          placeholder="e.g. Wake Up"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-yellow-500/50 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        const newId = `a${Date.now()}`;
                        setAlarms(prev => [...prev, {
                          id: newId,
                          time: newAlarmTime,
                          label: newAlarmLabel,
                          enabled: true,
                          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
                        }]);
                        setShowAddAlarm(false);
                      }}
                      className="w-full px-6 py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-yellow-900/20"
                    >
                      Save Alarm
                    </button>
                  </motion.div>
                </div>
              )}

              {/* Add Timer Modal */}
              {showAddTimer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] max-w-sm w-full space-y-6 shadow-2xl"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold flex items-center gap-2">
                        <Timer className="text-cyan-400" />
                        New Timer
                      </h3>
                      <button onClick={() => setShowAddTimer(false)} className="text-zinc-500 hover:text-white">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-zinc-500 tracking-widest pl-1">Minutes</label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="range" 
                            min="1" max="120" 
                            value={newTimerMinutes}
                            onChange={(e) => setNewTimerMinutes(parseInt(e.target.value))}
                            className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                          />
                          <span className="font-mono font-bold text-xl w-12 text-center text-cyan-400">{newTimerMinutes}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-zinc-500 tracking-widest pl-1">Label</label>
                        <input 
                          type="text" 
                          value={newTimerLabel}
                          onChange={(e) => setNewTimerLabel(e.target.value)}
                          placeholder="e.g. Pasta"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        const newId = `t${Date.now()}`;
                        setTimers(prev => [...prev, {
                          id: newId,
                          label: newTimerLabel,
                          duration: newTimerMinutes * 60,
                          remaining: newTimerMinutes * 60,
                          active: false
                        }]);
                        setShowAddTimer(false);
                      }}
                      className="w-full px-6 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-cyan-900/20"
                    >
                      Add Timer
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-500 text-sm">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-emerald-400 font-bold">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              SYSTEM ACTIVE
            </span>
            <span className="font-mono uppercase tracking-widest text-[10px]">Encryption: AES-256</span>
          </div>
          <p>© 2026 Xiaozhi Project Integration</p>
        </footer>
      </div>
    </div>
  );
}

function StatusCard({ label, value, sub, icon: Icon, color }: { label: string, value: string, sub: string, icon: any, color: string }) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <Icon size={20} className={color} />
        <div className="w-2 h-2 rounded-full bg-zinc-800" />
      </div>
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-zinc-600 text-xs">{sub}</p>
    </div>
  );
}

function Step({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="flex gap-4 group">
      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold group-hover:border-zinc-500 transition-colors shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-bold text-zinc-200">{title}</h4>
        <p className="text-sm text-zinc-500">{desc}</p>
      </div>
    </div>
  );
}


