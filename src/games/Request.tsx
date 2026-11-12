import { useEffect, useMemo, useRef, useState } from 'react';
import { AAC_BY_ID, AAC_CORE, AAC_THINGS, type AacCard } from '../lib/content';
import { playFirst, sfx, stopAudio } from '../lib/audio';
import { logEvent } from '../lib/repo';
import { sample, shuffle, wait, confettiAtElement } from '../lib/util';
import { Dots } from '../components/Dots';
import { Finish } from '../components/Finish';

const say = (c: AacCard) => playFirst([`aac/${c.id}`, `words/${c.id}`], { gap: 450 });

export function Request({ mode }: { mode: string }) {
  useEffect(() => () => stopAudio(), []);
  if (mode === 'ask') return <AskFor />;
  if (mode === 'help') return <HelpMe />;
  return <Board />;
}

function CardBtn({ c, onClick, className = '' }: { c: AacCard; onClick: (el: HTMLElement) => void; className?: string }) {
  return (
    <button type="button" className={`aac ${className}`} style={{ ['--c' as string]: c.color }} onClick={(e) => onClick(e.currentTarget)}>
      <span className="aac__emoji">{c.emoji}</span>
      <span className="aac__word">{c.word}</span>
    </button>
  );
}

/* ----------------------------------------------------------- free talk board */

