/**
 * Mouth geometry – ported from the original character.js.
 * Pose: open 0..1 · wide -1 (rounded) .. +1 (spread) · jaw 0..1 · tuck (f/v) · teeth (s/sh) · tongue (l/n/t/d) · press (m/b/p)
 */
export interface Pose {
  open: number;
  wide: number;
  jaw: number;
  tuck: number;
  teeth: number;
  tongue: number;
  press: number;
}

export const REST: Pose = { open: 0, wide: 0, jaw: 0, tuck: 0, teeth: 0, tongue: 0, press: 0 };

/** Hand-made poses for single sounds (more exact than guessing from audio for short vowels/syllables). */
export const SHAPES: Record<string, Pose> = {
  rest: REST,
  A: { open: 0.95, wide: -0.05, jaw: 0.9, tuck: 0, teeth: 0, tongue: 0, press: 0 },
  E: { open: 0.5, wide: 0.6, jaw: 0.45, tuck: 0, teeth: 0, tongue: 0, press: 0 },
  I: { open: 0.22, wide: 1, jaw: 0.18, tuck: 0, teeth: 0.4, tongue: 0, press: 0 },
  O: { open: 0.55, wide: -0.75, jaw: 0.55, tuck: 0, teeth: 0, tongue: 0, press: 0 },
  U: { open: 0.2, wide: -1, jaw: 0.25, tuck: 0, teeth: 0, tongue: 0, press: 0 },
  M: { open: 0, wide: 0, jaw: 0.08, tuck: 0, teeth: 0, tongue: 0, press: 1 },
  F: { open: 0.16, wide: 0.1, jaw: 0.1, tuck: 1, teeth: 0, tongue: 0, press: 0 },
  S: { open: 0.2, wide: 0.5, jaw: 0.08, tuck: 0, teeth: 1, tongue: 0, press: 0 },
  SH: { open: 0.3, wide: -0.6, jaw: 0.12, tuck: 0, teeth: 1, tongue: 0, press: 0 },
  L: { open: 0.3, wide: 0.15, jaw: 0.3, tuck: 0, teeth: 0, tongue: 1, press: 0 },
};

const HALF_WIDTH = 36;
const MAX_GAP = 32;
const TEETH_EDGE = 3.2;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const n = (v: number) => Math.round(v * 100) / 100;

export type MouthEls = Record<string, SVGElement>;

export function collectEls(root: SVGElement): MouthEls {
  const out: MouthEls = {};
  root.querySelectorAll<SVGElement>('[data-p]').forEach((el) => {
    out[el.dataset.p as string] = el;
  });
  return out;
}

const set = (el: SVGElement | undefined, name: string, value: string) => el?.setAttribute(name, value);

