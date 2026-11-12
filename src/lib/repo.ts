import { supabase } from './supabase';
import { getAuth, isCloud } from './auth';
import type { Assessment, Child, GameId, LexEvent, Plan, Result, SkillId } from './types';

/**
 * Data layer. Two modes, same API:
 *  - local : everything lives in this browser (works with no account, no internet)
 *  - cloud : signed in with Supabase – children, assessments, plans live in the database;
 *            game events are queued in an outbox and synced whenever we are online.
 */

const K = {
  children: 'lexino:children',
  active: 'lexino:active',
  events: 'lexino:events',
  outbox: 'lexino:outbox',
  assessments: 'lexino:assessments',
  plans: 'lexino:plans',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / private mode */
  }
}
const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
        const r = (Math.random() * 16) | 0;
        return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

/* ----------------------------------------------------------------- children */

export async function listChildren(): Promise<Child[]> {
  if (isCloud() && supabase) {
    const { data, error } = await supabase
      .from('children')
      .select('id, name, birth_year, invite_code, owner_id')
      .order('created_at');
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      birthYear: (r.birth_year as number | null) ?? undefined,
      inviteCode: r.invite_code as string,
      ownerId: r.owner_id as string,
    }));
  }
  let list = read<Child[]>(K.children, []);
  if (!list.length) {
    list = [{ id: uid(), name: 'Little one' }];
    write(K.children, list);
  }
  return list;
}

export async function createChild(name: string, birthYear?: number): Promise<Child> {
  if (isCloud() && supabase) {
    const owner = getAuth().session!.user.id;
    const { data, error } = await supabase
      .from('children')
      .insert({ name, birth_year: birthYear ?? null, owner_id: owner })
      .select('id, name, birth_year, invite_code, owner_id')
      .single();
    if (error) throw error;
    return { id: data.id, name: data.name, birthYear: data.birth_year ?? undefined, inviteCode: data.invite_code, ownerId: data.owner_id };
  }
  const child: Child = { id: uid(), name, birthYear };
  write(K.children, [...read<Child[]>(K.children, []), child]);
  return child;
}

export async function renameChild(id: string, name: string): Promise<void> {
  if (isCloud() && supabase) {
    const { error } = await supabase.from('children').update({ name }).eq('id', id);
    if (error) throw error;
    return;
  }
  write(K.children, read<Child[]>(K.children, []).map((c) => (c.id === id ? { ...c, name } : c)));
}

export async function linkChildByCode(code: string): Promise<Child> {
  if (!supabase) throw new Error('Cloud is not configured.');
  const { data, error } = await supabase.rpc('link_child', { code: code.trim().toLowerCase() });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as { id: string; name: string };
  return { id: row.id, name: row.name };
}

export const getActiveChildId = (): string | null => {
  try {
    return localStorage.getItem(K.active);
  } catch {
    return null;
  }
};
export function setActiveChildId(id: string): void {
  try {
    localStorage.setItem(K.active, id);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('lexino:child'));
}

/** The child currently playing (creates a default one in local mode). */
export async function resolveActiveChild(): Promise<Child | null> {
  const list = await listChildren();
  const saved = getActiveChildId();
  const found = list.find((c) => c.id === saved) ?? list[0] ?? null;
  if (found && found.id !== saved) setActiveChildId(found.id);
  return found;
}

/* ------------------------------------------------------------------- events */

export interface EventInput {
  game: GameId;
  skill: SkillId;
  result: Result;
  cardId?: string;
  meta?: Record<string, unknown>;
}

let flushing = false;

/** Fire-and-forget: record one attempt. Never throws, never blocks play. */
export function logEvent(input: EventInput): void {
  const childId = getActiveChildId();
  if (!childId) return;
  if (isCloud() && getAuth().role === 'logoped') return; // therapists browse; children's events come from the family device
  const ev: LexEvent = { id: uid(), childId, ts: new Date().toISOString(), ...input };
  if (isCloud()) {
    write(K.outbox, [...read<LexEvent[]>(K.outbox, []), ev]);
    void flushOutbox();
  } else {
    const all = read<LexEvent[]>(K.events, []);
    all.push(ev);
    write(K.events, all.slice(-8000));
  }
}