function Board() {
  const [strip, setStrip] = useState<AacCard[]>([]);
  const [page, setPage] = useState<'core' | 'things'>('core');
  const [speaking, setSpeaking] = useState(-1);
  const busy = useRef(false);

  function add(c: AacCard) {
    sfx('tap');
    void say(c);
    setStrip((s) => (s.length >= 4 ? s : [...s, c]));
  }
  async function speak() {
    if (!strip.length || busy.current) return;
    busy.current = true;
    logEvent({ game: 'request', skill: 'communication', result: 'requested', cardId: strip.map((c) => c.id).join('+'), meta: { mode: 'board', cards: strip.map((c) => c.id) } });
    for (let k = 0; k < strip.length; k++) {
      setSpeaking(k);
      await say(strip[k]);
    }
    setSpeaking(-1);
    sfx('yay');
    busy.current = false;
  }

  return (
    <div className="aacboard">
      <div className="strip">
        <div className="strip__cards">
          {strip.length === 0 && <span className="strip__hint">Tap cards to say what you want 👇</span>}
          {strip.map((c, k) => (
            <span key={k} className={`strip__card ${speaking === k ? 'on' : ''}`} style={{ ['--c' as string]: c.color }}>
              <span>{c.emoji}</span><small>{c.word}</small>
            </span>
          ))}
        </div>
        <button type="button" className="pill go" onClick={() => void speak()} disabled={!strip.length}>🔊 Say it</button>
        <button type="button" className="chip chip--icon" aria-label="Clear" onClick={() => setStrip([])} disabled={!strip.length}>✖</button>
      </div>
      <nav className="modes">
        <button className="chip" aria-pressed={page === 'core'} type="button" onClick={() => setPage('core')}>Words</button>
        <button className="chip" aria-pressed={page === 'things'} type="button" onClick={() => setPage('things')}>Things</button>
      </nav>
      <div className="grid grid--aac">
        {(page === 'core' ? AAC_CORE : AAC_THINGS).map((c) => <CardBtn key={c.id} c={c} onClick={() => add(c)} />)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------- "I want ___" rounds */

function AskFor() {
  const [seed, setSeed] = useState(0);
  const items = useMemo(() => sample(AAC_THINGS.filter((t) => t.id !== 'mom'), 4), [seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [step, setStep] = useState<'want' | 'item' | 'got'>('want');
  const [finished, setFinished] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const target = items[i];
  const options = useMemo(() => shuffle(sample(items, 3).concat(target)).filter((v, k, a) => a.indexOf(v) === k), [items, target]);

  async function pickWant(c: AacCard) {
    sfx('tap');
    await say(c);
    setStep('item');
  }
  async function pickItem(c: AacCard, el: HTMLElement) {
    sfx('tap');
    void say(c);
    if (c.id !== target.id) { sfx('boop'); return; } // any item is a valid request in real life; here we keep the story simple
    logEvent({ game: 'request', skill: 'communication', result: 'requested', cardId: `want+${c.id}`, meta: { mode: 'ask' } });
    sfx('yay');
    confettiAtElement(el, 14);
    setStep('got');
    await wait(1800);
    if (i + 1 >= items.length) setFinished(true);
    else { setI(i + 1); setStep('want'); }
  }

  return (
    <div className="ask">
      <Dots total={items.length} done={i} />
      <div className="ask__stage" ref={box}>
        <span className="ask__who">{step === 'got' ? '😋' : '🐻'}</span>
        <div className="speech">{step === 'got' ? `Yum! ${target.word}!` : <>Teddy wants <b>{target.word}</b> {target.emoji}</>}</div>
        <span className={`ask__thing ${step === 'got' ? 'given' : ''}`}>{target.emoji}</span>
      </div>
      <p className="hint-line">{step === 'want' ? 'Tap “I want”' : step === 'item' ? 'Now tap what Teddy wants' : '🎉'}</p>
      <div className="grid grid--aac small">
        {step === 'want' && <CardBtn c={AAC_BY_ID.want} onClick={() => void pickWant(AAC_BY_ID.want)} />}
        {step === 'item' && options.map((c) => <CardBtn key={c.id} c={c} onClick={(el) => void pickItem(c, el)} />)}
      </div>
      {finished && <Finish onAgain={() => { setFinished(false); setI(0); setStep('want'); setSeed((s) => s + 1); }} title="Great asking!" />}
    </div>
  );
}

/* ---------------------------------------------- help / more / stop scenarios */

type Scenario = 'help' | 'more' | 'stop';
const SCEN: Record<Scenario, { prompt: string; emoji: string; done: string }> = {
  help: { prompt: 'The jar is stuck! What can you say?', emoji: '🫙', done: '🍪 Thank you!' },
  more: { prompt: 'Teddy loves cookies! One is not enough…', emoji: '🍪', done: '🍪🍪🍪 Yummy!' },
  stop: { prompt: 'The ball is rolling away! What can you say?', emoji: '⚽', done: '✋ Phew, it stopped!' },
};

function HelpMe() {
  const [seed, setSeed] = useState(0);
  const rounds = useMemo<Scenario[]>(() => shuffle<Scenario>(['help', 'more', 'stop', 'help', 'more', 'stop']), [seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);
  const [finished, setFinished] = useState(false);
  const s = rounds[i];
  const cards = useMemo(() => shuffle(['help', 'more', 'stop'].map((id) => AAC_BY_ID[id])), [i, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setWrong(0); setDone(false); }, [i]);

  async function pick(c: AacCard, el: HTMLElement) {
    if (done) return;
    void say(c);
    if (c.id !== s) { sfx('boop'); setWrong((w) => w + 1); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return; }
    logEvent({ game: 'request', skill: 'communication', result: wrong ? 'assisted' : 'requested', cardId: c.id, meta: { mode: 'help', wrong } });
    sfx('yay');
    confettiAtElement(el, 14);
    setDone(true);
    await wait(2000);
    if (i + 1 >= rounds.length) setFinished(true);
    else setI(i + 1);
  }

  return (
    <div className="ask">
      <Dots total={rounds.length} done={i} />
      <div className="prompt prompt--static"><span>{SCEN[s].prompt}</span></div>
      <div className={`ask__stage scen scen--${s} ${done ? 'solved' : ''}`}>
        <span className="scen__thing">{done && s === 'more' ? '🍪🍪🍪' : SCEN[s].emoji}</span>
        {done && <div className="speech">{SCEN[s].done}</div>}
      </div>
      <div className="grid grid--aac small">
        {cards.map((c) => <CardBtn key={c.id} c={c} className={wrong >= 2 && c.id === s ? 'hint' : ''} onClick={(el) => void pick(c, el)} />)}
      </div>
      {finished && <Finish onAgain={() => { setFinished(false); setI(0); setSeed((x) => x + 1); }} title="You asked so well!" />}
    </div>
  );
}
