import { useEffect, useMemo, useRef, useState } from 'react';
import { cardsIn, type Card } from '../lib/content';
import { playFirst, playKey, sfx, stopAudio, preload } from '../lib/audio';
import { logEvent } from '../lib/repo';
import { sample, shuffle, wait, confettiAtElement } from '../lib/util';
import { CardFace } from '../components/CardFace';
import { AdultBar, type Rating } from '../components/AdultBar';
import { Dots } from '../components/Dots';
import { Finish } from '../components/Finish';

export function Scenes({ mode }: { mode: string }) {
  const [seed, setSeed] = useState(0);
  const [i, setI] = useState(0);
  const [finished, setFinished] = useState(false);
  const total = mode === 'bag' ? 6 : 5;
  const pool = useMemo(() => {
    const cats = mode === 'shop' ? cardsIn('food') : cardsIn('food', 'toys', 'animals', 'clothes', 'home');
    return sample(cats, total + 4);
  }, [mode, seed, total]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    preload(pool.map((c) => `words/${c.id}`));
    return () => stopAudio();
  }, [pool]);

  const next = () => (i + 1 >= total ? setFinished(true) : setI(i + 1));
  const k = `${mode}-${seed}-${i}`;
  const props = { pool, round: i, next };
  return (
    <div className="scene">
      <Dots total={total} done={i} />
      {mode === 'shop' && <Shop key={k} {...props} />}
      {mode === 'bag' && <Bag key={k} {...props} />}
      {mode === 'missing' && <Missing key={k} {...props} />}
      {finished && <Finish onAgain={() => { setFinished(false); setI(0); setSeed((s) => s + 1); }} />}
    </div>
  );
}

interface P { pool: Card[]; round: number; next: () => void }

/* ---------------------------------------------------------------- shop */

function Shop({ pool, round, next }: P) {
  const shelf = useMemo(() => pool.slice(0, 6), [pool]);
  const target = shelf[round % shelf.length];
  const [bought, setBought] = useState(false);
  const [wrong, setWrong] = useState(0);
  const basket = useRef<HTMLDivElement>(null);

  useEffect(() => { void playFirst(['prompts/want-this', `words/${target.id}`], { gap: 300 }); }, [target]);

  function choose(c: Card, el: HTMLElement) {
    if (bought) return;
    if (c.id !== target.id) { sfx('boop'); setWrong((w) => w + 1); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return; }
    sfx('yay');
    confettiAtElement(basket.current, 14);
    logEvent({ game: 'scenes', skill: 'understanding', result: wrong ? 'assisted' : 'correct', cardId: c.id, meta: { scene: 'shop' } });
    setBought(true);
  }
  function rate(r: Rating | 'skip') {
    if (r !== 'skip') logEvent({ game: 'scenes', skill: 'words', result: r, cardId: target.id, meta: { scene: 'shop' } });
    next();
  }

  return (
    <>
      <button className="prompt" type="button" onClick={() => void playKey(`words/${target.id}`)}>
        <span className="spk" aria-hidden="true">🛒</span><span>Mom wants <b>{target.word}</b>. Can you find it?</span>
      </button>
      <div className="shelf">
        {shelf.map((c) => (
          <button key={c.id} type="button" className={`item ${bought && c.id === target.id ? 'gone' : ''} ${wrong >= 2 && c.id === target.id ? 'hint' : ''}`} onClick={(e) => choose(c, e.currentTarget)} aria-label={c.word}>
            <CardFace card={c} />
          </button>
        ))}
      </div>
      <div className="basket" ref={basket} aria-label="Basket">🧺{bought && <span className="basket__in"><CardFace card={target} /></span>}</div>
      {bought && <AdultBar onRate={rate} prompt={`Grown-up: ask “${target.word}, please!” – did they say it?`} />}
    </>
  );
}

/* ---------------------------------------------------------- mystery bag */

function Bag({ pool, round, next }: P) {
  const item = pool[round];
  const [out, setOut] = useState(false);

  async function pull() {
    if (out) return;
    sfx('whoosh');
    setOut(true);
    await playFirst(['prompts/what-is-it'], { gap: 600 });
  }
  async function rate(r: Rating | 'skip') {
    if (r !== 'skip') logEvent({ game: 'scenes', skill: 'words', result: r, cardId: item.id, meta: { scene: 'bag' } });
    await playKey(`words/${item.id}`, { gap: 700 }); // the child hears the word as a model
    next();
  }

  return (
    <>
      <div className="prompt prompt--static"><span>{out ? <>What is it? 🤔</> : <>What is in the bag?</>}</span></div>
      <button type="button" className={`bag ${out ? 'open' : ''}`} onClick={() => void pull()} aria-label="Mystery bag">
        <span className="bag__bag">👜</span>
        {out && <span className="bag__item"><CardFace card={item} /></span>}
      </button>
      {out && <AdultBar onRate={(r) => void rate(r)} prompt="Grown-up: ask “What is it?” – give the word if needed." />}
    </>
  );
}

/* ------------------------------------------------------ what's missing */

function Missing({ pool, round, next }: P) {
  const shown = useMemo(() => pool.slice(round % 2, (round % 2) + 3), [pool, round]);
  const gone = shown[round % 3];
  const options = useMemo(() => shuffle([gone, ...pool.filter((c) => !shown.includes(c)).slice(0, 2)]), [gone, pool, shown]);
  const [phase, setPhase] = useState<'look' | 'cover' | 'guess' | 'won'>('look');
  const [wrong, setWrong] = useState(0);
  const row = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      await wait(2800);
      if (!alive) return;
      setPhase('cover');
      await wait(1500);
      if (!alive) return;
      setPhase('guess');
    })();
    return () => { alive = false; };
  }, []);

  async function guess(c: Card, el: HTMLElement) {
    if (phase !== 'guess') return;
    if (c.id !== gone.id) { sfx('boop'); setWrong((w) => w + 1); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return; }
    sfx('yay');
    confettiAtElement(row.current, 14);
    logEvent({ game: 'scenes', skill: 'play', result: wrong ? 'assisted' : 'correct', cardId: gone.id, meta: { scene: 'missing' } });
    setPhase('won');
    await playKey(`words/${gone.id}`, { gap: 600 });
    await wait(500);
    next();
  }

  return (
    <>
      <div className="prompt prompt--static">
        <span>{phase === 'look' ? 'Look carefully! 👀' : phase === 'cover' ? 'Shh… close your eyes 🙈' : 'What is missing?'}</span>
      </div>
      <div className={`tray ${phase}`} ref={row}>
        {shown.map((c) => (
          <div key={c.id} className={`item item--static ${(phase === 'guess' || phase === 'won' || phase === 'cover') && c.id === gone.id ? 'vanish' : ''}`}><CardFace card={c} /></div>
        ))}
        <div className="cloth" aria-hidden="true">🧣</div>
      </div>
      {(phase === 'guess' || phase === 'won') && (
        <div className="grid grid--pick n3">
          {options.map((c) => (
            <button key={c.id} type="button" className={`item ${wrong >= 2 && c.id === gone.id ? 'hint' : ''}`} onClick={(e) => void guess(c, e.currentTarget)} aria-label={c.word}><CardFace card={c} /></button>
          ))}
        </div>
      )}
    </>
  );
}
