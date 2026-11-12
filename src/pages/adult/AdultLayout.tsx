import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { cloudConfigured } from '../../lib/supabase';
import { useChildren } from '../../lib/useChildren';
import type { AdultCtx } from './ctx';

const TABS = [
  { to: '/adult', label: 'Progress', end: true },
  { to: '/adult/diagnostic', label: 'Diagnostic' },
  { to: '/adult/plan', label: 'Weekly plan' },
  { to: '/adult/guides', label: 'Guides' },
  { to: '/adult/account', label: 'Account & settings' },
];

export function AdultLayout() {
  const nav = useNavigate();
  const auth = useAuth();
  const { children, active, choose, reload, loading, error } = useChildren();
  const ctx: AdultCtx = { child: active, kids: children, reload };

  return (
    <div className="adult">
      <header className="adult__head">
        <div>
          <h1>Lexino for grown-ups</h1>
          <p className="muted">
            {auth.session ? `${auth.role === 'logoped' ? 'Specialist' : 'Parent'} · ${auth.name}` : cloudConfigured ? 'Not signed in – data stays on this device' : 'Local mode – data stays on this device'}
          </p>
        </div>
        <div className="adult__head-actions">
          {children.length > 0 && (
            <label className="picker">
              <span className="muted">Child</span>
              <select value={active?.id ?? ''} onChange={(e) => choose(e.target.value)}>
                {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          )}
          <button className="btn" type="button" onClick={() => nav('/')}>▶ Back to games</button>
        </div>
      </header>

      <nav className="adult__tabs" aria-label="Sections">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `tab ${isActive ? 'on' : ''}`}>{t.label}</NavLink>
        ))}
      </nav>

      <main className="adult__main">
        {error && <div className="note warn">{error}</div>}
        {loading ? <p className="muted">Loading…</p> : <Outlet context={ctx} />}
      </main>
    </div>
  );
}
