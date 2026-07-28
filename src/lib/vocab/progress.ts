// Local, device-only study progress for the ISEE vocabulary trainer.
// Leitner box scheduling: box 0 = never studied, 5 = mastered.
// ASCII-only.

import type { Level } from "@/types/vocab";

export const STORAGE_KEY = "isee-vocab-v1";

/** Days until a word in each box comes up for review again. */
export const BOX_INTERVAL_DAYS = [0, 1, 2, 4, 8, 21];
export const MAX_BOX = 5;
/** A word counts as "mastered" once it survives to this box. */
export const MASTERY_BOX = 4;

export const DAY_MS = 86400000;

export interface WordProgress {
  box: number;
  seen: number;
  correct: number;
  /** Consecutive correct answers, reset by a miss. */
  streak: number;
  lastSeen: number;
  due: number;
}

export interface VocabState {
  version: 1;
  words: Record<string, WordProgress>;
  starred: string[];
  level: Level;
  dailyGoal: number;
  /** Read each new word aloud automatically. */
  autoSpeak: boolean;
  today: { day: string; reviewed: number };
  streak: { current: number; best: number; lastDay: string };
}

export function emptyProgress(): WordProgress {
  return { box: 0, seen: 0, correct: 0, streak: 0, lastSeen: 0, due: 0 };
}

export function initialState(): VocabState {
  return {
    version: 1,
    words: {},
    starred: [],
    level: "middle",
    dailyGoal: 20,
    autoSpeak: false,
    today: { day: dayKey(), reviewed: 0 },
    streak: { current: 0, best: 0, lastDay: "" },
  };
}

/** Local-date key, e.g. "2026-07-28". Local (not UTC) so streaks match a kid's day. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function previousDayKey(): string {
  return dayKey(new Date(Date.now() - DAY_MS));
}

// --- persistence ------------------------------------------------------------

export function loadState(): VocabState {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Partial<VocabState>;
    const base = initialState();
    const state: VocabState = {
      ...base,
      ...parsed,
      words: parsed.words ?? {},
      starred: parsed.starred ?? [],
      today: parsed.today ?? base.today,
      streak: parsed.streak ?? base.streak,
      version: 1,
    };
    return rollDay(state);
  } catch {
    return initialState();
  }
}

export function saveState(state: VocabState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing or a full quota: studying still works, it just
    // will not be remembered. Nothing useful to surface here.
  }
}

/** Resets the day counter (and lapsed streak) when the calendar day changes. */
export function rollDay(state: VocabState): VocabState {
  const today = dayKey();
  if (state.today.day === today) return state;

  const last = state.streak.lastDay;
  const brokeStreak = last !== "" && last !== today && last !== previousDayKey();
  return {
    ...state,
    today: { day: today, reviewed: 0 },
    streak: brokeStreak ? { ...state.streak, current: 0 } : state.streak,
  };
}

// --- scoring ----------------------------------------------------------------

/** Applies one answer, returning the next state. Pure: safe to call in a reducer. */
export function applyAnswer(
  state: VocabState,
  wordId: string,
  correct: boolean,
  now: number = Date.now()
): VocabState {
  const prev = state.words[wordId] ?? emptyProgress();
  const box = correct ? Math.min(prev.box + 1, MAX_BOX) : 1;
  const next: WordProgress = {
    box,
    seen: prev.seen + 1,
    correct: prev.correct + (correct ? 1 : 0),
    streak: correct ? prev.streak + 1 : 0,
    lastSeen: now,
    due: now + BOX_INTERVAL_DAYS[box] * DAY_MS,
  };

  const rolled = rollDay(state);
  const today = dayKey(new Date(now));
  const streak =
    rolled.streak.lastDay === today
      ? rolled.streak
      : {
          current: rolled.streak.lastDay === previousDayKey() ? rolled.streak.current + 1 : 1,
          best: Math.max(
            rolled.streak.best,
            rolled.streak.lastDay === previousDayKey() ? rolled.streak.current + 1 : 1
          ),
          lastDay: today,
        };

  return {
    ...rolled,
    words: { ...rolled.words, [wordId]: next },
    today: { day: today, reviewed: rolled.today.reviewed + 1 },
    streak,
  };
}

export function toggleStar(state: VocabState, wordId: string): VocabState {
  const has = state.starred.includes(wordId);
  return {
    ...state,
    starred: has ? state.starred.filter((id) => id !== wordId) : [...state.starred, wordId],
  };
}

/** Clears progress for one level, or for everything when level is omitted. */
export function resetProgress(state: VocabState, level?: Level): VocabState {
  if (!level) {
    return {
      ...initialState(),
      level: state.level,
      dailyGoal: state.dailyGoal,
      autoSpeak: state.autoSpeak,
    };
  }
  const words: Record<string, WordProgress> = {};
  for (const [id, p] of Object.entries(state.words)) {
    if (!id.startsWith(level + ":")) words[id] = p;
  }
  return {
    ...state,
    words,
    starred: state.starred.filter((id) => !id.startsWith(level + ":")),
  };
}

// --- derived stats ----------------------------------------------------------

export interface LevelStats {
  total: number;
  studied: number;
  mastered: number;
  learning: number;
  due: number;
  accuracy: number | null;
}

export function levelStats(
  state: VocabState,
  ids: string[],
  now: number = Date.now()
): LevelStats {
  let studied = 0;
  let mastered = 0;
  let due = 0;
  let seen = 0;
  let correct = 0;

  for (const id of ids) {
    const p = state.words[id];
    if (!p || p.seen === 0) {
      due += 1; // never studied: always ready
      continue;
    }
    studied += 1;
    seen += p.seen;
    correct += p.correct;
    if (p.box >= MASTERY_BOX) mastered += 1;
    if (p.due <= now) due += 1;
  }

  return {
    total: ids.length,
    studied,
    mastered,
    learning: studied - mastered,
    due,
    accuracy: seen > 0 ? correct / seen : null,
  };
}

export function isDue(state: VocabState, id: string, now: number = Date.now()): boolean {
  const p = state.words[id];
  if (!p || p.seen === 0) return true;
  return p.due <= now;
}

/** Words answered wrong more often than right, or sitting in box 1. */
export function needsWork(state: VocabState, id: string): boolean {
  const p = state.words[id];
  if (!p || p.seen === 0) return false;
  return p.box <= 1 || p.correct / p.seen < 0.6;
}