export function applyPose(el: MouthEls, p: Partial<Pose>): void {
  const open = clamp(p.open || 0, 0, 1);
  const wide = clamp(p.wide || 0, -1, 1);
  const jaw = clamp(p.jaw || 0, 0, 1);
  const tuck = clamp(p.tuck || 0, 0, 1);
  const teeth = clamp(p.teeth || 0, 0, 1);
  const tongue = clamp(p.tongue || 0, 0, 1);
  const press = clamp(p.press || 0, 0, 1);
  const spread = Math.max(wide, 0);
  const round = Math.max(-wide, 0);

  const W = HALF_WIDTH * (1 + 0.15 * spread - 0.42 * round) * (1 - 0.05 * open);
  const gap = MAX_GAP * open * (1 + 0.12 * round);
  let upY = -gap * 0.22;
  let lowY = gap * 0.78;
  upY = mix(upY, -3.6, tuck);
  lowY = mix(lowY, 1.4, tuck);
  const thickU = 6.4 * (1 + 0.32 * round - 0.2 * spread) * (1 - 0.22 * press);
  const thickL = 9.2 * (1 + 0.32 * round - 0.16 * spread) * (1 - 0.42 * tuck) * (1 - 0.18 * press);
  const cornerY = -1.6 + gap * 0.2 - 1.6 * spread + 1.2 * round;
  const k = Math.min(0.86, 0.5 + 0.22 * round + 0.2 * open);
  const upC = (upY - 0.25 * cornerY) / 0.75;
  const lowC = (lowY - 0.25 * cornerY) / 0.75;

  const hole =
    `M${n(-W)} ${n(cornerY)}C${n(-W * k)} ${n(upC)} ${n(W * k)} ${n(upC)} ${n(W)} ${n(cornerY)}` +
    `C${n(W * k)} ${n(lowC)} ${n(-W * k)} ${n(lowC)} ${n(-W)} ${n(cornerY)}Z`;
  set(el.mouthHole, 'd', hole);
  set(el.mouthBack, 'd', hole);

  const peakY = upY - thickU - 1.3 + 0.6 * round;
  const dipY = upY - thickU + 0.9 - 0.9 * round;
  const px = W * 0.27;
  set(
    el.lipUpper,
    'd',
    `M${n(-W - 1.5)} ${n(cornerY)}` +
      `C${n(-W * 0.74)} ${n(cornerY - thickU * 0.6)} ${n(-W * 0.5)} ${n(peakY)} ${n(-px)} ${n(peakY)}` +
      `Q${n(-W * 0.1)} ${n(peakY)} 0 ${n(dipY)}` +
      `Q${n(W * 0.1)} ${n(peakY)} ${n(px)} ${n(peakY)}` +
      `C${n(W * 0.5)} ${n(peakY)} ${n(W * 0.74)} ${n(cornerY - thickU * 0.6)} ${n(W + 1.5)} ${n(cornerY)}` +
      `C${n(W * k)} ${n(upC)} ${n(-W * k)} ${n(upC)} ${n(-W - 1.5)} ${n(cornerY)}Z`,
  );

  const lowOut = (lowY + thickL - 0.25 * cornerY) / 0.75;
  set(
    el.lipLower,
    'd',
    `M${n(-W - 1.5)} ${n(cornerY)}` +
      `C${n(-W * k)} ${n(lowC)} ${n(W * k)} ${n(lowC)} ${n(W + 1.5)} ${n(cornerY)}` +
      `C${n(W * 0.66)} ${n(lowOut)} ${n(-W * 0.66)} ${n(lowOut)} ${n(-W - 1.5)} ${n(cornerY)}Z`,
  );

  set(el.lipSeam, 'd', `M${n(-W - 1.5)} ${n(cornerY)}C${n(-W * k)} ${n(upC)} ${n(W * k)} ${n(upC)} ${n(W + 1.5)} ${n(cornerY)}`);
  set(el.lipSeam, 'opacity', String(n(clamp(1 - open * 3, 0, 1))));

  const shineY = lowY + thickL * 0.55;
  set(el.lipShine, 'd', `M${n(-W * 0.3)} ${n(shineY)}Q0 ${n(shineY + 1.6)} ${n(W * 0.3)} ${n(shineY)}`);
  const shadowY = lowY + thickL + 4.5;
  set(el.lipShadow, 'd', `M${n(-W * 0.42)} ${n(shadowY)}Q0 ${n(shadowY + 3.5)} ${n(W * 0.42)} ${n(shadowY)}`);

  const tw = 26;
  const edge = n(TEETH_EDGE - 9 * round * (1 - 0.75 * Math.max(teeth, tuck)));
  const upperTeeth = `M${-tw} -16H${tw}V${edge - 1.5}Q${tw} ${edge} ${tw - 2} ${edge}H${-tw + 2}Q${-tw} ${edge} ${-tw} ${edge - 1.5}Z`;
  set(el.teethUpper, 'd', upperTeeth);
  set(el.teethBite, 'd', upperTeeth);
  set(el.teethLines, 'd', `M0 -8V${edge}M-9.5 -8V${edge}M9.5 -8V${edge}M-18.5 -8V${edge}M18.5 -8V${edge}`);

  const lowTeethTop = Math.max(mix(lowY - 1.2, edge + 0.5, teeth), edge + 0.5);
  set(
    el.teethLower,
    'd',
    `M${-tw + 3} ${n(lowTeethTop + 1.5)}Q${-tw + 3} ${n(lowTeethTop)} ${-tw + 5} ${n(lowTeethTop)}H${tw - 5}` +
      `Q${tw - 3} ${n(lowTeethTop)} ${tw - 3} ${n(lowTeethTop + 1.5)}V${n(lowY + 14)}H${-tw + 3}Z`,
  );

  const tongueTop = mix(lowY - gap * 0.42 - 0.5, Math.min(edge - 1, lowY - 4), tongue);
  const tr = W * 0.7;
  const tb = lowY + 12;
  set(el.tongue, 'd', `M${n(-tr)} ${n(tb)}C${n(-tr)} ${n(tongueTop - 2)} ${n(tr)} ${n(tongueTop - 2)} ${n(tr)} ${n(tb)}Z`);
  set(el.tongueLine, 'd', `M0 ${n(tongueTop + 3.5)}V${n(tb)}`);

  set(
    el.biteArea,
    'd',
    `M${n(-W)} ${n(cornerY)}C${n(-W * k)} ${n(upC)} ${n(W * k)} ${n(upC)} ${n(W)} ${n(cornerY)}V10H${n(-W)}Z`,
  );
  set(el.bite, 'opacity', String(n(clamp(tuck * 1.4 - 0.2, 0, 1))));

  const J = 10 * jaw;
  set(
    el.face,
    'd',
    'M192 290C190 196 410 196 408 290' +
      `C410 352 392 ${n(408 + J * 0.3)} 352 ${n(438 + J * 0.8)}` +
      `C330 ${n(455 + J)} 270 ${n(455 + J)} 248 ${n(438 + J * 0.8)}` +
      `C208 ${n(408 + J * 0.3)} 190 352 192 290Z`,
  );
}

