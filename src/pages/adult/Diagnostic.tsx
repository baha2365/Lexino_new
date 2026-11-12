import { useEffect, useState } from 'react';
import { ALL_ITEM_IDS, DOMAINS, domainScore, LEVEL_LABEL } from '../../lib/domains';
import { loadAssessments, saveAssessment } from '../../lib/repo';
import type { Assessment, Level3 } from '../../lib/types';
import { useAdult } from './ctx';

export function Diagnostic() {
  const { child } = useAdult();
  const [history, setHistory] = useState<Assessment[]>([]);
  const [scores, setScores] = useState<Record<string, Level3>>({});
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!child) return;
    loadAssessments(child.id)
      .then((h) => {
        setHistory(h);
        if (h.length) setScores(h[h.length - 1].scores); // start from the last card
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'Could not load'));
  }, [child]);

  if (!child) return <p>Pick or add a child first (Account &amp; settings).</p>;

  const rated = ALL_ITEM_IDS.filter((id) => scores[id] !== undefined).length;

  async function save() {
    if (!child) return;
    try {
      await saveAssessment({ childId: child.id, scores, notes: notes.trim() || undefined });
      setHistory(await loadAssessments(child.id));
      setNotes('');
      setSaved(true);
      setErr(null);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save');
    }
  }

  return (
    <>
      <section className="panel-a">
        <h2>Initial diagnostic card – {child.name}</h2>
        <p className="muted">
          Observe the child and mark each skill: <b>Not yet</b>, <b>Sometimes</b> (or with help), <b>Yes</b> (consistently).
          This is an observation checklist, not a medical diagnosis. Repeat every 4–6 weeks to see the dynamics.
          {history.length > 0 && ` Last saved: ${new Date(history[history.length - 1].ts).toLocaleDateString()} (answers pre-filled).`}
        </p>
        <p><b>{rated}</b> of {ALL_ITEM_IDS.length} marked</p>
      </section>

      {DOMAINS.map((d, di) => {
        const avg = domainScore(d, scores);
        return (
          <section key={d.id} className="panel-a">
            <h3>{di + 1}. {d.title} {avg !== null && <small className="muted">· {LEVEL_LABEL[Math.round(avg) as Level3]}</small>}</h3>
            {d.items.map((it) => (
              <div key={it.id} className="qrow">
                <span>{it.text}</span>
                <div className="seg" role="radiogroup" aria-label={it.text}>
                  {([0, 1, 2] as Level3[]).map((v) => (
                    <button key={v} type="button" role="radio" aria-checked={scores[it.id] === v} className={`seg__b v${v} ${scores[it.id] === v ? 'on' : ''}`} onClick={() => setScores((s) => ({ ...s, [it.id]: v }))}>
                      {LEVEL_LABEL[v]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        );
      })}

      <section className="panel-a">
        <h3>Notes</h3>
        <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observations, context, what to try next…" />
        {err && <div className="note warn">{err}</div>}
        <button className="btn btn--primary" type="button" onClick={() => void save()} disabled={rated === 0}>Save assessment</button>
        {saved && <span className="saved"> ✓ Saved</span>}
      </section>

      {history.length > 0 && (
        <section className="panel-a">
          <h3>History</h3>
          <table className="table">
            <thead><tr><th>Area</th>{history.map((h) => <th key={h.id}>{new Date(h.ts).toLocaleDateString()}</th>)}</tr></thead>
            <tbody>
              {DOMAINS.map((d) => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  {history.map((h) => {
                    const v = domainScore(d, h.scores);
                    return <td key={h.id} className={v === null ? '' : `heat h${Math.round(v)}`}>{v === null ? '–' : v.toFixed(1)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">Scale 0 (not yet) – 2 (consistently).</p>
        </section>
      )}
    </>
  );
}
