// Assembles the per-level word lists into the runtime word set.
// ASCII-only.

import type { Level, VocabEntry, VocabWord } from "@/types/vocab";
import { LOWER } from "./lower";
import { MIDDLE } from "./middle";
import { UPPER } from "./upper";

function build(entries: VocabEntry[], level: Level): VocabWord[] {
  return entries.map((e) => ({
    ...e,
    level,
    id: level + ":" + e.word.toLowerCase(),
  }));
}

export const WORDS_BY_LEVEL: Record<Level, VocabWord[]> = {
  lower: build(LOWER, "lower"),
  middle: build(MIDDLE, "middle"),
  upper: build(UPPER, "upper"),
};

export const ALL_WORDS: VocabWord[] = [
  ...WORDS_BY_LEVEL.lower,
  ...WORDS_BY_LEVEL.middle,
  ...WORDS_BY_LEVEL.upper,
];

export const WORD_BY_ID: Record<string, VocabWord> = ALL_WORDS.reduce(
  (acc, w) => {
    acc[w.id] = w;
    return acc;
  },
  {} as Record<string, VocabWord>
);

// --- sentence helpers -------------------------------------------------------

const BRACKET = /\[([^\]]+)\]/;

/** The exact inflected form of the word as it appears in the example sentence. */
export function targetForm(word: VocabWord): string {
  const m = BRACKET.exec(word.sentence);
  return m ? m[1] : word.word;
}

/** Example sentence with the brackets removed. */
export function plainSentence(word: VocabWord): string {
  return word.sentence.replace(BRACKET, (_, inner) => inner);
}

/** Example sentence split around the target, for highlighting or blanking. */
export function splitSentence(word: VocabWord): {
  before: string;
  target: string;
  after: string;
} {
  const m = BRACKET.exec(word.sentence);
  if (!m) return { before: word.sentence, target: "", after: "" };
  return {
    before: word.sentence.slice(0, m.index),
    target: m[1],
    after: word.sentence.slice(m.index + m[0].length),
  };
}
