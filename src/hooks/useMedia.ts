import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  url?: string;
  duration?: number;
}

export function useMedia() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [mediaQueue, setMediaQueue] = useState<Track[]>([]);
  const [volume, setVolume] = useState(50);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');

  const fetchStatus = async () => {
    try {
      const data = await fetchApi<any>('/api/player/status');
      setIsPlaying(data.isPlaying);
      setCurrentTrack(data.currentTrack);
      setMediaQueue(data.queue);
      setProgress(data.progress);
      setVolume(data.volume);
      setShuffleOn(data.shuffleOn);
      setRepeatMode(data.repeatMode);
    } catch (e) {
      console.error(e);
    }
  };

  const playTrack = async (track: Track) => {
    try {
      await fetchApi('/api/player/play', { method: 'POST', data: track });
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const togglePlay = async () => {
    try {
      await fetchApi(isPlaying ? '/api/player/pause' : '/api/player/resume', { method: 'POST' });
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const nextTrack = async () => {
    try {
      await fetchApi('/api/player/next', { method: 'POST' });
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };
  
  const prevTrack = async () => {
    try {
      await fetchApi('/api/player/prev', { method: 'POST' });
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const updateVolume = async (level: number) => {
    setVolume(level);
    try {
      await fetchApi('/api/player/volume', { method: 'POST', data: { level } });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleShuffle = async () => {
    try {
      await fetchApi('/api/player/shuffle', { method: 'POST', data: { enabled: !shuffleOn } });
      setShuffleOn(!shuffleOn);
    } catch (e) {
      console.error(e);
    }
  };
  
  const cycleRepeat = async () => {
    const nextMode = repeatMode === 'none' ? 'all' : repeatMode === 'all' ? 'one' : 'none';
    try {
      await fetchApi('/api/player/repeat', { method: 'POST', data: { mode: nextMode } });
      setRepeatMode(nextMode);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return { 
    isPlaying, togglePlay,
    currentTrack, playTrack, nextTrack, prevTrack,
    mediaQueue, setMediaQueue,
    progress, volume, updateVolume,
    shuffleOn, toggleShuffle,
    repeatMode, cycleRepeat
  };
}
