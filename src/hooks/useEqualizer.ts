import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

export interface EqBands {
  bass: number;
  mid: number;
  treble: number;
}

export function useEqualizer() {
  const [eqBands, setEqBands] = useState<EqBands>({ bass: 0, mid: 0, treble: 0 });

  useEffect(() => {
    fetchApi<EqBands>('/api/eq/bands')
      .then(setEqBands)
      .catch(console.error);
  }, []);

  const updateEqBands = async (newBands: React.SetStateAction<EqBands>) => {
    const value = typeof newBands === 'function' ? newBands(eqBands) : newBands;
    setEqBands(value);
    fetchApi('/api/eq/bands', { method: 'POST', data: value }).catch(console.error);
  };

  return { eqBands, setEqBands: updateEqBands };
}
