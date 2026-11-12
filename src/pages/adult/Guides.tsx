import { GAMES, SKILLS } from '../../lib/content';
import { GUIDES } from '../../lib/guides';

export function Guides() {
  return (
    <>
      <section className="panel-a">
        <h2>Method guides</h2>
        <p className="muted">
          One page per game: goal, skills, materials, steps for the specialist or parent, home tasks and how to judge the result.
          Many activities use real toys – the screen is only one tool.
        </p>
        <button className="btn" type="button" onClick={() => window.print()}>🖨 Print</button>
      </section>
      {GAMES.map((g) => {
        const x = GUIDES[g.id];
        const skill = SKILLS.find((s) => s.id === g.skill)!;
        return (
          <section key={g.id} className="panel-a guide">
            <h2>{g.emoji} {g.title} <small className="muted">· tracks “{skill.label}”</small></h2>
            <p><b>Goal.</b> {x.goal}</p>
            <div className="cols">
              <div><h3>Skills</h3><ul>{x.skills.map((s) => <li key={s}>{s}</li>)}</ul></div>
              <div><h3>Materials</h3><ul>{x.materials.map((s) => <li key={s}>{s}</li>)}</ul></div>
            </div>
            <h3>Step by step</h3>
            <ol>{x.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            <div className="cols">
              <div><h3>Coaching tips</h3><ul>{x.tips.map((s) => <li key={s}>{s}</li>)}</ul></div>
              <div><h3>Home tasks</h3><ul>{x.homeTasks.map((s) => <li key={s}>{s}</li>)}</ul></div>
            </div>
            <h3>Criteria – what success looks like</h3>
            <ul>{x.criteria.map((s) => <li key={s}>{s}</li>)}</ul>
          </section>
        );
      })}
    </>
  );
}
