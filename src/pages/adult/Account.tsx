import { useState } from 'react';
import { signIn, signOut, signUp, useAuth } from '../../lib/auth';
import { cloudConfigured } from '../../lib/supabase';
import { createChild, linkChildByCode, renameChild } from '../../lib/repo';
import { setSettings, useSettings } from '../../lib/settings';
import { releaseMic } from '../../lib/voice';
import type { Role } from '../../lib/types';
import { useAdult } from './ctx';

export function Account() {
  const auth = useAuth();
  const { kids, reload, child } = useAdult();
  const settings = useSettings();
  return (
    <>
      <section className="panel-a">
        <h2>Settings</h2>
        <label className="switch"><input type="checkbox" checked={settings.coplay} onChange={(e) => setSettings({ coplay: e.target.checked })} />
          <span><b>Grown-up rating bar</b><small>After sound and word games, you tap “Said it / Tried / Not yet”. This is what feeds the progress tracks.</small></span></label>
        <label className="switch"><input type="checkbox" checked={settings.slow} onChange={(e) => setSettings({ slow: e.target.checked })} />
          <span><b>Slow audio 🐢</b><small>Plays recordings at 75% speed.</small></span></label>
        <label className="switch"><input type="checkbox" checked={settings.listen} onChange={(e) => { setSettings({ listen: e.target.checked }); if (!e.target.checked) releaseMic(); }} />
          <span><b>Listen for my child’s voice 🎤</b><small>Uses the microphone to notice <i>whether</i> your child makes a sound. Nothing is recorded or sent anywhere, and clarity is never judged.</small></span></label>
      </section>

      {!cloudConfigured && (
        <section className="panel-a">
          <h2>Local mode</h2>
          <p>Everything is saved on this device only. To share progress with a logoped and sync across devices, the app needs its Supabase keys (see README → “Turn on accounts”).</p>
        </section>
      )}

      {cloudConfigured && !auth.session && <SignIn />}
      {auth.session && (
        <section className="panel-a">
          <h2>Account</h2>
          <p>{auth.name} · <b>{auth.role === 'logoped' ? 'Specialist (logoped)' : 'Parent'}</b></p>
          <button className="btn" type="button" onClick={() => void signOut()}>Sign out</button>
        </section>
      )}

      {auth.role !== 'logoped' && <Kids kids={kids} reload={reload} cloud={!!auth.session} />}
      {auth.role === 'logoped' && <Link2 reload={reload} kids={kids} />}
      {child && auth.role !== 'logoped' && child.inviteCode && auth.session && (
        <section className="panel-a">
          <h2>Share with your logoped</h2>
          <p>Ask your specialist to create a specialist account and enter this code for <b>{child.name}</b>:</p>
          <p className="code">{child.inviteCode}</p>
        </section>
      )}
    </>
  );
}

function SignIn() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [role, setRole] = useState<Role>('parent');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const err = mode === 'in' ? await signIn(email, pw) : await signUp(email, pw, role, name || email);
    setBusy(false);
    setMsg(err ?? (mode === 'up' ? 'Account created. If email confirmation is on, check your inbox, then sign in.' : null));
  }

  return (
    <section className="panel-a">
      <h2>{mode === 'in' ? 'Sign in' : 'Create account'}</h2>
      <form onSubmit={submit} className="form">
        {mode === 'up' && (
          <>
            <div className="seg" role="radiogroup" aria-label="I am">
              <button type="button" role="radio" aria-checked={role === 'parent'} className={`seg__b ${role === 'parent' ? 'on' : ''}`} onClick={() => setRole('parent')}>I’m a parent</button>
              <button type="button" role="radio" aria-checked={role === 'logoped'} className={`seg__b ${role === 'logoped' ? 'on' : ''}`} onClick={() => setRole('logoped')}>I’m a logoped</button>
            </div>
            <label className="field">Your name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
          </>
        )}
        <label className="field">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
        <label className="field">Password<input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} /></label>
        {msg && <div className="note warn">{msg}</div>}
        <button className="btn btn--primary" type="submit" disabled={busy}>{mode === 'in' ? 'Sign in' : 'Create account'}</button>
        <button className="linkbtn" type="button" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}</button>
      </form>
    </section>
  );
}

function Kids({ kids, reload, cloud }: { kids: { id: string; name: string; birthYear?: number }[]; reload: () => Promise<void>; cloud: boolean }) {
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [err, setErr] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createChild(name.trim(), year ? Number(year) : undefined);
      setName(''); setYear(''); setErr(null);
      await reload();
    } catch (x) { setErr(x instanceof Error ? x.message : 'Could not add'); }
  }

  return (
    <section className="panel-a">
      <h2>Children {cloud ? '' : <small className="muted">(on this device)</small>}</h2>
      <ul className="kids">
        {kids.map((k) => (
          <li key={k.id}>
            <input defaultValue={k.name} aria-label="Child name" onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== k.name) void renameChild(k.id, v).then(reload); }} />
            {k.birthYear && <span className="muted">born {k.birthYear}</span>}
          </li>
        ))}
      </ul>
      <form className="form form--row" onSubmit={add}>
        <label className="field">Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Child’s first name" /></label>
        <label className="field">Birth year<input inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="2022" /></label>
        <button className="btn btn--primary" type="submit">Add child</button>
      </form>
      {err && <div className="note warn">{err}</div>}
    </section>
  );
}

function Link2({ reload, kids }: { reload: () => Promise<void>; kids: { id: string; name: string }[] }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  async function link(e: React.FormEvent) {
    e.preventDefault();
    try {
      const c = await linkChildByCode(code);
      setMsg(`✓ Linked ${c.name}`);
      setCode('');
      await reload();
    } catch (x) { setMsg(x instanceof Error ? x.message : 'Could not link'); }
  }
  return (
    <section className="panel-a">
      <h2>Your children</h2>
      <ul className="kids">{kids.map((k) => <li key={k.id}>{k.name}</li>)}</ul>
      <form className="form form--row" onSubmit={link}>
        <label className="field">Parent’s invite code<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="8 characters" /></label>
        <button className="btn btn--primary" type="submit" disabled={!code.trim()}>Link child</button>
      </form>
      {msg && <div className="note info">{msg}</div>}
    </section>
  );
}
