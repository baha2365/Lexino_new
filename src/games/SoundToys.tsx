import { useEffect, useRef, useState } from 'react';
import { TOY_PACKS } from '../lib/content';
import { playKey, preload, sfx, stopAudio } from '../lib/audio';
import { logEvent } from '../lib/repo';
import { ListenRing, useListen } from '../components/useListen';
import { Finish } from '../components/Finish';
import { Dots } from '../components/Dots';

export function SoundToys({ mode }: { mode: string }) {
  return mode === 'bubbles' ? <Bubbles /> : <Toys pack={mode} />;
}

function Toys({ pack }: { pack: string }) {
  const toys = TOY_PACKS[pack] ?? TOY_PACKS.animals;
  const [active, setActive] = useState<string | null>(null);
  const [heard, setHeard] = useState(false);
  const busy = useRef(false);
  const { listening, level, run, stop } = useListen();

  useEffect(() => {
    preload(toys.map((t) => `sounds/${t.id}`));
    return () => stopAudio();
  }, [toys]);

  async function tap(id: string) {
    stop();
    setHeard(false);
    setActive(id);
    logEvent({ game: 'sound-toys', skill: 'sounds', result: 'done', cardId: id });
    if (busy.current) return;
    busy.current = true;
    sfx('tap');
    await playKey(`sounds/${id}`, { gap: 700 });
    busy.current = false;
    const r = await run(3500); // only if the grown-up turned the microphone on
    if (r?.vocalized) {
      logEvent({ game: 'sound-toys', skill: 'sounds', result: 'vocalized', cardId: id });
      setHeard(true);
    }
  }

  const toy = toys.find((t) => t.id === active);
  return (
    <>
      <div className="bubble-say" aria-live="polite">
        {toy ? <><span className="big-say">{toy.say}</span><small>Can you say it too?</small></> : <span>Tap an animal, a car or a toy!</span>}
      </div>
      <div className="grid grid--toys">
        {toys.map((t) => (
          <button key={t.id} type="button" className={`item ${active === t.id ? 'bounce' : ''}`} onClick={() => tap(t.id)} aria-label={t.name}>
            <span className="emo">{t.emoji}</span>
          </button>
        ))}
      </div>
      <ListenRing listening={listening} level={level} />
      {heard && <div className="heard" role="status">⭐ I heard you!</div>}
    </>
  );
}

interface Bub { id: number; x: number; size: number; dur: number; hue: number }

function Bubbles() {
  const [bubbles, setBubbles] = useState<Bub[]>([]);
  const [pops, setPops] = useState(0);
  const [popText, setPopText] = useState<{ id: number; x: number; y: number }[]>([]);
  const seq = useRef(0);
  const GOAL = 12;

  useEffect(() => {
    if (pops >= GOAL) return;
    const t = setInterval(() => {
      setBubbles((b) => (b.length > 7 ? b : [...b, { id: ++seq.current, x: 8 + Math.random() * 78, size: 70 + Math.random() * 60, dur: 6 + Math.random() * 3, hue: Math.floor(Math.random() * 360) }]));
    }, 800);
    return () => clearInterval(t);
  }, [pops]);

  function pop(b: Bub, e: React.PointerEvent) {
    sfx('pop');
    logEvent({ game: 'sound-toys', skill: 'sounds', result: 'done', cardId: 'bubble' });
    setBubbles((list) => list.filter((x) => x.id !== b.id));
    setPopText((p) => [...p, { id: b.id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setPopText((p) => p.filter((x) => x.id !== b.id)), 700);
    setPops((n) => n + 1);
  }

  return (
    <div className="bubbles">
      <div className="bubble-say"><span className="big-say">Pop!</span><small>Pop the bubbles – say “pop!” with me</small></div>
      <Dots total={GOAL} done={Math.min(pops, GOAL)} />
      {bubbles.map((b) => (
        <button
          key={b.id}
          type="button"
          className="bub"
          aria-label="Bubble"
          style={{ left: `${b.x}%`, width: b.size, height: b.size, animationDuration: `${b.dur}s`, background: `radial-gradient(circle at 30% 30%, #fff 0 12%, hsla(${b.hue},80%,80%,.55) 40%, hsla(${b.hue},80%,65%,.35))` }}
          onPointerDown={(e) => pop(b, e)}
          onAnimationEnd={() => setBubbles((l) => l.filter((x) => x.id !== b.id))}
        />
      ))}
      {popText.map((p) => (
        <span key={p.id} className="poptext" style={{ left: p.x, top: p.y }}>Pop!</span>
      ))}
      {pops >= GOAL && <Finish onAgain={() => { setPops(0); setBubbles([]); }} title="So many bubbles!" />}
    </div>
  );
}
