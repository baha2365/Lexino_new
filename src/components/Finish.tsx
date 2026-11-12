import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { confetti } from '../lib/util';
import { praise, sfx } from '../lib/audio';

export function Finish({ stars = 5, onAgain, title = 'You did it!' }: { stars?: number; onAgain: () => void; title?: string }) {
  const nav = useNavigate();
  useEffect(() => {
    sfx('win');
    confetti(window.innerWidth / 2, window.innerHeight / 2.4, 30);
    void praise();
  }, []);
  return (
    <div className="overlay">
      <div className="panel">
        <div className="stars" aria-hidden="true">{'★'.repeat(stars)}</div>
        <div className="word">{title}</div>
        <div className="row">
          <button className="pill" type="button" onClick={onAgain}>Play again</button>
          <button className="pill pill--alt" type="button" onClick={() => nav('/games')}>More games</button>
        </div>
      </div>
    </div>
  );
}
