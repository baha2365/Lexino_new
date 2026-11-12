import type { GameId, LexEvent, PlanDay, Result, SkillId } from './types';
import { GAMES, SKILLS } from './content';
import { GUIDES } from './guides';

/** How much an attempt counts towards a skill. `null` = engagement only, not scored. */
export function scoreOf(r: Result): number | null {
  switch (r) {
    case 'correct':
    case 'said':
    case 'requested':
      return 1;
    case 'assisted':
    case 'tried':
    case 'vocalized':
      return 0.5;
    case 'not_yet':
      return 0;
    default:
      return null; // 'done' = engagement only
  }
}

export type TrackStatus = 'none' | 'emerging' | 'consistent';
export interface TrackStat {
  skill: SkillId;
  status: TrackStatus;
  avg: number | null; // last 14 days
  n: number;
  prevAvg: number | null; // the 14 days before that
}

export interface Summary {
  daysPracticed: number;
  minutes: number;
  activities: number;
  requests: number;
  vocalized: number;
  streak: number;
  week: { key: string; label: string; minutes: number; count: number }[];
  tracks: Record<SkillId, TrackStat>;
  byGame: Record<GameId, number>;
}

const DAY = 86400000;
export const dayKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** A day's play time: gaps shorter than 2 minutes count as playing, plus 15 s per burst. */
export function estimateMinutes(times: number[]): number {
  if (!times.length) return 0;
  const t = [...times].sort((a, b) => a - b);
  let sec = 15;
  for (let i = 1; i < t.length; i++) {
    const gap = (t[i] - t[i - 1]) / 1000;
    sec += gap <= 120 ? gap : 15;
  }
  return Math.max(1, Math.round(sec / 60));
}

function avgOf(evs: LexEvent[], skill: SkillId): { avg: number | null; n: number } {
  let sum = 0;
  let n = 0;
  for (const e of evs) {
    if (e.skill !== skill) continue;
    const s = scoreOf(e.result);
    if (s === null) continue;
    sum += s;
    n++;
  }
  return { avg: n ? sum / n : null, n };
}

export function summarize(events: LexEvent[], now: Date = new Date()): Summary {
  const nowMs = now.getTime();
  const todayKey = dayKey(now);

  // last 7 days (today last)
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(nowMs - (6 - i) * DAY);
    return { key: dayKey(d), label: WD[d.getDay()], minutes: 0, count: 0 };
  });
  const byDay = new Map<string, number[]>();
  for (const e of events) {
    const t = new Date(e.ts);
    const k = dayKey(t);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(t.getTime());
  }
  let minutes = 0;
  let activities = 0;
  for (const w of week) {
    const times = byDay.get(w.key) ?? [];
    w.count = times.length;
    w.minutes = estimateMinutes(times);
    minutes += w.minutes;
    activities += times.length;
  }
  const daysPracticed = week.filter((w) => w.count > 0).length;

  // streak: consecutive days with play, ending today or yesterday
  let streak = 0;
  for (let i = byDay.has(todayKey) ? 0 : 1; i < 400; i++) {
    if (byDay.has(dayKey(new Date(nowMs - i * DAY)))) streak++;
    else break;
  }

  const weekStart = nowMs - 7 * DAY;
  const lastWeek = events.filter((e) => new Date(e.ts).getTime() >= weekStart);
  const requests = lastWeek.filter((e) => e.result === 'requested').length;
  const vocalized = lastWeek.filter((e) => e.result === 'vocalized').length;

  const recent = events.filter((e) => nowMs - new Date(e.ts).getTime() <= 14 * DAY);
  const before = events.filter((e) => {
    const age = nowMs - new Date(e.ts).getTime();
    return age > 14 * DAY && age <= 28 * DAY;
  });
  const tracks = {} as Record<SkillId, TrackStat>;
  for (const s of SKILLS) {
    const cur = avgOf(recent, s.id);
    const prev = avgOf(before, s.id);
    let status: TrackStatus = 'none';
    if (cur.n >= 3 && cur.avg !== null) status = cur.avg >= 0.75 && cur.n >= 8 ? 'consistent' : 'emerging';
    tracks[s.id] = { skill: s.id, status, avg: cur.avg, n: cur.n, prevAvg: prev.avg };
  }

  const byGame = Object.fromEntries(GAMES.map((g) => [g.id, 0])) as Record<GameId, number>;
  for (const e of lastWeek) byGame[e.game] = (byGame[e.game] ?? 0) + 1;

  return { daysPracticed, minutes, activities, requests, vocalized, streak, week, tracks, byGame };
}

export interface Insight {
  type: 'good' | 'info' | 'warn';
  text: string;
}

