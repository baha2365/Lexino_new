import type { Assessment, Level3, SkillId } from './types';

/**
 * Initial diagnostic card: the 10 areas to observe before starting (from the specification).
 * Each item is rated 0 = not yet · 1 = sometimes / with help · 2 = consistently.
 * It is an observation checklist, not a medical diagnosis. The logoped can edit this list.
 */
export interface Domain {
  id: string;
  title: string;
  skill: SkillId; // which game skill track this area connects to
  items: { id: string; text: string }[];
}

export const DOMAINS: Domain[] = [
  { id: 'understanding', title: 'Understanding of spoken speech', skill: 'understanding', items: [
    { id: 'u1', text: 'Reacts to a calm, familiar voice (turns, stops, looks)' },
    { id: 'u2', text: 'Understands a routine phrase with a gesture ("come here", "bye-bye")' },
    { id: 'u3', text: 'Understands the same phrase without a gesture' },
  ] },
  { id: 'name', title: 'Response to own name', skill: 'play', items: [
    { id: 'n1', text: 'Turns or looks when called from the side' },
    { id: 'n2', text: 'Responds to the name while busy playing or in a noisy room' },
  ] },
  { id: 'joint', title: 'Joint attention', skill: 'play', items: [
    { id: 'j1', text: 'Follows the adult’s look or pointing finger' },
    { id: 'j2', text: 'Shows or gives an object to share interest' },
    { id: 'j3', text: 'Looks at the adult’s face when something surprising happens' },
  ] },
  { id: 'imitation', title: 'Imitation of movements and actions', skill: 'sounds', items: [
    { id: 'i1', text: 'Copies simple gestures (clap, wave)' },
    { id: 'i2', text: 'Copies actions with objects (stirring, drumming, feeding a doll)' },
    { id: 'i3', text: 'Copies mouth movements (tongue out, kiss, open wide)' },
  ] },
  { id: 'play', title: 'Object and play activity', skill: 'play', items: [
    { id: 'p1', text: 'Uses objects for their purpose (cup, brush, phone)' },
    { id: 'p2', text: 'Pretend play (feeds a doll, drives a car with sounds)' },
    { id: 'p3', text: 'Stays with one activity for 3+ minutes and takes turns' },
  ] },
  { id: 'names', title: 'Understanding names of objects and actions', skill: 'understanding', items: [
    { id: 'o1', text: 'Shows 5+ familiar objects when named' },
    { id: 'o2', text: 'Shows body parts when named' },
    { id: 'o3', text: 'Understands action words (sleep, drink, run, give)' },
  ] },
  { id: 'instructions', title: 'Following simple instructions', skill: 'understanding', items: [
    { id: 's1', text: 'Follows a one-step instruction ("Give me the ball")' },
    { id: 's2', text: 'Follows two steps in a row' },
    { id: 's3', text: 'Understands "Where?", "Who?", "What is doing?"' },
  ] },
  { id: 'speech', title: 'Sounds, syllables, sound imitations, words', skill: 'sounds', items: [
    { id: 'v1', text: 'Makes voice sounds on his or her own (cooing, babbling)' },
    { id: 'v2', text: 'Says syllables (ma, ba, pa) or repeated syllables' },
    { id: 'v3', text: 'Uses sound imitations (moo, beep) and/or real words' },
  ] },
  { id: 'requests', title: 'Expressing requests and wishes', skill: 'communication', items: [
    { id: 'r1', text: 'Reaches or looks to show what he or she wants' },
    { id: 'r2', text: 'Uses a gesture, card or sound to ask' },
    { id: 'r3', text: 'Uses a word to ask (more, give, help)' },
  ] },
  { id: 'initiative', title: 'Communicative initiative', skill: 'communication', items: [
    { id: 'c1', text: 'Starts interaction (brings an object, touches the adult, vocalizes for attention)' },
    { id: 'c2', text: 'Refuses or protests in a clear way' },
    { id: 'c3', text: 'Comments or shares ("look!" with pointing and a sound)' },
  ] },
];

export const ALL_ITEM_IDS = DOMAINS.flatMap((d) => d.items.map((i) => i.id));

/** Average of a domain, 0..2 (unrated items are skipped). null if nothing rated. */
export function domainScore(d: Domain, scores: Record<string, Level3 | undefined>): number | null {
  const vals = d.items.map((i) => scores[i.id]).filter((v): v is Level3 => v !== undefined);
  return vals.length ? vals.reduce<number>((a, b) => a + b, 0) / vals.length : null;
}

/** Latest vs. previous assessment, per domain. */
export function domainDynamics(assessments: Assessment[]) {
  const last = assessments[assessments.length - 1];
  const prev = assessments.length > 1 ? assessments[assessments.length - 2] : undefined;
  return DOMAINS.map((d) => {
    const now = last ? domainScore(d, last.scores) : null;
    const before = prev ? domainScore(d, prev.scores) : null;
    return { domain: d, now, before, delta: now !== null && before !== null ? now - before : null };
  });
}

export const LEVEL_LABEL: Record<Level3, string> = { 0: 'Not yet', 1: 'Sometimes', 2: 'Yes' };
