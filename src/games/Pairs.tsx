import { useEffect, useMemo, useRef, useState } from 'react';
import { CARDS, type Card } from '../lib/content';
import { playKey, sfx, stopAudio, preload } from '../lib/audio';
import { logEvent } from '../lib/repo';
import { sample, shuffle, wait, confettiAtElement } from '../lib/util';
import { CardFace } from '../components/CardFace';
import { Finish } from '../components/Finish';

interface Tile { key: string; card: Card }

export function Pairs({ mode }: { mode: string }) {
  const pairs = Math.min(6, Math.max(3, parseInt(mode, 10) || 3));
  const [seed, setSeed] = useState(0);
  const deck = useMemo<Tile[]>(() => {
    const chosen = sample(CARDS.filter((c) => ['animals', 'food', 'transport', 'toys'].includes(c.cat)), pairs);
    return shuffle(chosen.flatMap((c) => [{ key: `${c.id}-a`, card: c }, { key: `${c.id}-b`, card: c }]));
  }, [pairs, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [misses, setMisses] = useState<Record<string, number>>({});
  const lock = useRef(false);
  const alive = useRef(true);
  const els = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    alive.current = true;
    preload(deck.map((t) => `words/${t.card.id}`));
    return () => { alive.current = false; stopAudio(); };
  }, [deck]);

  async function flip(t: Tile) {
    if (lock.current || open.includes(t.key) || matched.includes(t.card.id)) return;
    sfx('tap');
    void playKey(`words/${t.card.id}`, { gap: 0 }); // every card says its name when turned
    const next = [...open, t.key];
    setOpen(next);
    if (next.length < 2) return;

    lock.current = true;
    const [a, b] = next.map((k) => deck.find((d) => d.key === k)!);
    await wait(900);
    if (!alive.current) return;
    if (a.card.id === b.card.id) {
      sfx('yay');
      confettiAtElement(els.current[b.key] ?? null, 12);
      const m = misses[a.card.id] ?? 0;
      logEvent({ game: 'pairs', skill: 'play', result: m ? 'assisted' : 'correct', cardId: a.card.id, meta: { pairs, misses: m } });
      setMatched((x) => [...x, a.card.id]);
    } else {
      setMisses((m) => ({ ...m, [a.card.id]: (m[a.card.id] ?? 0) + 1, [b.card.id]: (m[b.card.id] ?? 0) + 1 }));
    }
    setOpen([]);
    lock.current = false;
  }

  const cols = pairs === 3 ? 3 : 4;
  const finished = matched.length === pairs;
  return (
    <div className="pairs">
      <div className="prompt prompt--static"><span>Find two that are the same!</span></div>
      <div className="grid grid--pairs" style={{ ['--cols' as string]: cols }}>
        {deck.map((t) => {
          const faceUp = open.includes(t.key) || matched.includes(t.card.id);
          return (
            <button
              key={t.key}
              ref={(el) => { els.current[t.key] = el; }}
              type="button"
              className={`flip ${faceUp ? 'up' : ''} ${matched.includes(t.card.id) ? 'matched' : ''}`}
              onClick={() => void flip(t)}
              aria-label={faceUp ? t.card.word : 'Hidden card'}
            >
              <span className="flip__in">
                <span className="flip__face flip__back">⭐</span>
                <span className="flip__face flip__front"><CardFace card={t.card} /><small>{t.card.word}</small></span>
              </span>
            </button>
          );
        })}
      </div>
      {finished && <Finish onAgain={() => { setOpen([]); setMatched([]); setMisses({}); setSeed((s) => s + 1); }} title="You found all pairs!" />}
    </div>
  );
}
