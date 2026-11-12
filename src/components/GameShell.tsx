import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAME_BY_ID } from '../lib/content';
import { GUIDES } from '../lib/guides';
import { setSettings, useSettings } from '../lib/settings';
import { stopAudio } from '../lib/audio';
import type { GameId } from '../lib/types';

/** Top bar, mode chips, "?" guide sheet and slow-audio toggle shared by every game. */
export function GameShell({ id, children }: { id: GameId; children: (mode: string) => ReactNode }) {
  const meta = GAME_BY_ID[id];
  const nav = useNavigate();
  const [mode, setMode] = useState(meta.modes[0].id);
  const [help, setHelp] = useState(false);
  const { slow } = useSettings();
  const guide = GUIDES[id];

  return (
    <div className="screen game" style={{ ['--accent' as string]: meta.color }}>
      <header className="bar">
        <button className="chip chip--icon" type="button" aria-label="Back" onClick={() => { stopAudio(); nav('/'); }}>⬅</button>
        <div className="bar__title">
          <span aria-hidden="true">{meta.emoji}</span> {meta.title}
        </div>
        <div className="tools">
          <button className="chip chip--icon" type="button" aria-pressed={slow} aria-label="Slow audio" onClick={() => setSettings({ slow: !slow })}>🐢</button>
          <button className="chip chip--icon" type="button" aria-label="Tips for grown-ups" onClick={() => setHelp(true)}>?</button>
        </div>
      </header>

      {meta.modes.length > 1 && (
        <nav className="modes" aria-label="Choose a version">
          {meta.modes.map((m) => (
            <button key={m.id} type="button" className="chip" aria-pressed={m.id === mode} onClick={() => { stopAudio(); setMode(m.id); }}>
              {m.label}
            </button>
          ))}
        </nav>
      )}

      <main className="stage" key={mode}>{children(mode)}</main>

      {help && (
        <div className="overlay" onClick={() => setHelp(false)}>
          <div className="panel panel--sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Tips for grown-ups">
            <h2>{meta.title} – for grown-ups</h2>
            <p><b>Goal.</b> {guide.goal}</p>
            <h3>How to play together</h3>
            <ol>{guide.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            <h3>Coaching tips</h3>
            <ul>{guide.tips.map((s) => <li key={s}>{s}</li>)}</ul>
            <button className="pill" type="button" onClick={() => setHelp(false)}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}
