export type SkillId = 'sounds' | 'understanding' | 'words' | 'phrases' | 'communication' | 'play';

export type GameId =
  | 'sound-toys'
  | 'echo'
  | 'pick'
  | 'sort'
  | 'pairs'
  | 'build'
  | 'scenes'
  | 'request';

/**
 * What happened in one attempt.
 *  correct    – picked / placed the right thing on the first try
 *  assisted   – got it right after a hint or after a wrong try
 *  said       – adult confirmed the child said the word / sound
 *  requested  – child asked for something with a card or word
 *  tried      – adult saw a real attempt
 *  vocalized  – the microphone heard the child make sounds (no judgement of clarity)
 *  done       – engagement only (tapped, played) – never scored
 *  not_yet    – adult says: not yet
 */
export type Result =
  | 'correct'
  | 'assisted'
  | 'said'
  | 'requested'
  | 'tried'
  | 'vocalized'
  | 'done'
  | 'not_yet';

export interface LexEvent {
  id: string;
  childId: string;
  ts: string; // ISO
  game: GameId;
  skill: SkillId;
  cardId?: string;
  result: Result;
  meta?: Record<string, unknown>;
}

export interface Child {
  id: string;
  name: string;
  birthYear?: number;
  inviteCode?: string;
  ownerId?: string;
}

/** 0 = not yet, 1 = sometimes / with help, 2 = consistently */
export type Level3 = 0 | 1 | 2;

export interface Assessment {
  id: string;
  childId: string;
  ts: string;
  scores: Record<string, Level3>;
  notes?: string;
  byName?: string;
}

export interface PlanDay {
  day: string; // Mon..Sun
  focus: string;
  games: GameId[];
  minutes: number;
  task: string;
}

export interface Plan {
  childId: string;
  goal: string;
  days: PlanDay[];
  updatedAt?: string;
}

export type Role = 'parent' | 'logoped';
