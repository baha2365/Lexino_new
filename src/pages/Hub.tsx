import { useNavigate } from 'react-router-dom';
import { GAMES } from '../lib/content';
import { unlockAudio } from '../lib/audio';

export function Hub() {
  const nav = useNavigate();
  return (
    <div className="screen">
      <header className="bar">
        <button className="chip chip--icon" type="button" aria-label="Back" onClick={() => nav('/')}>⬅</button>
        <div className="bar__title">All games</div>
        <span />
      </header>
      <main className="stage stage--scroll">
        <div className="hub">
          {GAMES.map((g) => (
            <button key={g.id} type="button" className="tile-game tile-game--wide" style={{ ['--c' as string]: g.color }} onClick={() => { unlockAudio(); nav(`/play/${g.id}`); }}>
              <span className="tile-game__emoji">{g.emoji}</span>
              <span className="tile-game__text"><b>{g.title}</b><small>{g.tagline}</small></span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
