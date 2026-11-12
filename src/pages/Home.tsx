import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAME_BY_ID } from '../lib/content';
import { todaysMix, summarize } from '../lib/analytics';
import { loadEvents, loadPlan } from '../lib/repo';
import { unlockAudio } from '../lib/audio';
import { useChildren } from '../lib/useChildren';
import { HoldButton } from '../components/HoldButton';
import type { GameId } from '../lib/types';

/** The child's home: four big buttons for today, plus "all games" and the always-available talk board. */
export function Home() {
  const nav = useNavigate();
  const { active, loading } = useChildren();
  const [mix, setMix] = useState<GameId[]>(['sound-toys', 'pick', 'echo', 'pairs']);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void (async () => {
      try {
        const [events, plan] = await Promise.all([loadEvents(active.id), loadPlan(active.id)]);
        if (!cancelled) setMix(todaysMix(summarize(events), plan));
      } catch {
        /* offline in cloud mode: keep the default mix */
      }
    })();
    return () => { cancelled = true; };
  }, [active]);

  const go = (path: string) => { unlockAudio(); nav(path); };

  return (
    <div className="screen home">
      <header className="bar">
        <div className="brand">Lexino</div>
        <HoldButton label="Grown-ups: press and hold" onDone={() => nav('/adult')}>🔒</HoldButton>
      </header>
      <main className="stage">
        <h1 className="hello">{loading ? '…' : <>Hi{active ? `, ${active.name}` : ''}! 👋</>}</h1>
        <p className="sub">Let’s play!</p>
        <div className="mix">
          {mix.map((id) => {
            const g = GAME_BY_ID[id];
            return (
              <button key={id} type="button" className="tile-game" style={{ ['--c' as string]: g.color }} onClick={() => go(`/play/${id}`)}>
                <span className="tile-game__emoji">{g.emoji}</span>
                <span className="tile-game__title">{g.title}</span>
              </button>
            );
          })}
        </div>
        <div className="row">
          <button type="button" className="pill pill--alt" onClick={() => go('/games')}>All games</button>
          <button type="button" className="pill" onClick={() => go('/play/request')}>💬 Talk</button>
        </div>
      </main>
    </div>
  );
}
