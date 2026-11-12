import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { card, cardsIn, type Card, type CatId } from '../lib/content';
import { playKey, sfx, stopAudio, preload } from '../lib/audio';
import { logEvent } from '../lib/repo';
import { sample, shuffle, wait, confettiAtElement } from '../lib/util';
import { CardFace } from '../components/CardFace';
import { Dots } from '../components/Dots';
import { Finish } from '../components/Finish';

/* ------------------------------------------------------------------ rounds */

interface Target { id: string; label: string; node: ReactNode }
interface Round {
  items: Card[];
  targets: Target[];
  /** card id -> target id that accepts it; null = belongs nowhere (always bounces back) */
  accepts: Record<string, string | null>;
  hint: string;
}

const ODD: { group: string[]; extra: string }[] = [
  { group: ['apple', 'banana', 'orange'], extra: 'car' },
  { group: ['cat', 'dog', 'cow'], extra: 'bread' },
  { group: ['car', 'bus', 'airplane'], extra: 'tree' },
  { group: ['carrot', 'tomato', 'cucumber'], extra: 'bear' },
  { group: ['t-shirt', 'pants', 'socks'], extra: 'watermelon' },
  { group: ['elephant', 'lion', 'monkey'], extra: 'rocket' },
  { group: ['ball', 'balloon', 'drum'], extra: 'frog' },
  { group: ['egg', 'cheese', 'bread'], extra: 'bicycle' },
  { group: ['sun', 'star', 'moon'], extra: 'pear' },
  { group: ['chair', 'bed', 'door'], extra: 'rabbit' },
];
const PAIRS: [CatId, CatId][] = [['animals', 'food'], ['clothes', 'transport'], ['animals', 'transport'], ['food', 'clothes'], ['toys', 'animals']];
const CAT_EMOJI: Record<string, string> = { animals: '🐾', food: '🍽️', clothes: '👕', transport: '🚦', toys: '🧸', home: '🏠' };
const CAT_NAME: Record<string, string> = { animals: 'Animals', food: 'Food', clothes: 'Clothes', transport: 'Transport', toys: 'Toys', home: 'Home' };

function bucket(): Target {
  return { id: 'bucket', label: 'bucket', node: <span className="target__emoji">🪣</span> };
}

function makeRounds(mode: string): Round[] {
  if (mode === 'odd') {
    return sample(ODD, 6).map(({ group, extra }) => {
      const items = shuffle([...group, extra].map(card));
      return { items, targets: [bucket()], accepts: Object.fromEntries(items.map((c) => [c.id, c.id === extra ? 'bucket' : null])), hint: 'Which one is different?' };
    });
  }
  if (mode === 'baskets') {
    return sample(PAIRS, 5).map(([a, b]) => {
      const items = shuffle([...sample(cardsIn(a), 3), ...sample(cardsIn(b), 3)]);
      return {
        items,
        targets: [a, b].map((k) => ({ id: k, label: CAT_NAME[k], node: <><span className="target__emoji">{CAT_EMOJI[k]}</span><b>{CAT_NAME[k]}</b></> })),
        accepts: Object.fromEntries(items.map((c) => [c.id, c.cat])),
        hint: 'Where does it go?',
      };
    });
  }
  const feed = mode === 'feed';
  const good = cardsIn(feed ? 'food' : 'clothes');
  const bad = cardsIn(...(feed ? (['toys', 'home', 'transport'] as CatId[]) : (['food', 'toys'] as CatId[])));
  return Array.from({ length: 3 }, () => {
    const items = shuffle([...sample(good, 3), ...sample(bad, 2)]);
    return {
      items,
      targets: [{ id: 'who', label: feed ? 'bear' : 'doll', node: <span className="target__emoji target__emoji--big">{feed ? '🐻' : '🪆'}</span> }],
      accepts: Object.fromEntries(items.map((c) => [c.id, good.includes(c) ? 'who' : null])),
      hint: feed ? 'Feed the bear!' : 'Dress the doll!',
    };
  });
}

/* -------------------------------------------------------------------- game */

