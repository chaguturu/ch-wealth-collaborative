// Deck building and question generation for the ISEE vocabulary trainer.
// ASCII-only.

import type { Level, VocabWord } from "@/types/vocab";
import { WORDS_BY_LEVEL, splitSentence, targetForm } from "@/data/vocab";
import { isDue, needsWork, type VocabState } from "./progress";

export type DeckSource = "smart" | "all" | "needsWork" | "starred";

export const DECK_SOURCE_LABEL: Record<DeckSource, string> = {
  smart: "Smart review",
  all: "All words",
  needsWork: "Needs work",
  starred: "Starred",
};

export const DECK_SOURCE_HINT: Record<DeckSource, string> = {
  smart: "New words plus anything due for review today",
  all: "Every word in this level, shuffled",
  needsWork: "Words missed recently or still in the first box",
  starred: "Words you starred while studying",
};

export function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Selects the words for one study session.
 * `limit` of 0 means "no cap".
 */
export function buildDeck(
  state: VocabState,
  level: Level,
  source: DeckSource,
  limit: number,
  now: number = Date.now()
): VocabWord[] {
  const pool = WORDS_BY_LEVEL[level];
  let chosen: VocabWord[];

  if (source === "starred") {
    chosen = shuffle(pool.filter((w) => state.starred.includes(w.id)));
  } else if (source === "needsWork") {
    chosen = shuffle(pool.filter((w) => needsWork(state, w.id)));
  } else if (source === "all") {
    chosen = shuffle(pool);
  } else {
    // Smart review: everything due, weakest boxes first, with unseen words
    // mixed in so a session is never all review or all new.
    const due = pool.filter((w) => isDue(state, w.id, now));
    const seen = shuffle(due.filter((w) => (state.words[w.id]?.seen ?? 0) > 0));
    const fresh = shuffle(due.filter((w) => (state.words[w.id]?.seen ?? 0) === 0));
    seen.sort((a, b) => (state.words[a.id]?.box ?? 0) - (state.words[b.id]?.box ?? 0));
    chosen = interleave(seen, fresh);
  }

  return limit > 0 ? chosen.slice(0, limit) : chosen;
}

/** Alternates two lists, appending whatever is left over. */
function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

// --- questions --------------------------------------------------------------

export type QuestionKind = "synonym" | "definition" | "cloze";

export interface Question {
  key: string;
  kind: QuestionKind;
  wordId: string;
  /** Shown above the choices. Empty for cloze questions, which use `cloze`. */
  prompt: string;
  cloze?: { before: string; after: string };
  choices: string[];
  answerIndex: number;
}

const CHOICE_COUNT = 4;

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** Every term that means roughly the same thing as `word`. */
function relatedTerms(word: VocabWord): Set<string> {
  const set = new Set<string>([norm(word.word), norm(targetForm(word))]);
  for (const s of word.synonyms) set.add(norm(s));
  return set;
}

/**
 * True when `candidate` is close enough in meaning to `word` that using it as
 * a wrong answer would make the question unfair.
 */
function overlaps(word: VocabWord, candidate: VocabWord): boolean {
  const related = relatedTerms(word);
  if (related.has(norm(candidate.word))) return true;
  for (const s of candidate.synonyms) {
    if (related.has(norm(s))) return true;
  }
  for (const a of candidate.antonyms) {
    // An antonym of the prompt word is a legitimate distractor, but an
    // antonym they share means the two words point the same direction.
    if (word.antonyms.some((x) => norm(x) === norm(a))) return true;
  }
  return false;
}

/** Words safe to draw wrong answers from, preferring the same part of speech. */
function distractorPool(word: VocabWord, pool: VocabWord[]): VocabWord[] {
  const safe = pool.filter((w) => w.id !== word.id && !overlaps(word, w));
  const samePos = safe.filter((w) => w.pos === word.pos);
  return samePos.length >= CHOICE_COUNT - 1 ? samePos : safe;
}

function assemble(
  correct: string,
  distractors: string[]
): { choices: string[]; answerIndex: number } {
  const choices = shuffle([correct, ...distractors]);
  return { choices, answerIndex: choices.indexOf(correct) };
}

/** Picks n distinct values, skipping any that collide with `taken`. */
function takeDistinct(
  candidates: VocabWord[],
  n: number,
  value: (w: VocabWord) => string,
  taken: Set<string>
): string[] {
  const out: string[] = [];
  for (const w of shuffle(candidates)) {
    if (out.length >= n) break;
    const v = value(w);
    if (!v || taken.has(norm(v))) continue;
    taken.add(norm(v));
    out.push(v);
  }
  return out;
}

export function makeQuestion(
  word: VocabWord,
  pool: VocabWord[],
  kind: QuestionKind,
  seq: number
): Question | null {
  const candidates = distractorPool(word, pool);
  const key = word.id + ":" + kind + ":" + seq;

  if (kind === "definition") {
    const correct = word.definition;
    const taken = new Set<string>([norm(correct)]);
    const distractors = takeDistinct(candidates, CHOICE_COUNT - 1, (w) => w.definition, taken);
    if (distractors.length < CHOICE_COUNT - 1) return null;
    const { choices, answerIndex } = assemble(correct, distractors);
    return { key, kind, wordId: word.id, prompt: word.word, choices, answerIndex };
  }

  if (kind === "cloze") {
    const { before, after } = splitSentence(word);
    const correct = targetForm(word);
    const taken = new Set<string>([norm(correct), norm(word.word)]);
    const distractors = takeDistinct(candidates, CHOICE_COUNT - 1, (w) => targetForm(w), taken);
    if (distractors.length < CHOICE_COUNT - 1) return null;
    const { choices, answerIndex } = assemble(correct, distractors);
    return {
      key,
      kind,
      wordId: word.id,
      prompt: "",
      // "an ___" would give the answer away, so soften the article.
      cloze: { before: before.replace(/\b(a|an)\s+$/i, "a(n) "), after },
      choices,
      answerIndex,
    };
  }

  // synonym
  const correct = word.synonyms[0];
  if (!correct) return null;
  const taken = new Set<string>([...relatedTerms(word)].concat(norm(correct)));
  const distractors = takeDistinct(
    candidates,
    CHOICE_COUNT - 1,
    (w) => pick(w.synonyms.length > 0 ? w.synonyms : [w.word]),
    taken
  );
  if (distractors.length < CHOICE_COUNT - 1) return null;
  const { choices, answerIndex } = assemble(correct, distractors);
  return { key, kind, wordId: word.id, prompt: word.word, choices, answerIndex };
}

/**
 * Turns a deck into a question list. "Meaning" mixes synonym and definition
 * prompts; "sentence" is pure sentence completion.
 */
export function buildQuestions(
  deck: VocabWord[],
  pool: VocabWord[],
  mode: "meaning" | "sentence"
): Question[] {
  const out: Question[] = [];
  deck.forEach((word, i) => {
    const kinds: QuestionKind[] =
      mode === "sentence"
        ? ["cloze", "definition"]
        : Math.random() < 0.65
          ? ["synonym", "definition"]
          : ["definition", "synonym"];

    for (const kind of kinds) {
      const q = makeQuestion(word, pool, kind, i);
      if (q) {
        out.push(q);
        return;
      }
    }
  });
  return out;
}