export async function flushOutbox(): Promise<void> {
  if (flushing || !supabase || !isCloud()) return;
  const queue = read<LexEvent[]>(K.outbox, []);
  if (!queue.length) return;
  flushing = true;
  try {
    const rows = queue.map((e) => ({
      id: e.id,
      child_id: e.childId,
      ts: e.ts,
      game: e.game,
      skill: e.skill,
      card_id: e.cardId ?? null,
      result: e.result,
      meta: e.meta ?? null,
    }));
    const { error } = await supabase.from('events').upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
    if (!error) {
      const sent = new Set(queue.map((e) => e.id));
      write(K.outbox, read<LexEvent[]>(K.outbox, []).filter((e) => !sent.has(e.id)));
    }
  } catch {
    /* offline – try again later */
  } finally {
    flushing = false;
  }
}
if (typeof window !== 'undefined') window.addEventListener('online', () => void flushOutbox());

export async function loadEvents(childId: string, sinceDays = 60): Promise<LexEvent[]> {
  const since = new Date(Date.now() - sinceDays * 86400000).toISOString();
  if (isCloud() && supabase) {
    await flushOutbox();
    const { data, error } = await supabase
      .from('events')
      .select('id, child_id, ts, game, skill, card_id, result, meta')
      .eq('child_id', childId)
      .gte('ts', since)
      .order('ts', { ascending: true })
      .limit(20000);
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      childId: r.child_id,
      ts: r.ts,
      game: r.game,
      skill: r.skill,
      cardId: r.card_id ?? undefined,
      result: r.result,
      meta: r.meta ?? undefined,
    }));
  }
  return read<LexEvent[]>(K.events, []).filter((e) => e.childId === childId && e.ts >= since);
}

/* -------------------------------------------------------------- assessments */

export async function loadAssessments(childId: string): Promise<Assessment[]> {
  if (isCloud() && supabase) {
    const { data, error } = await supabase
      .from('assessments')
      .select('id, child_id, ts, scores, notes')
      .eq('child_id', childId)
      .order('ts', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => ({ id: r.id, childId: r.child_id, ts: r.ts, scores: r.scores, notes: r.notes ?? undefined }));
  }
  return read<Assessment[]>(K.assessments, []).filter((a) => a.childId === childId);
}

export async function saveAssessment(a: Omit<Assessment, 'id' | 'ts'>): Promise<void> {
  if (isCloud() && supabase) {
    const { error } = await supabase.from('assessments').insert({ child_id: a.childId, scores: a.scores, notes: a.notes ?? null });
    if (error) throw error;
    return;
  }
  write(K.assessments, [...read<Assessment[]>(K.assessments, []), { ...a, id: uid(), ts: new Date().toISOString() }]);
}

/* -------------------------------------------------------------------- plans */

export async function loadPlan(childId: string): Promise<Plan | null> {
  if (isCloud() && supabase) {
    const { data, error } = await supabase.from('plans').select('child_id, goal, days, updated_at').eq('child_id', childId).maybeSingle();
    if (error) throw error;
    return data ? { childId: data.child_id, goal: data.goal ?? '', days: data.days ?? [], updatedAt: data.updated_at } : null;
  }
  return read<Plan[]>(K.plans, []).find((p) => p.childId === childId) ?? null;
}

export async function savePlan(p: Plan): Promise<void> {
  if (isCloud() && supabase) {
    const { error } = await supabase
      .from('plans')
      .upsert({ child_id: p.childId, goal: p.goal, days: p.days, updated_at: new Date().toISOString() });
    if (error) throw error;
    return;
  }
  write(K.plans, [...read<Plan[]>(K.plans, []).filter((x) => x.childId !== p.childId), { ...p, updatedAt: new Date().toISOString() }]);
}
