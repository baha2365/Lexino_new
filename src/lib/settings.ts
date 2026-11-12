import { useSyncExternalStore } from 'react';

export interface Settings {
  slow: boolean; // play audio slower
  listen: boolean; // use the microphone to notice the child's voice (never stored)
  coplay: boolean; // show the adult's rating bar
}

const KEY = 'lexino:settings';
const DEFAULTS: Settings = { slow: false, listen: false, coplay: true };

let state: Settings = load();
const subs = new Set<() => void>();

function load(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export const getSettings = (): Settings => state;

export function setSettings(patch: Partial<Settings>): void {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode */
  }
  subs.forEach((f) => f());
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
  );
}
