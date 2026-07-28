"use client";

// ISEE vocabulary trainer. Everything is client-side and stored on the
// device, so there is no login and nothing to sync.
// ASCII-only.

import React, { useCallback, useMemo, useState } from "react";
import type { VocabWord } from "@/types/vocab";
import { LEVELS, LEVEL_BLURB, LEVEL_LABEL } from "@/types/vocab";
import { WORDS_BY_LEVEL, WORD_BY_ID } from "@/data/vocab";
import { levelStats } from "@/lib/vocab/progress";
import {
  DECK_SOURCE_HINT,
  DECK_SOURCE_LABEL,
  buildDeck,
  buildQuestions,
  shuffle,
  type DeckSource,
  type Question,
} from "@/lib/vocab/session";
import { useVocabState } from "@/lib/vocab/useVocabState";
import { C } from "@/lib/tokens";
import { Button, Card, Meter, Pill, Stat } from "./ui";
import Flashcards from "./Flashcards";
import QuizRunner from "./QuizRunner";
import Results, { type SessionResult } from "./Results";
import WordListScreen from "./WordListScreen";

type Mode = "flashcards" | "meaning" | "sentence";
type Screen = "home" | Mode | "list" | "results";

const MODE_LABEL: Record<Mode, string> = {
  flashcards: "Flashcards",
  meaning: "Meaning quiz",
  sentence: "Sentence completion",
};

const MODE_HINT: Record<Mode, string> = {
  flashcards: "See the word, recall the meaning, grade yourself",
  meaning: "Pick the closest synonym or definition",
  sentence: "Choose the word that fits the blank",
};

const LENGTHS = [10, 20, 0];

