import { useCallback, useEffect, useRef, useState } from 'react';
import { ECHO_LEVELS } from '../lib/content';
import { stopAudio, preload } from '../lib/audio';
import { logEvent } from '../lib/repo';
import { useSettings } from '../lib/settings';
import { wait } from '../lib/util';
import { Mascot, type MascotHandle } from '../components/Mascot';
import { AdultBar, type Rating } from '../components/AdultBar';
import { ListenRing, useListen } from '../components/useListen';
import { Finish } from '../components/Finish';
import { Dots } from '../components/Dots';

export function Echo({ mode }: { mode: string }) {
  const items = ECHO_LEVELS[mode] ?? ECHO_LEVELS.vowels;
  const [idx, setIdx] = useState(0);
  const [closeUp, setCloseUp] = useState(false);
  const [turn, setTurn] = useState(false);
  const [heard, setHeard] = useState(false);
  const [done, setDone] = useState(false);
  const mascot = useRef<MascotHandle>(null);
  const { slow } = useSettings();
  const { listening, level, run, stop } = useListen();
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    preload(items.map((i) => `phonemes/${i}`));
    return () => {
      alive.current = false;
      stopAudio();
      stop();
    };
  }, [items, stop]);

  const current = items[idx];

  const demo = useCallback(async () => {
    setTurn(false);
    await wait(450);
    if (!alive.current) return;
    await mascot.current?.say(current, { slow });
    if (!alive.current) return;
    setTurn(true);
  }, [current, slow]);

  // each new sound: Lexi shows it, then it is the child's turn
  useEffect(() => {
    setHeard(false);
    void demo();
  }, [demo]);

  // optional microphone: notice that the child made a sound (never judge it)
  useEffect(() => {
    if (!turn) return;
    let cancelled = false;
    void run(4500).then((r) => {
      if (cancelled || !r) return;
      if (r.vocalized) {
        setHeard(true);
        logEvent({ game: 'echo', skill: 'sounds', result: 'vocalized', cardId: current });
      }
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [turn, current, run, stop]);

  function rate(r: Rating | 'skip') {
    if (r !== 'skip') logEvent({ game: 'echo', skill: 'sounds', result: r, cardId: current });
    stop();
    if (idx + 1 >= items.length) setDone(true);
    else setIdx(idx + 1);
  }

  return (
    <div className="echo">
      <Dots total={items.length} done={idx} />
      <div className="echo__mirror">
        <Mascot ref={mascot} closeUp={closeUp} />
        <div className="echo__label" aria-live="polite">{current.toUpperCase()}</div>
      </div>
      <div className="echo__status">
        {turn ? <b>Your turn! 🎤</b> : <b>Watch Lexi 👀</b>}
        {heard && <span className="heard">⭐ I heard you!</span>}
      </div>
      <div className="row">
        <button className="chip chip--big" type="button" onClick={() => void demo()}>🔁 Again</button>
        <button className="chip chip--big" type="button" aria-pressed={closeUp} onClick={() => setCloseUp((v) => !v)}>🔍 {closeUp ? 'Whole face' : 'Mouth'}</button>
      </div>
      <ListenRing listening={listening} level={level} />
      <AdultBar onRate={rate} prompt="Grown-up: did they copy the sound?" />
      {done && <Finish onAgain={() => { setDone(false); setIdx(0); }} title="Great copying!" />}
    </div>
  );
}