/* ------------------------------------------------------------------ syllable scripts */

type Key = { shape: string; w: number };

const LIPS = new Set(['m', 'p', 'b']);
const TONGUE = new Set(['t', 'd', 'n', 'l']);
const VOWEL: Record<string, string> = { a: 'A', e: 'E', i: 'I', o: 'O', u: 'U' };

/** "ma" → [M, A] · "ma-ma" → [M, A, rest, M, A] · "a" → [A] */
export function scriptFor(id: string): Key[] {
  const keys: Key[] = [];
  id.split('-').forEach((syl, idx) => {
    if (idx > 0) keys.push({ shape: 'rest', w: 0.25 });
    const first = syl[0];
    const vowel = [...syl].find((ch) => VOWEL[ch]);
    if (LIPS.has(first)) keys.push({ shape: 'M', w: 0.45 });
    else if (TONGUE.has(first)) keys.push({ shape: 'L', w: 0.4 });
    if (vowel) keys.push({ shape: VOWEL[vowel], w: syl.length === 1 ? 1.6 : 1 });
  });
  keys.push({ shape: 'rest', w: 0.35 });
  return keys;
}

const lerp = (a: Pose, b: Pose, t: number): Pose => {
  const out = {} as Pose;
  (Object.keys(REST) as (keyof Pose)[]).forEach((key) => {
    out[key] = a[key] + (b[key] - a[key]) * t;
  });
  return out;
};

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Pose at a moment (0..1) of a script; keys are held and blended. */
export function poseOnScript(keys: Key[], progress: number): Pose {
  const total = keys.reduce((s, k) => s + k.w, 0);
  let t = clamp(progress, 0, 1) * total;
  let prev: Pose = REST;
  for (const key of keys) {
    const target = SHAPES[key.shape] ?? REST;
    if (t <= key.w) {
      const blend = clamp(t / (key.w * 0.45), 0, 1); // reach the shape in the first 45% of its slot
      return lerp(prev, target, ease(blend));
    }
    t -= key.w;
    prev = target;
  }
  return REST;
}