/** Plain-language notes for parents, generated from the numbers (no AI involved). */
export function insights(s: Summary, name: string): Insight[] {
  const out: Insight[] = [];
  if (s.activities === 0) {
    out.push({ type: 'info', text: `No games played in the last 7 days. Even 5 minutes a day helps ${name} – start with "Sound toys".` });
    return out;
  }
  const pct = (v: number | null) => Math.round((v ?? 0) * 100);
  const scored = SKILLS.map((k) => s.tracks[k.id]).filter((t) => t.n >= 5 && t.avg !== null);
  const best = [...scored].sort((a, b) => b.avg! - a.avg!)[0];
  const weakest = [...scored].sort((a, b) => a.avg! - b.avg!)[0];
  const label = (id: SkillId) => SKILLS.find((k) => k.id === id)!.label.toLowerCase();

  if (best && best.avg! >= 0.7) out.push({ type: 'good', text: `Strongest area: ${label(best.skill)} (${pct(best.avg)}% of recent tries went well).` });
  if (weakest && weakest !== best && weakest.avg! < 0.6) out.push({ type: 'warn', text: `${name} needs the most support with ${label(weakest.skill)} (${pct(weakest.avg)}%). Play those games together, and keep it playful.` });
  for (const t of scored) {
    if (t.prevAvg !== null && t.avg! - t.prevAvg >= 0.15) out.push({ type: 'good', text: `Progress in ${label(t.skill)}: up ${pct(t.avg! - t.prevAvg)} points compared with the two weeks before.` });
  }
  if (s.requests > 0) out.push({ type: 'good', text: `${name} asked for things ${s.requests} time${s.requests === 1 ? '' : 's'} with picture cards this week. Every request counts as communication.` });
  if (s.vocalized > 0) out.push({ type: 'info', text: `The microphone noticed ${name}'s voice ${s.vocalized} time${s.vocalized === 1 ? '' : 's'} this week (it only detects sound, not clarity).` });
  if (s.streak >= 3) out.push({ type: 'good', text: `${s.streak} days in a row – a great routine.` });
  else if (s.daysPracticed < 3) out.push({ type: 'info', text: `${s.daysPracticed} day${s.daysPracticed === 1 ? '' : 's'} of play this week. Short sessions on more days work better than one long one.` });
  return out;
}

/** Orders skills so the ones that need practice come first. */
export function skillPriority(s: Summary): SkillId[] {
  const rank = (t: TrackStat) => (t.status === 'emerging' ? 0 + (t.avg ?? 0) : t.status === 'none' ? 1 : 2 + (t.avg ?? 0));
  return SKILLS.map((k) => k.id).sort((a, b) => rank(s.tracks[a]) - rank(s.tracks[b]));
}

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** A starting point the specialist can edit: 3 focus skills, a rest day, a free-choice day. */
export function suggestPlan(s: Summary, name: string): { goal: string; days: PlanDay[] } {
  const order = skillPriority(s).slice(0, 3);
  const label = (id: SkillId) => SKILLS.find((k) => k.id === id)!.label;
  const days: PlanDay[] = WEEK.map((day, i) => {
    if (day === 'Wed') return { day, focus: 'Rest day', games: [], minutes: 0, task: 'No games today. Look at a picture book together and name what you see.' };
    if (day === 'Sun') return { day, focus: 'Free choice', games: ['pairs', 'sound-toys'], minutes: 8, task: `Let ${name} choose the games. Celebrate the week together!` };
    const skill = order[i % order.length];
    const games = GAMES.filter((g) => g.skill === skill).map((g) => g.id);
    const g = games[i % games.length];
    return {
      day,
      focus: label(skill),
      games: [g, ...(skill === 'communication' ? [] : (['request'] as GameId[]))].slice(0, 2),
      minutes: 8,
      task: GUIDES[g].homeTasks[i % GUIDES[g].homeTasks.length],
    };
  });
  return { goal: `This week: ${order.map((id) => label(id).toLowerCase()).join(', ')}.`, days };
}

export const weekdayName = (d: Date = new Date()): string => WEEK[(d.getDay() + 6) % 7];

/** The four games on the child's home screen today. */
export function todaysMix(s: Summary, plan: { days: PlanDay[] } | null, now: Date = new Date()): GameId[] {
  const planned = plan?.days.find((d) => d.day === weekdayName(now))?.games ?? [];
  const mix: GameId[] = [...planned];
  for (const skill of skillPriority(s)) {
    const options = GAMES.filter((g) => g.skill === skill && !mix.includes(g.id));
    if (options.length) mix.push(options[(now.getDate() + mix.length) % options.length].id);
    if (mix.length >= 4) break;
  }
  for (const g of GAMES) if (mix.length < 4 && !mix.includes(g.id)) mix.push(g.id);
  return mix.slice(0, 4);
}
