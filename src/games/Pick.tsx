import { useEffect, useMemo, useRef, useState } from 'react';
import { CARDS, cardsIn, type Card, type CatId } from '../lib/content';
import { playKey, sfx, stopAudio, preload } from '../lib/audio';
import { logEvent } from '../lib/repo';
import { sample, shuffle, wait, confettiAtElement } from '../lib/util';
import { CardFace } from '../components/CardFace';
import { Dots } from '../components/Dots';
import { Finish } from '../components/Finish';

interface Round { target: Card; options: Card[] }

const TOPICS: CatId[] = ['animals', 'food', 'transport', 'clothes', 'home', 'toys'];

function makeRounds(mode: string): Round[] {
  if (mode === 'body') {
    const body = cardsIn('body');
    return sample(body, 6).map((t) => ({ target: t, options: shuffle(sample(body.filter((b) => b.id !== t.id), 2).concat(t)) }));
  }
  if (mode === 'lotto') {
    const board = sample(CARDS.filter((c) => TOPICS.includes(c.cat)), 6);
    return shuffle(board).map((t) => ({ target: t, options: board }));
  }
  const n = Math.min(4, Math.max(2, parseInt(mode, 10) || 2));
  const rounds: Round[] = [];
  const pool = CARDS.filter((c) => TOPICS.includes(c.cat));
  for (const target of sample(pool, 8)) {
    const sameCat = pool.filter((c) => c.cat === target.cat && c.id !== target.id);
    const otherCat = pool.filter((c) => c.cat !== target.cat);
    // 2 cards: very different things. 3–4 cards: some from the same family, so listening matters.
    const distract = n === 2 ? sample(otherCat, 1) : [...sample(sameCat, Math.min(sameCat.length, n - 2)), ...sample(otherCat, 1)].slice(0, n - 1);
    rounds.push({ target, options: shuffle([target, ...distract]) });
  }
  return rounds;
}

export function Pick({ mode }: { mode: string }) {
  const [seed, setSeed] = useState(0);
  const rounds = useMemo(() => makeRounds(mode), [mode, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const lotto = mode === 'lotto';
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [covered, setCovered] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState(false);
  const grid = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const round = rounds[i];

  useEffect(() => {
    alive.current = true;
    preload(rounds.flatMap((r) => r.options.map((o) => `words/${o.id}`)));
    return () => { alive.current = false; stopAudio(); };
  }, [rounds]);

  async function ask() {
    await playKey('prompts/where-is', { gap: 0 });
    if (alive.current) await playKey(`words/${round.target.id}`, { gap: 300 });
  }
  useEffect(() => {
    setWrong([]);
    setLocked(false);
    const t = setTimeout(() => void ask(), 350);
    return () => clearTimeout(t);
  }, [i, rounds]); // eslint-disable-line react-hooks/exhaustive-deps

  async function choose(c: Card, el: HTMLElement) {
    if (locked || covered.includes(c.id)) return;
    if (c.id !== round.target.id) {
      sfx('boop');
      el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
      setWrong((w) => [...w, c.id]);
      return;
    }
    setLocked(true);
    sfx('yay');
    confettiAtElement(el, 14);
    logEvent({ game: 'pick', skill: 'understanding', result: wrong.length ? 'assisted' : 'correct', cardId: c.id, meta: { wrong: wrong.length, choices: round.options.length } });
    if (lotto) setCovered((x) => [...x, c.id]);
    await playKey(`words/${c.id}`, { gap: 500 });
    await wait(500);
    if (!alive.current) return;
    if (i + 1 >= rounds.length) setFinished(true);
    else setI(i + 1);
  }

  const hint = wrong.length >= 2;
  return (
    <div className="pick">
      <Dots total={rounds.length} done={i} />
      <button className="prompt" type="button" onClick={() => void ask()}>
        <span className="spk" aria-hidden="true">🔊</span>
        <span>Where is the <b>{round.target.word}</b>?</span>
      </button>
      <div ref={grid} className={`grid grid--pick n${round.options.length}`}>
        {round.options.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`item ${wrong.includes(c.id) ? 'dim' : ''} ${hint && c.id === round.target.id ? 'hint' : ''} ${covered.includes(c.id) ? 'covered' : ''}`}
            onClick={(e) => void choose(c, e.currentTarget)}
            aria-label={c.word}
          >
            <CardFace card={c} />
            {covered.includes(c.id) && <span className="check" aria-hidden="true">⭐</span>}
          </button>
        ))}
      </div>
      {finished && <Finish onAgain={() => { setFinished(false); setI(0); setCovered([]); setSeed((s) => s + 1); }} title="You found them all!" />}
    </div>
  );
}
