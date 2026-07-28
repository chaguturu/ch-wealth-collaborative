"use client";

// Study progress lives in localStorage and is exposed through
// useSyncExternalStore, so the server render and the hydration render agree
// and every mounted screen sees the same state.
// ASCII-only.

import { useCallback, useSyncExternalStore } from "react";
import type { Level } from "@/types/vocab";
import {
  applyAnswer,
  initialState,
  loadState,
  resetProgress,
  saveState,
  toggleStar,
  type VocabState,
} from "./progress";

// Stable reference used for the server and hydration renders. Comparing
// against it is also how the UI knows localStorage has been read yet.
const SERVER_SNAPSHOT: VocabState = initialState();

let cached: VocabState | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): VocabState {
  if (cached === null) cached = loadState();
  return cached;
}

function getServerSnapshot(): VocabState {
  return SERVER_SNAPSHOT;
}

function update(fn: (s: VocabState) => VocabState): void {
  const next = fn(getSnapshot());
  cached = next;
  saveState(next);
  listeners.forEach((l) => l());
}

export interface VocabStore {
  state: VocabState;
  /** False until localStorage has been read, so stats do not flash in. */
  ready: boolean;
  answer: (wordId: string, correct: boolean) => void;
  star: (wordId: string) => void;
  setLevel: (level: Level) => void;
  setDailyGoal: (goal: number) => void;
  setAutoSpeak: (on: boolean) => void;
  reset: (level?: Level) => void;
}

export function useVocabState(): VocabStore {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const answer = useCallback((wordId: string, correct: boolean) => {
    update((s) => applyAnswer(s, wordId, correct));
  }, []);

  const star = useCallback((wordId: string) => {
    update((s) => toggleStar(s, wordId));
  }, []);

  const setLevel = useCallback((level: Level) => {
    update((s) => ({ ...s, level }));
  }, []);

  const setDailyGoal = useCallback((dailyGoal: number) => {
    update((s) => ({ ...s, dailyGoal }));
  }, []);

  const setAutoSpeak = useCallback((autoSpeak: boolean) => {
    update((s) => ({ ...s, autoSpeak }));
  }, []);

  const reset = useCallback((level?: Level) => {
    update((s) => resetProgress(s, level));
  }, []);

  return {
    state,
    ready: state !== SERVER_SNAPSHOT,
    answer,
    star,
    setLevel,
    setDailyGoal,
    setAutoSpeak,
    reset,
  };
}
