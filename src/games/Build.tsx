import { useEffect, useMemo, useRef, useState } from 'react';
import { SENTENCES, SEQUENCES, TRAIN_WORDS, TWO_WORD_PHRASES, type Phrase, type Sequence, type TrainWord } from '../lib/content';
import { playFirst, playKey, sfx, stopAudio, preload } from '../lib/audio';
import { logEvent } from '../lib/repo';
import { sample, shuffle, wait, confettiAtElement } from '../lib/util';
import { Dots } from '../components/Dots';
import { Finish } from '../components/Finish';

export function Build({ mode }: { mode: string }) {
  const [seed, setSeed] = useState(0);
  const [i, setI] = useState(0);
  const [finished, setFinished] = useState(false);

  const rounds = useMemo(() => {
    if (mode === 'train') return sample(TRAIN_WORDS, 5);
    if (mode === 'two') return sample(TWO_WORD_PHRASES, 5);
    if (mode === 'sentence') return sample(SENTENCES, 4);
    return shuffle(SEQUENCES).slice(0, 4);
  }, [mode, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopAudio(), []);

  async function next() {
    await wait(1100);
    if (i + 1 >= rounds.length) setFinished(true);
    else setI(i + 1);
  }
  const k = `${mode}-${seed}-${i}`;
  const r = rounds[i];
  return (
    <div className="build">
      <Dots total={rounds.length} done={i} />
      {mode === 'train' && <Train key={k} onDone={next} word={r as TrainWord} />}
      {(mode === 'two' || mode === 'sentence') && <Words key={k} onDone={next} phrase={r as Phrase} mode={mode} />}
      {mode === 'steps' && <Steps key={k} onDone={next} seq={r as Sequence} />}
      {finished && <Finish onAgain={() => { setFinished(false); setI(0); setSeed((s) => s + 1); }} />}
    </div>
  );
}

/* ------------------------------------------------------------- syllable train */

function Train({ word, onDone }: { word: TrainWord; onDone: () => void }) {
  const tiles = useMemo(() => shuffle(word.syllables.map((s, k) => ({ s, k }))), [word]);
  const [placed, setPlaced] = useState<number[]>([]); // tile k's placed
  const [wrong, setWrong] = useState(0);
  const [go, setGo] = useState(false);
  const wagons = useRef<HTMLDivElement>(null);
  const done = placed.length === word.syllables.length;

  useEffect(() => { preload([`phrases/${word.id}`]); }, [word]);

  async function tap(t: { s: string; k: number }, el: HTMLElement) {
    if (done || placed.includes(t.k)) return;
    const expected = word.syllables[placed.length];
    if (t.s !== expected) { sfx('boop'); setWrong((w) => w + 1); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return; }
    sfx('pop');
    void playKey(`phonemes/${t.s}`, { gap: 0 });
    const next = [...placed, t.k];
    setPlaced(next);
    if (next.length === word.syllables.length) {
      logEvent({ game: 'build', skill: 'phrases', result: wrong ? 'assisted' : 'correct', cardId: word.id, meta: { mode: 'train', wrong } });
      confettiAtElement(wagons.current, 16);
      sfx('yay');
      setGo(true);
      await wait(700);
      await playFirst([`phrases/${word.id}`, `words/${word.id.replace(/-/g, '')}`]);
      onDone();
    }
  }

  return (
    <>
      <div className="prompt prompt--static"><span>Make the train say <b>{word.id.replace(/-/g, ' · ')}</b></span></div>
      <div className={`train ${go ? 'go' : ''}`} ref={wagons}>
        <span className="engine" aria-hidden="true">🚂</span>
        {word.syllables.map((s, k) => (
          <span key={k} className={`wagon ${placed.length > k ? 'full' : ''}`}>{placed.length > k ? s : ''}</span>
        ))}
        {done && <span className="train__pic" aria-hidden="true">{word.emoji}</span>}
      </div>
      <div className="tiles">
        {tiles.map((t) => (
          <button key={t.k} type="button" className={`tile ${placed.includes(t.k) ? 'used' : ''}`} onClick={(e) => void tap(t, e.currentTarget)}>{t.s}</button>
        ))}
      </div>
    </>
  );
}

/* --------------------------------------------------- two-word phrases, sentences */

function Words({ phrase, mode, onDone }: { phrase: Phrase; mode: string; onDone: () => void }) {
  const tiles = useMemo(() => shuffle(phrase.words.map((w, k) => ({ ...w, k }))), [phrase]);
  const [placed, setPlaced] = useState<number[]>([]);
  const [wrong, setWrong] = useState(0);
  const row = useRef<HTMLDivElement>(null);
  const done = placed.length === phrase.words.length;

  useEffect(() => { preload([`phrases/${phrase.id}`]); }, [phrase]);

  async function tap(t: { text: string; k: number }, el: HTMLElement) {
    if (done || placed.includes(t.k)) return;
    if (t.text !== phrase.words[placed.length].text) { sfx('boop'); setWrong((w) => w + 1); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return; }
    sfx('pop');
    const next = [...placed, t.k];
    setPlaced(next);
    if (next.length === phrase.words.length) {
      logEvent({ game: 'build', skill: 'phrases', result: wrong ? 'assisted' : 'correct', cardId: phrase.id, meta: { mode, wrong } });
      confettiAtElement(row.current, 16);
      sfx('yay');
      await wait(500);
      await playKey(`phrases/${phrase.id}`, { gap: 900 });
      onDone();
    }
  }

  return (
    <>
      <div className="scene-pic" aria-hidden="true">{phrase.words.map((w) => <span key={w.text}>{w.emoji}</span>)}</div>
      <div className="slots" ref={row}>
        {phrase.words.map((w, k) => (
          <div key={k} className={`slot ${placed.length > k ? 'full' : ''} ${placed.length === k ? 'next' : ''}`}>
            {placed.length > k ? <><span>{w.emoji}</span><b>{w.text}</b></> : <span className="slot__n">{k + 1}</span>}
          </div>
        ))}
      </div>
      <div className="tiles">
        {tiles.map((t) => (
          <button key={t.k} type="button" className={`tile tile--word ${placed.includes(t.k) ? 'used' : ''}`} onClick={(e) => void tap(t, e.currentTarget)}>
            <span>{t.emoji}</span> {t.text}
          </button>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------ picture steps */

function Steps({ seq, onDone }: { seq: Sequence; onDone: () => void }) {
  const tiles = useMemo(() => shuffle(seq.steps.map((s, k) => ({ ...s, k }))), [seq]);
  const [placed, setPlaced] = useState<number[]>([]);
  const [wrong, setWrong] = useState(0);
  const row = useRef<HTMLDivElement>(null);
  const done = placed.length === seq.steps.length;

  async function tap(t: { k: number }, el: HTMLElement) {
    if (done || placed.includes(t.k)) return;
    if (t.k !== placed.length) { sfx('boop'); setWrong((w) => w + 1); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return; }
    sfx('pop');
    const next = [...placed, t.k];
    setPlaced(next);
    if (next.length === seq.steps.length) {
      logEvent({ game: 'build', skill: 'phrases', result: wrong ? 'assisted' : 'correct', cardId: seq.id, meta: { mode: 'steps', wrong } });
      confettiAtElement(row.current, 16);
      sfx('yay');
      onDone();
    }
  }

  return (
    <>
      <div className="prompt prompt--static"><span><b>{seq.title}</b> – what happens first?</span></div>
      <div className="slots" ref={row}>
        {seq.steps.map((_s, k) => (
          <div key={k} className={`slot slot--pic ${placed.length > k ? 'full' : ''} ${placed.length === k ? 'next' : ''}`}>
            {placed.length > k ? <><span>{seq.steps[placed[k]].emoji}</span><small>{seq.steps[placed[k]].label}</small></> : <span className="slot__n">{k + 1}</span>}
          </div>
        ))}
      </div>
      <div className="tiles">
        {tiles.map((t) => (
          <button key={t.k} type="button" className={`tile tile--pic ${placed.includes(t.k) ? 'used' : ''}`} onClick={(e) => void tap(t, e.currentTarget)} aria-label={t.label}>
            <span>{t.emoji}</span>
          </button>
        ))}
      </div>
    </>
  );
}
