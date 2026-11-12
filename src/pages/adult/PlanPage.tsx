import { useEffect, useState } from 'react';
import { GAMES } from '../../lib/content';
import { suggestPlan, summarize } from '../../lib/analytics';
import { loadEvents, loadPlan, savePlan } from '../../lib/repo';
import type { GameId, Plan, PlanDay } from '../../lib/types';
import { useAdult } from './ctx';

export function PlanPage() {
  const { child } = useAdult();
  const [goal, setGoal] = useState('');
  const [days, setDays] = useState<PlanDay[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!child) return;
    setLoaded(false);
    loadPlan(child.id)
      .then((p) => { setGoal(p?.goal ?? ''); setDays(p?.days ?? []); })
      .catch((e) => setMsg(e instanceof Error ? e.message : 'Could not load'))
      .finally(() => setLoaded(true));
  }, [child]);

  if (!child) return <p>Pick or add a child first (Account &amp; settings).</p>;
  if (!loaded) return <p className="muted">Loading…</p>;

  async function suggest() {
    if (!child) return;
    const s = suggestPlan(summarize(await loadEvents(child.id)), child.name);
    setGoal(s.goal);
    setDays(s.days);
    setMsg('Suggestion made from the last weeks of play. Edit anything, then save.');
  }
  async function save() {
    if (!child) return;
    const plan: Plan = { childId: child.id, goal, days };
    try { await savePlan(plan); setMsg('✓ Plan saved. Tomorrow’s home screen will use it.'); }
    catch (e) { setMsg(e instanceof Error ? e.message : 'Could not save'); }
  }
  const patch = (i: number, p: Partial<PlanDay>) => setDays((d) => d.map((x, k) => (k === i ? { ...x, ...p } : x)));
  const toggle = (i: number, g: GameId) => patch(i, { games: days[i].games.includes(g) ? days[i].games.filter((x) => x !== g) : [...days[i].games, g].slice(0, 3) });

  return (
    <>
      <section className="panel-a">
        <h2>Weekly plan – {child.name}</h2>
        <p className="muted">The games chosen for a day appear first on the child’s home screen. Specialists and parents can both edit.</p>
        <label className="field">Goal for the week
          <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Understand 5 new words, copy ma / pa / ba" />
        </label>
        <div className="row-btns">
          <button className="btn" type="button" onClick={() => void suggest()}>✨ Suggest from progress</button>
          <button className="btn btn--primary" type="button" onClick={() => void save()} disabled={!days.length}>Save plan</button>
        </div>
        {msg && <div className="note info">{msg}</div>}
      </section>

      {days.length === 0 && <p className="muted">No plan yet – press “Suggest from progress” to start from a draft.</p>}
      <div className="days">
        {days.map((d, i) => (
          <section key={d.day} className="day">
            <h3>{d.day}</h3>
            <input value={d.focus} onChange={(e) => patch(i, { focus: e.target.value })} aria-label="Focus" />
            <label className="muted">Minutes <input type="number" min={0} max={30} value={d.minutes} onChange={(e) => patch(i, { minutes: Number(e.target.value) || 0 })} /></label>
            <textarea rows={3} value={d.task} onChange={(e) => patch(i, { task: e.target.value })} aria-label="Task" />
            <div className="chips">
              {GAMES.map((g) => (
                <button key={g.id} type="button" className="chip chip--sm" aria-pressed={d.games.includes(g.id)} onClick={() => toggle(i, g.id)} title={g.title}>{g.emoji}</button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
