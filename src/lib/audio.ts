import manifest from 'virtual:audio-manifest';
import { getSettings } from './settings';

/**
 * Audio keys look like "words/apple", "sounds/cow", "phonemes/ma", "phrases/mom-sleeps",
 * "aac/want", "prompts/great". The file is found automatically in public/audio/<folder>/.
 * A missing recording never breaks a game: it just stays silent (see `npm run audio:check`).
 */

const norm = (k: string) => k.toLowerCase();
export const hasAudio = (key: string): boolean => !!manifest[norm(key)];
export const allAudioKeys = (): string[] => Object.keys(manifest);

const cache = new Map<string, HTMLAudioElement>();
let current: { a: HTMLAudioElement; done: () => void } | null = null;
const warned = new Set<string>();

function get(key: string): HTMLAudioElement | null {
  const url = manifest[norm(key)];
  if (!url) {
    if (!warned.has(key)) {
      warned.add(key);
      if (import.meta.env.DEV) console.info(`[audio] no recording for "${key}"`);
    }
    return null;
  }
  let a = cache.get(url);
  if (!a) {
    a = new Audio(url);
    a.preload = 'auto';
    cache.set(url, a);
  }
  return a;
}

export function preload(keys: string[]): void {
  keys.forEach((k) => get(k));
}

export function stopAudio(): void {
  if (current) {
    const c = current;
    current = null;
    c.a.pause();
    c.done();
  }
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Plays a recording and resolves when it ends. Missing file: resolves after `gap` ms so flows keep their rhythm. */
export function playKey(key: string, opts: { gap?: number; rate?: number } = {}): Promise<void> {
  stopAudio();
  const a = get(key);
  if (!a) return wait(opts.gap ?? 450);
  return new Promise<void>((resolve) => {
    let over = false;
    const done = () => {
      if (over) return;
      over = true;
      a.removeEventListener('ended', done);
      a.removeEventListener('error', done);
      if (current && current.a === a) current = null;
      resolve();
    };
    a.addEventListener('ended', done);
    a.addEventListener('error', done);
    current = { a, done };
    try {
      a.currentTime = 0;
    } catch {
      /* not ready yet */
    }
    a.playbackRate = opts.rate ?? (getSettings().slow ? 0.75 : 1);
    const p = a.play();
    if (p && p.catch) p.catch(done);
  });
}

/** Resolves with the length of a recording in seconds, or undefined if there is none. */
export function audioDuration(key: string): Promise<number | undefined> {
  const a = get(key);
  if (!a) return Promise.resolve(undefined);
  if (isFinite(a.duration) && a.duration > 0) return Promise.resolve(a.duration);
  return new Promise((resolve) => {
    const ok = () => resolve(isFinite(a.duration) ? a.duration : undefined);
    a.addEventListener('loadedmetadata', ok, { once: true });
    a.addEventListener('error', () => resolve(undefined), { once: true });
    setTimeout(() => resolve(undefined), 1500);
  });
}

/** Plays the first key that has a recording (e.g. an AAC-specific one, then the plain word). */
export function playFirst(keys: string[], opts: { gap?: number } = {}): Promise<void> {
  const k = keys.find(hasAudio);
  return playKey(k ?? keys[0], opts);
}

const PRAISE = ['prompts/praise-1', 'prompts/praise-2', 'prompts/praise-3'];
export function praise(): Promise<void> {
  const have = PRAISE.filter(hasAudio);
  return have.length ? playKey(have[Math.floor(Math.random() * have.length)]) : Promise.resolve();
}

/* ---------- tiny synthesized sound effects (no files needed, never negative) ---------- */
let ac: AudioContext | null = null;
function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, slideTo?: number) {
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ac.currentTime + start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, ac.currentTime + start);
  g.gain.exponentialRampToValueAtTime(vol, ac.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  o.connect(g).connect(ac.destination);
  o.start(ac.currentTime + start);
  o.stop(ac.currentTime + start + dur + 0.05);
}

export type Sfx = 'pop' | 'yay' | 'win' | 'boop' | 'drum' | 'tap' | 'whoosh';
export function sfx(name: Sfx): void {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ac = ac || new AC();
    if (ac.state === 'suspended') void ac.resume();
    switch (name) {
      case 'pop': tone(700, 0, 0.09, 'sine', 0.2, 180); break;
      case 'tap': tone(520, 0, 0.07, 'triangle', 0.1); break;
      case 'boop': tone(330, 0, 0.14, 'sine', 0.08, 280); break; // gentle "try again", never a buzzer
      case 'drum': tone(150, 0, 0.22, 'sine', 0.4, 55); break;
      case 'whoosh': tone(300, 0, 0.3, 'sawtooth', 0.04, 900); break;
      case 'yay': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.26, 'sine', 0.14)); break;
      case 'win': [523, 659, 784, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.1, 0.3, 'sine', 0.14)); break;
    }
  } catch {
    /* audio blocked */
  }
}

/** Call from the very first tap so iOS/Android allow sound afterwards. */
export function unlockAudio(): void {
  sfx('tap');
}
