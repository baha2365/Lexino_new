import { describe, expect, it } from 'vitest';
import { estimateMinutes, insights, scoreOf, skillPriority, suggestPlan, summarize, todaysMix } from './analytics';
import { domainDynamics, domainScore, DOMAINS } from './domains';
import { poseOnScript, scriptFor, SHAPES } from './mouth';
import { CARDS, GAMES, ECHO_LEVELS, TRAIN_WORDS } from './content';
import { GUIDES } from './guides';
import type { Level3, LexEvent, Result, SkillId } from './types';

const NOW = new Date('2026-11-14T10:00:00');
let n = 0;
const ev = (skill: SkillId, result: Result, minsAgo: number, game: LexEvent['game'] = 'pick'): LexEvent => ({
  id: String(++n), childId: 'c', ts: new Date(NOW.getTime() - minsAgo * 60000).toISOString(), game, skill, result,
});

describe('scoring', () => {
  it('scores attempts, never scores plain engagement', () => {
    expect(scoreOf('correct')).toBe(1);
    expect(scoreOf('said')).toBe(1);
    expect(scoreOf('assisted')).toBe(0.5);
    expect(scoreOf('not_yet')).toBe(0);
    expect(scoreOf('done')).toBeNull();
  });
});

describe('summarize', () => {
  it('handles no events', () => {
    const s = summarize([], NOW);
    expect(s.activities).toBe(0);
    expect(s.week).toHaveLength(7);
    expect(Object.values(s.tracks).every((t) => t.status === 'none')).toBe(true);
    expect(insights(s, 'Aliya')[0].text).toMatch(/No games played/);
  });

  it('estimates minutes from bursts, not from tap counts', () => {
    expect(estimateMinutes([])).toBe(0);
    expect(estimateMinutes([0])).toBe(1);
    const t = Array.from({ length: 12 }, (_, i) => i * 30000); // 12 taps, 30 s apart = ~5.5 min
    expect(estimateMinutes(t)).toBeGreaterThanOrEqual(5);
    expect(estimateMinutes([0, 3_600_000])).toBe(1); // an hour apart = two separate bursts
  });

  it('builds tracks: consistent needs enough good tries', () => {
    const good = Array.from({ length: 9 }, (_, i) => ev('understanding', 'correct', i + 1));
    const few = [ev('words', 'correct', 5), ev('words', 'correct', 6)];
    const mixed = Array.from({ length: 6 }, (_, i) => ev('phrases', i % 2 ? 'correct' : 'not_yet', i + 1, 'build'));
    const s = summarize([...good, ...few, ...mixed], NOW);
    expect(s.tracks.understanding.status).toBe('consistent');
    expect(s.tracks.words.status).toBe('none');
    expect(s.tracks.phrases.status).toBe('emerging');
    expect(s.daysPracticed).toBe(1);
    expect(s.streak).toBe(1);
  });

  it('counts requests and sees progress against the earlier two weeks', () => {
    const old = Array.from({ length: 6 }, (_, i) => ev('communication', 'not_yet', 20 * 24 * 60 + i, 'request'));
    const now = [...Array.from({ length: 6 }, (_, i) => ev('communication', 'requested', i + 1, 'request'))];
    const s = summarize([...old, ...now], NOW);
    expect(s.requests).toBe(6);
    expect(s.tracks.communication.prevAvg).toBe(0);
    expect(s.tracks.communication.avg).toBe(1);
    expect(insights(s, 'Aliya').some((i) => /Progress in/.test(i.text))).toBe(true);
  });
});

describe('plan & home mix', () => {
  it('suggests a 7-day plan with a rest day and real games', () => {
    const s = summarize([ev('words', 'not_yet', 3, 'sort'), ev('words', 'not_yet', 2, 'sort'), ev('words', 'tried', 1, 'sort')], NOW);
    const { goal, days } = suggestPlan(s, 'Aliya');
    expect(days.map((d) => d.day)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(days.find((d) => d.day === 'Wed')!.minutes).toBe(0);
    expect(goal).toMatch(/words/i);
    for (const d of days) for (const g of d.games) expect(GAMES.some((x) => x.id === g)).toBe(true);
    expect(skillPriority(s)[0]).toBe('words'); // emerging comes before "no data"
  });

  it('home screen always offers four different games and honours the plan', () => {
    const s = summarize([], NOW);
    const mix = todaysMix(s, null, NOW);
    expect(mix).toHaveLength(4);
    expect(new Set(mix).size).toBe(4);
    const planned = todaysMix(s, { days: [{ day: 'Sat', focus: 'x', games: ['echo'], minutes: 5, task: '' }] }, NOW); // 2026-11-14 is a Saturday
    expect(planned[0]).toBe('echo');
  });
});

describe('diagnostic', () => {
  it('averages a domain and shows change between two assessments', () => {
    const d = DOMAINS[0];
    const first = Object.fromEntries(d.items.map((i) => [i.id, 0 as Level3]));
    const second = Object.fromEntries(d.items.map((i) => [i.id, 2 as Level3]));
    expect(domainScore(d, first)).toBe(0);
    expect(domainScore(d, {})).toBeNull();
    const dyn = domainDynamics([
      { id: '1', childId: 'c', ts: '2026-10-01', scores: first },
      { id: '2', childId: 'c', ts: '2026-11-01', scores: second },
    ]);
    expect(dyn[0].delta).toBe(2);
    expect(dyn[1].now).toBeNull();
  });
  it('covers the 10 areas from the specification', () => expect(DOMAINS).toHaveLength(10));
});

describe('mascot mouth scripts', () => {
  it('lip sounds close the lips, vowels open the mouth', () => {
    const ma = scriptFor('ma');
    expect(ma[0].shape).toBe('M');
    expect(ma[1].shape).toBe('A');
    expect(poseOnScript(ma, 0.2).press).toBeGreaterThan(0.5); // start: lips together
    expect(poseOnScript(ma, 0.55).open).toBeGreaterThan(0.5); // then wide open
    expect(poseOnScript(ma, 1).open).toBeLessThan(0.05); // ends at rest
    expect(scriptFor('ma-ma').filter((k) => k.shape === 'M')).toHaveLength(2);
    expect(scriptFor('ta')[0].shape).toBe('L');
    expect(scriptFor('u')[0].shape).toBe('U');
    expect(SHAPES.U.wide).toBe(-1);
  });
  it('every sound in the echo levels has a script', () => {
    for (const id of Object.values(ECHO_LEVELS).flat()) expect(scriptFor(id).length).toBeGreaterThan(1);
  });
});

describe('content integrity', () => {
  it('has unique card ids and a guide for every game', () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
    for (const g of GAMES) expect(GUIDES[g.id].steps.length).toBeGreaterThan(2);
    expect(GAMES).toHaveLength(8);
  });
  it('train words spell out their id', () => {
    for (const w of TRAIN_WORDS) expect(w.syllables.join('-')).toBe(w.id);
  });
});
