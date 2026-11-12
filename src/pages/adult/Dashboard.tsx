import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GAMES, SKILLS } from '../../lib/content';
import { insights, summarize } from '../../lib/analytics';
import { loadAssessments, loadEvents, loadPlan } from '../../lib/repo';
import { domainDynamics, LEVEL_LABEL } from '../../lib/domains';
import type { Assessment, LexEvent, Plan } from '../../lib/types';
import { useAdult } from './ctx';

const STATUS = { none: 'No data yet', emerging: 'Emerging', consistent: 'Consistent' } as const;

export function Dashboard() {
  const { child, kids } = useAdult();
  const [events, setEvents] = useState<LexEvent[]>([]);
  const [assess, setAssess] = useState<Assessment[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!child) { setBusy(false); return; }
    let off = false;
    setBusy(true);
    Promise.all([loadEvents(child.id), loadAssessments(child.id), loadPlan(child.id)])
      .then(([e, a, p]) => { if (!off) { setEvents(e); setAssess(a); setPlan(p); setErr(null); } })
      .catch((x) => !off && setErr(x instanceof Error ? x.message : 'Could not load'))
      .finally(() => !off && setBusy(false));
    return () => { off = true; };
  }, [child]);

  const s = useMemo(() => summarize(events), [events]);
  const notes = useMemo(() => insights(s, child?.name ?? 'Your child'), [s, child]);
  const dyn = useMemo(() => domainDynamics(assess), [assess]);

  if (!child) {
    return (
      <section className="panel-a">
        <h2>No child yet</h2>
        <p>{kids.length === 0 ? 'Add a child (parents) or link one with an invite code (specialists) in' : 'Pick a child above, or open'} <Link to="/adult/account">Account &amp; settings</Link>.</p>
      </section>
    );
  }
  if (busy) return <p className="muted">Loading {child.name}’s progress…</p>;

  const maxMin = Math.max(...s.week.map((w) => w.minutes), 1);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).slice(0, 3);
  const todayPlan = plan?.days.find((d) => d.day === today);

  return (
    <>
      {err && <div className="note warn">{err}</div>}
      <h2 className="h-child">{child.name}{child.birthYear ? `, born ${child.birthYear}` : ''}</h2>

      <section className="stats" aria-label="Last 7 days">
        <Stat value={s.daysPracticed} label="Days played" note="last 7 days" />
        <Stat value={s.minutes} label="Minutes" note="estimated" />
        <Stat value={s.activities} label="Activities" note="taps & attempts" />
        <Stat value={s.requests} label="Requests made" note="with cards or words" />
      </section>

      <div className="cols">
        <section className="panel-a">
          <h2>Play this week</h2>
          <div className="chart" role="img" aria-label="Minutes per day">
            {s.week.map((w) => (
              <div key={w.key} className={`col ${w.count ? '' : 'zero'}`}>
                <span>{w.minutes ? `${w.minutes}m` : ''}</span>
                <i style={{ height: `${Math.max(w.minutes / maxMin * 100, 4)}%` }} />
                <span>{w.label}</span>
              </div>
            ))}
          </div>
          {s.streak > 1 && <p className="muted">🔥 {s.streak}-day streak</p>}
        </section>

        <section className="panel-a">
          <h2>Skill tracks</h2>
          <p className="muted">From the last 14 days of games. Not a diagnosis – a guide for what to practice.</p>
          {SKILLS.map((k) => {
            const t = s.tracks[k.id];
            const delta = t.avg !== null && t.prevAvg !== null ? Math.round((t.avg - t.prevAvg) * 100) : null;
            return (
              <div key={k.id} className="track">
                <div className="track__head">
                  <span>{k.emoji} {k.label}</span>
                  <span className={`tag ${t.status}`}>{STATUS[t.status]}</span>
                </div>
                <div className="bar-a"><i style={{ width: `${Math.round((t.avg ?? 0) * 100)}%` }} /></div>
                <small className="muted">
                  {t.n ? `${t.n} scored tries` : k.blurb}
                  {delta !== null && delta !== 0 && <b className={delta > 0 ? 'up' : 'down'}> {delta > 0 ? '▲' : '▼'} {Math.abs(delta)} pts</b>}
                </small>
              </div>
            );
          })}
        </section>
      </div>

      <section className="panel-a">
        <h2>What we noticed</h2>
        <ul className="notes">{notes.map((n, k) => <li key={k} className={n.type}>{n.text}</li>)}</ul>
      </section>

      <div className="cols">
        <section className="panel-a">
          <h2>Diagnostic card {assess.length ? <small className="muted">· {new Date(assess[assess.length - 1].ts).toLocaleDateString()}</small> : null}</h2>
          {assess.length === 0 ? (
            <p>No assessment yet. <Link to="/adult/diagnostic">Fill in the starting card</Link> to set a baseline.</p>
          ) : (
            <>
              {dyn.map(({ domain, now, delta }) => (
                <div key={domain.id} className="track">
                  <div className="track__head"><span>{domain.title}</span><span className="muted">{now === null ? '–' : LEVEL_LABEL[Math.round(now) as 0 | 1 | 2]}{delta ? <b className={delta > 0 ? 'up' : 'down'}> {delta > 0 ? '▲' : '▼'}</b> : null}</span></div>
                  <div className="bar-a bar-a--blue"><i style={{ width: `${((now ?? 0) / 2) * 100}%` }} /></div>
                </div>
              ))}
              <Link to="/adult/diagnostic">Update the card →</Link>
            </>
          )}
        </section>

        <section className="panel-a">
          <h2>Plan</h2>
          {plan ? <p className="goal">{plan.goal}</p> : <p>No weekly plan yet. <Link to="/adult/plan">Create one</Link> (a suggestion is generated from the progress above).</p>}
          {todayPlan && <p><b>Today ({todayPlan.focus}):</b> {todayPlan.task}</p>}
          <h3>Games this week</h3>
          <ul className="gamelist">
            {GAMES.map((g) => <li key={g.id}><span>{g.emoji} {g.title}</span><b>{s.byGame[g.id]}</b></li>)}
          </ul>
        </section>
      </div>
    </>
  );
}

function Stat({ value, label, note }: { value: number | string; label: string; note: string }) {
  return <div className="stat"><b>{value}</b><span>{label}</span><em>{note}</em></div>;
}
