/**
 * Voice activity detection: "did the child make a sound?" – NOT "was it correct".
 * Nothing is recorded or uploaded; we only measure loudness from the microphone.
 */

let stream: MediaStream | null = null;
let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;

async function ensureMic(): Promise<boolean> {
  if (analyser) return true;
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
    });
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    const src = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    src.connect(analyser);
    return true;
  } catch {
    return false;
  }
}

export function releaseMic(): void {
  stream?.getTracks().forEach((t) => t.stop());
  void ctx?.close();
  stream = null;
  ctx = null;
  analyser = null;
}

export interface ListenResult {
  available: boolean;
  vocalized: boolean;
  voicedMs: number;
}

/**
 * Listens for up to `ms` and reports whether the child voiced for at least `minVoicedMs`.
 * `onLevel` (0..1) drives a gentle visual ring. Stops early if `signal` aborts.
 */
export async function listen(
  ms: number,
  opts: { minVoicedMs?: number; onLevel?: (v: number) => void; signal?: AbortSignal } = {},
): Promise<ListenResult> {
  const ok = await ensureMic();
  if (!ok || !analyser) return { available: false, vocalized: false, voicedMs: 0 };
  if (ctx?.state === 'suspended') await ctx.resume();

  const buf = new Float32Array(analyser.fftSize);
  const STEP = 50;
  const minVoiced = opts.minVoicedMs ?? 250;
  const rms = () => {
    analyser!.getFloatTimeDomainData(buf);
    let s = 0;
    for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
    return Math.sqrt(s / buf.length);
  };
  // learn the room's noise level first, so a fan or a TV is not mistaken for a voice
  let floor = 0;
  let n = 0;
  for (let t = 0; t < 300; t += STEP) {
    floor += rms();
    n++;
    await new Promise((r) => setTimeout(r, STEP));
  }
  floor /= Math.max(n, 1);
  const threshold = Math.max(floor * 3, 0.025);

  let voiced = 0;
  for (let t = 300; t < ms; t += STEP) {
    if (opts.signal?.aborted) break;
    const level = rms();
    opts.onLevel?.(Math.min(1, level / 0.25));
    if (level > threshold) voiced += STEP;
    await new Promise((r) => setTimeout(r, STEP));
  }
  opts.onLevel?.(0);
  return { available: true, vocalized: voiced >= minVoiced, voicedMs: voiced };
}
