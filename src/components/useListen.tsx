import { useCallback, useEffect, useRef, useState } from 'react';
import { listen, releaseMic, type ListenResult } from '../lib/voice';
import { getSettings } from '../lib/settings';

/**
 * Optional "I'm listening" step. Only runs if the grown-up turned on the microphone in Settings.
 * The ring pulses with loudness – never red, never "wrong".
 */
export function useListen() {
  const [listening, setListening] = useState(false);
  const [level, setLevel] = useState(0);
  const abort = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      abort.current?.abort();
      releaseMic();
    },
    [],
  );

  const run = useCallback(async (ms = 4500): Promise<ListenResult | null> => {
    if (!getSettings().listen) return null;
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setListening(true);
    const res = await listen(ms, { onLevel: setLevel, signal: ctl.signal });
    setListening(false);
    setLevel(0);
    return res;
  }, []);

  const stop = useCallback(() => abort.current?.abort(), []);
  return { listening, level, run, stop };
}

export function ListenRing({ listening, level }: { listening: boolean; level: number }) {
  if (!listening) return null;
  return (
    <div className="ring" aria-live="polite" style={{ ['--lvl' as string]: level }}>
      <span aria-hidden="true">🎤</span>
      <small>I’m listening…</small>
    </div>
  );
}
