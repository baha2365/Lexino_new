import { useSettings } from '../lib/settings';
import type { Result } from '../lib/types';

export type Rating = Extract<Result, 'said' | 'tried' | 'not_yet'>;

/**
 * The grown-up's one-tap rating. Children never see a score – only the adult does.
 * With co-play turned off in Settings we show a plain "Next" button instead.
 */
export function AdultBar({
  onRate,
  prompt = 'Grown-up: how did it go?',
  labels,
}: {
  onRate: (r: Rating | 'skip') => void;
  prompt?: string;
  labels?: Partial<Record<Rating, string>>;
}) {
  const { coplay } = useSettings();
  if (!coplay) {
    return (
      <div className="adultbar adultbar--next">
        <button className="pill go" type="button" onClick={() => onRate('skip')}>
          Next ➜
        </button>
      </div>
    );
  }
  const L = { said: 'Said it', tried: 'Tried', not_yet: 'Not yet', ...labels };
  return (
    <div className="adultbar" role="group" aria-label="Grown-up rating">
      <span className="adultbar__prompt">{prompt}</span>
      <div className="adultbar__row">
        <button type="button" className="rate rate--yes" onClick={() => onRate('said')}>✅ {L.said}</button>
        <button type="button" className="rate rate--try" onClick={() => onRate('tried')}>🙂 {L.tried}</button>
        <button type="button" className="rate rate--no" onClick={() => onRate('not_yet')}>⏳ {L.not_yet}</button>
        <button type="button" className="rate rate--skip" onClick={() => onRate('skip')} aria-label="Skip">➜</button>
      </div>
    </div>
  );
}