export function Sort({ mode }: { mode: string }) {
  const [seed, setSeed] = useState(0);
  const rounds = useMemo(() => makeRounds(mode), [mode, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [finished, setFinished] = useState(false);
  const r = rounds[i];

  useEffect(() => {
    preload(rounds.flatMap((x) => x.items.map((c) => `words/${c.id}`)));
    return () => stopAudio();
  }, [rounds]);

  async function roundDone() {
    await wait(900);
    if (i + 1 >= rounds.length) setFinished(true);
    else setI(i + 1);
  }

  return (
    <div className="sort">
      <Dots total={rounds.length} done={i} />
      <div className="prompt prompt--static"><span>{r.hint}</span></div>
      <Board key={`${mode}-${seed}-${i}`} round={r} mode={mode} onDone={roundDone} />
      {finished && <Finish onAgain={() => { setFinished(false); setI(0); setSeed((s) => s + 1); }} />}
    </div>
  );
}

function Board({ round, mode, onDone }: { round: Round; mode: string; onDone: () => void }) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [wrongs, setWrongs] = useState<Record<string, number>>({});
  const [named, setNamed] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; pid: number; sx: number; sy: number; dx: number; dy: number; moved: boolean } | null>(null);
  const [back, setBack] = useState<string | null>(null);
  const [hot, setHot] = useState<string | null>(null);
  const [fed, setFed] = useState(0);
  const targetEls = useRef<Record<string, HTMLElement | null>>({});
  const itemEls = useRef<Record<string, HTMLElement | null>>({});
  const needed = round.items.filter((c) => round.accepts[c.id]).length;

  function overTarget(id: string): string | null {
    const el = itemEls.current[id];
    if (!el) return null;
    const c = el.getBoundingClientRect();
    const cx = c.left + c.width / 2;
    const cy = c.top + c.height / 2;
    for (const t of round.targets) {
      const b = targetEls.current[t.id]?.getBoundingClientRect();
      if (b && cx > b.left - 16 && cx < b.right + 16 && cy > b.top - 16 && cy < b.bottom + 16) return t.id;
    }
    return null;
  }

  function down(e: React.PointerEvent, c: Card) {
    if (drag || placed.includes(c.id)) return;
    e.preventDefault();
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    setDrag({ id: c.id, pid: e.pointerId, sx: e.clientX, sy: e.clientY, dx: 0, dy: 0, moved: false });
    setNamed(c.id);
    void playKey(`words/${c.id}`, { gap: 0 }); // touching an item says its name
  }
  function move(e: React.PointerEvent) {
    if (!drag || e.pointerId !== drag.pid) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    const moved = drag.moved || Math.hypot(dx, dy) > 10;
    setDrag({ ...drag, dx, dy, moved });
    if (moved) setHot(overTarget(drag.id));
  }
  function up(e: React.PointerEvent) {
    if (!drag || e.pointerId !== drag.pid) return;
    const d = drag;
    const over = d.moved ? overTarget(d.id) : null;
    setDrag(null);
    setHot(null);
    if (!d.moved || !over) {
      if (d.moved) { setBack(d.id); setTimeout(() => setBack(null), 420); }
      return;
    }
    if (round.accepts[d.id] === over) {
      sfx('yay');
      confettiAtElement(targetEls.current[over] ?? null, 12);
      const w = wrongs[d.id] ?? 0;
      logEvent({ game: 'sort', skill: 'words', result: w ? 'assisted' : 'correct', cardId: d.id, meta: { mode, wrong: w } });
      const next = [...placed, d.id];
      setPlaced(next);
      setFed((n) => n + 1);
      if (next.length >= needed) onDone();
    } else {
      sfx('boop');
      setWrongs((m) => ({ ...m, [d.id]: (m[d.id] ?? 0) + 1 }));
      setBack(d.id);
      setTimeout(() => setBack(null), 420);
    }
  }

  const hintFor = Object.entries(wrongs).find(([, n]) => n >= 2)?.[0];

  return (
    <>
      <div className="grid grid--sort">
        {round.items.map((c) => {
          const isDrag = drag?.id === c.id;
          const gone = placed.includes(c.id);
          return (
            <button
              key={c.id}
              ref={(el) => { itemEls.current[c.id] = el; }}
              type="button"
              className={`item ${isDrag && drag?.moved ? 'dragging' : ''} ${back === c.id ? 'back' : ''} ${gone ? 'gone' : ''} ${hintFor === c.id && round.accepts[c.id] ? 'hint' : ''}`}
              style={isDrag && drag?.moved ? { transform: `translate(${drag.dx}px, ${drag.dy}px) scale(1.1) rotate(-3deg)` } : undefined}
              onPointerDown={(e) => down(e, c)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={up}
              aria-label={c.word}
            >
              <CardFace card={c} />
              {named === c.id && <span className="cap">{c.word}</span>}
            </button>
          );
        })}
      </div>
      <div className={`targets targets--${round.targets.length}`}>
        {round.targets.map((t) => (
          <div key={t.id} ref={(el) => { targetEls.current[t.id] = el; }} className={`target ${hot === t.id ? 'hot' : ''}`} role="img" aria-label={t.label}>
            {t.node}
            {(mode === 'feed' || mode === 'dress') && fed > 0 && <span className="target__fx" key={fed}>{mode === 'feed' ? '😋' : '✨'}</span>}
          </div>
        ))}
      </div>
    </>
  );
}
