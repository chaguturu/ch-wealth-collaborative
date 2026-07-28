// ISEE vocabulary types.
// ASCII-only (Mobile Safari Babel constraint).

export type Level = "lower" | "middle" | "upper";

export type Pos = "adj" | "noun" | "verb" | "adv";

// Raw authoring shape used inside the per-level data files.
// `sentence` must contain exactly one [bracketed] segment marking the target
// word form. The brackets are stripped for display and replaced with a blank
// for sentence-completion questions.
export interface VocabEntry {
  word: string;
  pos: Pos;
  definition: string;
  synonyms: string[];
  antonyms: string[];
  sentence: string;
}

// Runtime shape: entry plus derived id/level.
export interface VocabWord extends VocabEntry {
  id: string;
  level: Level;
}

export const POS_LABEL: Record<Pos, string> = {
  adj: "adjective",
  noun: "noun",
  verb: "verb",
  adv: "adverb",
};

export const LEVEL_LABEL: Record<Level, string> = {
  lower: "Lower Level",
  middle: "Middle Level",
  upper: "Upper Level",
};

export const LEVEL_BLURB: Record<Level, string> = {
  lower: "Grades 5-6",
  middle: "Grades 7-8",
  upper: "Grades 9-12",
};

export const LEVELS: Level[] = ["lower", "middle", "upper"];
