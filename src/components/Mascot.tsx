import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from 'react';
import { applyPose, collectEls, poseOnScript, REST, scriptFor, type MouthEls, type Pose } from '../lib/mouth';
import { audioDuration, playKey } from '../lib/audio';

export interface MascotHandle {
  /** Speaks a vowel / syllable: plays public/audio/phonemes/<id> (if present) while the mouth moves. */
  say(id: string, opts?: { slow?: boolean }): Promise<void>;
  setPose(p: Partial<Pose>): void;
}

const VIEW_FULL = [50, 76, 500, 533];
const VIEW_CLOSE = [196, 316, 208, 222];

export const Mascot = forwardRef<MascotHandle, { closeUp?: boolean; className?: string }>(function Mascot(
  { closeUp = false, className },
  ref,
) {
  const p = useId().replace(/:/g, '');
  const svg = useRef<SVGSVGElement>(null);
  const els = useRef<MouthEls>({});
  const token = useRef(0);
  const view = useRef(VIEW_FULL.slice());
  const viewAnim = useRef(0);

  useEffect(() => {
    if (svg.current) {
      els.current = collectEls(svg.current);
      applyPose(els.current, REST);
    }
    return () => {
      token.current++;
      cancelAnimationFrame(viewAnim.current);
    };
  }, []);

  // smooth zoom between face and mouth
  useEffect(() => {
    const from = view.current.slice();
    const to = closeUp ? VIEW_CLOSE : VIEW_FULL;
    const start = performance.now();
    cancelAnimationFrame(viewAnim.current);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 450);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      view.current = from.map((v, i) => v + (to[i] - v) * e);
      svg.current?.setAttribute('viewBox', view.current.map((v) => Math.round(v * 100) / 100).join(' '));
      if (t < 1) viewAnim.current = requestAnimationFrame(step);
    };
    viewAnim.current = requestAnimationFrame(step);
  }, [closeUp]);

  useImperativeHandle(ref, () => ({
    setPose: (pose) => applyPose(els.current, pose),
    async say(id, opts) {
      const mine = ++token.current;
      const keys = scriptFor(id);
      const natural = id.includes('-') ? 1.7 : id.length === 1 ? 1.3 : 0.95;
      const len = await audioDuration(`phonemes/${id}`);
      if (mine !== token.current) return;
      const slow = opts?.slow ? 1.7 : 1;
      const duration = Math.max(0.7, (len ?? natural) + 0.25) * slow * 1000;
      void playKey(`phonemes/${id}`, { rate: opts?.slow ? 0.6 : 1, gap: 0 });
      const t0 = performance.now();
      await new Promise<void>((resolve) => {
        const frame = (now: number) => {
          if (mine !== token.current) return resolve();
          const progress = (now - t0) / duration;
          applyPose(els.current, poseOnScript(keys, progress));
          if (progress < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
      if (mine === token.current) applyPose(els.current, REST);
    },
  }));

  const id = (name: string) => `${p}${name}`;
  const url = (name: string) => `url(#${p}${name})`;

  return (
    <svg ref={svg} className={className} viewBox="50 76 500 533" role="img" aria-label="Lexi, a friendly teacher whose mouth shows how to say the sound">
      <defs>
        <linearGradient id={id('gSkin')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FBD9B9" /><stop offset="1" stopColor="#F4C6A0" /></linearGradient>
        <linearGradient id={id('gHair')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#C4553A" /><stop offset="1" stopColor="#A23A2A" /></linearGradient>
        <linearGradient id={id('gSweater')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EE6A5C" /><stop offset="1" stopColor="#DD4D45" /></linearGradient>
        <linearGradient id={id('gLipU')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C9485A" /><stop offset="1" stopColor="#B93A4E" /></linearGradient>
        <linearGradient id={id('gLipL')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D9566A" /><stop offset="1" stopColor="#C5445A" /></linearGradient>
        <radialGradient id={id('gCavity')} cx="0.5" cy="0.35" r="0.75"><stop offset="0" stopColor="#7A1F2E" /><stop offset="1" stopColor="#4A0E1B" /></radialGradient>
        <linearGradient id={id('gTongue')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F28C98" /><stop offset="1" stopColor="#E26E7F" /></linearGradient>
        <clipPath id={id('eyeClipL')}><ellipse cx="250" cy="303" rx="25" ry="21" /></clipPath>
        <clipPath id={id('eyeClipR')}><ellipse cx="350" cy="303" rx="25" ry="21" /></clipPath>
        <clipPath id={id('mouthClip')}><path data-p="mouthHole" d="" /></clipPath>
        <clipPath id={id('biteClip')}><path data-p="biteArea" d="" /></clipPath>
      </defs>

      <g>
        <circle cx="446" cy="366" r="47" fill="#A23A2A" />
        <path d="M418 352c12-20 40-24 58-8" fill="none" stroke="#C4553A" strokeWidth="5" strokeLinecap="round" opacity=".6" />
        <ellipse cx="302" cy="268" rx="134" ry="152" fill={url('gHair')} />
      </g>

      <path d="M266 420v84q34 26 68 0v-84z" fill="#EDB893" />
      <path d="M266 438q34 34 68 0v22q-34 30-68 0z" fill="#DFA27C" opacity=".75" />
      <path d="M92 680c4-92 56-146 156-170l18-10q34 26 68 0l18 10c100 24 152 78 156 170z" fill={url('gSweater')} />
      <path d="M92 680c2-40 12-72 32-98 4 34 12 66 26 98zM508 680c-2-40-12-72-32-98-4 34-12 66-26 98z" fill="#C9433D" opacity=".45" />
      <path d="M266 494l34 50-64 26c-12-32 2-62 30-76z" fill="#FFFFFF" />
      <path d="M334 494l-34 50 64 26c12-32-2-62-30-76z" fill="#FFFFFF" />
      <path d="M266 494l34 50-8 3z M334 494l-34 50 8 3z" fill="#DCE3EA" />

      <g fill="#F4C6A0"><ellipse cx="191" cy="322" rx="15" ry="24" /><ellipse cx="409" cy="322" rx="15" ry="24" /></g>
      <path d="M187 312q8 8 4 22M413 312q-8 8-4 22" fill="none" stroke="#E0A681" strokeWidth="3" strokeLinecap="round" />
      <circle cx="188" cy="349" r="5" fill="#F4B93E" /><circle cx="412" cy="349" r="5" fill="#F4B93E" />

      <path data-p="face" d="" fill={url('gSkin')} />
      <ellipse cx="232" cy="362" rx="25" ry="14" fill="#F4907F" opacity=".32" />
      <ellipse cx="368" cy="362" rx="25" ry="14" fill="#F4907F" opacity=".32" />

      {[{ cx: 250, k: 'L', iris: 251, hl: 245, hl2: 257.5, lash: 'M223 299l-8-5' }, { cx: 350, k: 'R', iris: 349, hl: 343, hl2: 355.5, lash: 'M377 299l8-5' }].map((e) => (
        <g className="mascot-eye" key={e.k}>
          <ellipse cx={e.cx} cy="303" rx="25" ry="21" fill="#FFFFFF" />
          <g clipPath={url(`eyeClip${e.k}`)}>
            <circle cx={e.iris} cy="301" r="17" fill="#5E7A4C" />
            <circle cx={e.iris} cy="301" r="15.5" fill="none" stroke="#3F5634" strokeWidth="3" />
            <circle cx={e.iris} cy="301" r="8.5" fill="#1F1A17" />
            <circle cx={e.hl} cy="294.5" r="5" fill="#FFFFFF" />
            <circle cx={e.hl2} cy="307.5" r="2.2" fill="#FFFFFF" opacity=".8" />
          </g>
          <path d={`M${e.cx - 27} 300q27-33 54 0`} fill="none" stroke="#3A1E1A" strokeWidth="5.5" strokeLinecap="round" />
          <path d={e.lash} fill="none" stroke="#3A1E1A" strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}
      <path d="M221 264q28-16 57-5M379 264q-28-16-57-5" fill="none" stroke="#8C3323" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M291 349q9 9 19-1" fill="none" stroke="#DE9E79" strokeWidth="3.6" strokeLinecap="round" />

      <g transform="translate(300 396) scale(1.15)">
        <path data-p="lipShadow" d="" fill="none" stroke="#D99A78" strokeWidth="3" strokeLinecap="round" opacity=".55" />
        <path data-p="mouthBack" d="" fill="#5A1422" stroke="#5A1422" strokeWidth="1.8" strokeLinejoin="round" />
        <g clipPath={url('mouthClip')}>
          <rect x="-60" y="-30" width="120" height="80" fill={url('gCavity')} />
          <path data-p="tongue" d="" fill={url('gTongue')} />
          <path data-p="tongueLine" d="" fill="none" stroke="#C9566A" strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
          <path data-p="teethLower" d="" fill="#F4F6F9" />
          <path data-p="teethUpper" d="" fill="#FFFFFF" />
          <path data-p="teethLines" d="" fill="none" stroke="#D5DBE3" strokeWidth="1" />
        </g>
        <path data-p="lipLower" d="" fill={url('gLipL')} />
        <path data-p="lipShine" d="" fill="none" stroke="#F3A3AE" strokeWidth="2.6" strokeLinecap="round" opacity=".7" />
        <g data-p="bite" clipPath={url('biteClip')} opacity="0"><path data-p="teethBite" d="" fill="#FFFFFF" /></g>
        <path data-p="lipUpper" d="" fill={url('gLipU')} />
        <path data-p="lipSeam" d="" fill="none" stroke="#8E2A3D" strokeWidth="1.6" strokeLinecap="round" />
      </g>

      <g>
        <path d="M356 204c-38 14-116 12-154 104-20-4-30-30-32-58 2-98 78-146 150-146 82 0 124 78 112 158-2 18-8 34-22 40 0-40-14-74-54-98z" fill={url('gHair')} />
        <path d="M346 150c-56 8-120 44-144 110" fill="none" stroke="#DB7654" strokeWidth="7" strokeLinecap="round" opacity=".4" />
        <path d="M352 196c-44 14-96 22-130 62" fill="none" stroke="#8E2F22" strokeWidth="4" strokeLinecap="round" opacity=".22" />
        <path d="M366 140c32 20 52 56 56 100" fill="none" stroke="#DB7654" strokeWidth="6" strokeLinecap="round" opacity=".35" />
      </g>
    </svg>
  );
});