export default function VocabApp() {
  const store = useVocabState();
  const { state, ready } = store;

  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<Mode>("flashcards");
  const [source, setSource] = useState<DeckSource>("smart");
  const [length, setLength] = useState<number>(10);
  const [deck, setDeck] = useState<VocabWord[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const level = state.level;
  const pool = WORDS_BY_LEVEL[level];
  const stats = useMemo(
    () => levelStats(state, pool.map((w) => w.id)),
    [state, pool]
  );

  const start = useCallback(
    (nextMode: Mode, words?: VocabWord[]) => {
      const chosen = words ?? buildDeck(state, level, source, length);
      if (chosen.length === 0) return;
      setMode(nextMode);
      setDeck(chosen);
      setQuestions(
        nextMode === "flashcards"
          ? []
          : buildQuestions(chosen, pool, nextMode === "sentence" ? "sentence" : "meaning")
      );
      setResult(null);
      setScreen(nextMode);
    },
    [state, level, source, length, pool]
  );

  const finish = useCallback((r: SessionResult) => {
    setResult(r);
    setScreen("results");
  }, []);

  const retryMissed = useCallback(() => {
    if (!result) return;
    const words = shuffle(result.missed.map((id) => WORD_BY_ID[id]).filter(Boolean));
    start(mode, words);
  }, [result, mode, start]);

  const emptyDeck = buildDeck(state, level, source, 0).length === 0;

  // --- session screens ------------------------------------------------------

  if (screen === "flashcards") {
    return (
      <Shell>
        <Flashcards
          deck={deck}
          starred={state.starred}
          autoSpeak={state.autoSpeak}
          onGrade={store.answer}
          onStar={store.star}
          onDone={finish}
          onExit={() => setScreen("home")}
        />
      </Shell>
    );
  }

  if (screen === "meaning" || screen === "sentence") {
    return (
      <Shell>
        <QuizRunner
          title={MODE_LABEL[screen]}
          questions={questions}
          starred={state.starred}
          autoSpeak={state.autoSpeak}
          onGrade={store.answer}
          onStar={store.star}
          onDone={finish}
          onExit={() => setScreen("home")}
        />
      </Shell>
    );
  }

  if (screen === "list") {
    return (
      <Shell>
        <WordListScreen
          level={level}
          state={state}
          onStar={store.star}
          onExit={() => setScreen("home")}
        />
      </Shell>
    );
  }

  if (screen === "results" && result) {
    return (
      <Shell>
        <Results
          result={result}
          onRetryMissed={retryMissed}
          onAgain={() => start(mode)}
          onHome={() => setScreen("home")}
        />
      </Shell>
    );
  }

  // --- home -----------------------------------------------------------------

  const goalPct = state.dailyGoal > 0 ? state.today.reviewed / state.dailyGoal : 0;

  return (
    <Shell>
      <header style={{ padding: "18px 0 20px" }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: C.accent,
            marginBottom: 6,
          }}
        >
          Study
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.01em" }}>
          ISEE Vocabulary
        </h1>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
          {pool.length} words. Progress is saved on this device only.
        </p>
      </header>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {LEVELS.map((l) => {
          const on = l === level;
          return (
            <button
              key={l}
              type="button"
              onClick={() => store.setLevel(l)}
              style={{
                flex: 1,
                flexDirection: "column",
                gap: 2,
                minHeight: 58,
                borderRadius: 10,
                border: "1px solid " + (on ? C.accent : C.border),
                background: on ? "rgba(201, 74, 0, 0.14)" : C.panel,
                color: on ? C.accent : C.muted,
                padding: "8px 4px",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700 }}>{LEVEL_LABEL[l].split(" ")[0]}</span>
              <span style={{ fontSize: 10, opacity: 0.85 }}>{LEVEL_BLURB[l]}</span>
            </button>
          );
        })}
      </div>

      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 4 }}>
          <Stat label="Mastered" value={ready ? stats.mastered : "-"} color={C.green} />
          <Stat label="Learning" value={ready ? stats.learning : "-"} color={C.gold} />
          <Stat label="Due now" value={ready ? stats.due : "-"} color={C.blue} />
          <Stat label="Day streak" value={ready ? state.streak.current : "-"} color={C.accent} />
        </div>

        <div style={{ marginTop: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: C.muted,
              marginBottom: 6,
            }}
          >
            <span>Today</span>
            <span>
              {state.today.reviewed} / {state.dailyGoal} words
            </span>
          </div>
          <Meter
            value={state.today.reviewed}
            total={state.dailyGoal}
            color={goalPct >= 1 ? C.green : C.gold}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <Meter value={stats.mastered} total={stats.total} color={C.green} />
          <div style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>
            {stats.mastered} of {stats.total} mastered in {LEVEL_LABEL[level]}
            {stats.accuracy !== null &&
              " \u00b7 " + Math.round(stats.accuracy * 100) + "% correct all time"}
          </div>
        </div>
      </Card>

      <SectionLabel>What to study</SectionLabel>
      <div className="scroll-x" style={{ display: "flex", gap: 8, marginBottom: 6 }}>
        {(Object.keys(DECK_SOURCE_LABEL) as DeckSource[]).map((s) => {
          const on = s === source;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSource(s)}
              style={{
                minHeight: 36,
                padding: "0 14px",
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 600,
                flexShrink: 0,
                border: "1px solid " + (on ? C.blue : C.border),
                background: on ? "rgba(91, 155, 213, 0.14)" : "transparent",
                color: on ? C.blue : C.muted,
              }}
            >
              {DECK_SOURCE_LABEL[s]}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 12, color: C.dim, marginBottom: 16 }}>{DECK_SOURCE_HINT[source]}</div>

      <SectionLabel>Session length</SectionLabel>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {LENGTHS.map((n) => {
          const on = n === length;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setLength(n)}
              style={{
                flex: 1,
                minHeight: 40,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                border: "1px solid " + (on ? C.gold : C.border),
                background: on ? "rgba(232, 184, 75, 0.12)" : "transparent",
                color: on ? C.gold : C.muted,
              }}
            >
              {n === 0 ? "Everything" : n + " words"}
            </button>
          );
        })}
      </div>

      {emptyDeck && (
        <Card style={{ marginBottom: 16, borderColor: C.gold }}>
          <div style={{ fontSize: 14, color: C.gold, fontWeight: 600, marginBottom: 4 }}>
            Nothing queued here
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>
            {source === "smart"
              ? "Every word in this level is scheduled for later. Switch to All words to keep going."
              : source === "starred"
                ? "Star a few words while studying and they will show up here."
                : "No words are marked as needing work right now."}
          </div>
        </Card>
      )}

      <SectionLabel>Practice</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
          <Card
            key={m}
            onClick={() => start(m)}
            style={{
              cursor: emptyDeck ? "not-allowed" : "pointer",
              opacity: emptyDeck ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: 16,
            }}
          >
            <ModeIcon mode={m} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{MODE_LABEL[m]}</div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{MODE_HINT[m]}</div>
            </div>
            <span style={{ color: C.dim }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </span>
          </Card>
        ))}

        <Card
          onClick={() => setScreen("list")}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 14, padding: 16 }}
        >
          <ModeIcon mode="list" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Word list</div>
            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>
              Browse, search, and star words
            </div>
          </div>
          <Pill>{pool.length}</Pill>
        </Card>
      </div>

      <div style={{ marginTop: 26, paddingTop: 18, borderTop: "1px solid " + C.border }}>
        <Button
          variant="quiet"
          onClick={() => setShowSettings(!showSettings)}
          style={{ padding: 0, minHeight: 32, fontSize: 13 }}
        >
          {showSettings ? "Hide options" : "Options"}
        </Button>

        {showSettings && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={state.autoSpeak}
                onChange={(e) => store.setAutoSpeak(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              Read each word aloud automatically
            </label>

            <div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Daily goal</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[10, 20, 30, 50].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => store.setDailyGoal(g)}
                    style={{
                      flex: 1,
                      minHeight: 38,
                      borderRadius: 8,
                      fontSize: 13,
                      border: "1px solid " + (state.dailyGoal === g ? C.gold : C.border),
                      background: state.dailyGoal === g ? "rgba(232, 184, 75, 0.12)" : "transparent",
                      color: state.dailyGoal === g ? C.gold : C.muted,
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Button
                variant="ghost"
                onClick={() => {
                  if (window.confirm("Reset progress for " + LEVEL_LABEL[level] + "?")) {
                    store.reset(level);
                  }
                }}
                style={{ flex: 1, fontSize: 13 }}
              >
                Reset this level
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (window.confirm("Reset all vocabulary progress on this device?")) {
                    store.reset();
                  }
                }}
                style={{ flex: 1, fontSize: 13, borderColor: C.accent, color: C.accent }}
              >
                Reset everything
              </Button>
            </div>

            <div style={{ fontSize: 11.5, color: C.dim, lineHeight: 1.6 }}>
              Words move up a box each time you get them right and drop back to box 1 when you miss
              one. Higher boxes come back for review less often: 1, 2, 4, 8, then 21 days.
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", background: C.bg, color: C.text }}>
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          padding: "0 16px calc(48px + env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: C.muted,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function ModeIcon({ mode }: { mode: Mode | "list" }) {
  const color =
    mode === "flashcards" ? C.blue : mode === "meaning" ? C.green : mode === "sentence" ? C.gold : C.muted;
  return (
    <span
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255, 255, 255, 0.04)",
        color,
      }}
    >
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        {mode === "flashcards" && (
          <>
            <rect x="3" y="5" width="14" height="14" rx="2" />
            <path d="M7 9h6M7 13h4" />
            <path d="M21 8v9a2 2 0 0 1-2 2h-9" />
          </>
        )}
        {mode === "meaning" && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9a2.6 2.6 0 0 1 5 1c0 1.7-2.5 2-2.5 3.5" />
            <path d="M12 17.5h.01" />
          </>
        )}
        {mode === "sentence" && (
          <>
            <path d="M4 7h16M4 12h7M4 17h16" />
            <rect x="13" y="10" width="7" height="4" rx="1" />
          </>
        )}
        {mode === "list" && (
          <>
            <path d="M8 6h12M8 12h12M8 18h12" />
            <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
          </>
        )}
      </svg>
    </span>
  );
}
