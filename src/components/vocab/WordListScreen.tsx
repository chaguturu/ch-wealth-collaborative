"use client";

// Browsable, searchable word list with per-word mastery.
// ASCII-only.

import React, { useMemo, useState } from "react";
import type { Level } from "@/types/vocab";
import { POS_LABEL } from "@/types/vocab";
import { WORDS_BY_LEVEL, splitSentence } from "@/data/vocab";
import { MASTERY_BOX, type VocabState } from "@/lib/vocab/progress";
import { C } from "@/lib/tokens";
import { BackBar, Card, Pill, SpeakerButton, StarButton } from "./ui";

type Filter = "all" | "starred" | "learning" | "mastered" | "new";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "Not started" },
  { key: "learning", label: "Learning" },
  { key: "mastered", label: "Mastered" },
  { key: "starred", label: "Starred" },
];

export default function WordListScreen({
  level,
  state,
  onStar,
  onExit,
}: {
  level: Level;
  state: VocabState;
  onStar: (id: string) => void;
  onExit: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const words = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WORDS_BY_LEVEL[level].filter((w) => {
      const p = state.words[w.id];
      const box = p?.box ?? 0;
      if (filter === "starred" && !state.starred.includes(w.id)) return false;
      if (filter === "new" && (p?.seen ?? 0) > 0) return false;
      if (filter === "learning" && (box === 0 || box >= MASTERY_BOX)) return false;
      if (filter === "mastered" && box < MASTERY_BOX) return false;
      if (!q) return true;
      return (
        w.word.toLowerCase().includes(q) ||
        w.definition.toLowerCase().includes(q) ||
        w.synonyms.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [level, state, query, filter]);

  return (
    <div>
      <BackBar title="Word list" onBack={onExit} />

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a word, meaning, or synonym"
        aria-label="Search words"
        style={{
          width: "100%",
          minHeight: 44,
          padding: "0 14px",
          borderRadius: 10,
          border: "1px solid " + C.border,
          background: C.dark,
          color: C.text,
          fontSize: 15,
        }}
      />

      <div className="scroll-x" style={{ display: "flex", gap: 8, margin: "12px 0 16px" }}>
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                minHeight: 34,
                padding: "0 14px",
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 600,
                flexShrink: 0,
                border: "1px solid " + (on ? C.accent : C.border),
                background: on ? "rgba(201, 74, 0, 0.15)" : "transparent",
                color: on ? C.accent : C.muted,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 12, color: C.dim, marginBottom: 10 }}>
        {words.length} {words.length === 1 ? "word" : "words"}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {words.map((w) => {
          const p = state.words[w.id];
          const box = p?.box ?? 0;
          const open = openId === w.id;
          const parts = splitSentence(w);
          const status =
            box >= MASTERY_BOX
              ? { label: "Mastered", color: C.green, bg: "rgba(61, 184, 122, 0.15)" }
              : box > 0
                ? { label: "Box " + box, color: C.gold, bg: "rgba(232, 184, 75, 0.15)" }
                : { label: "New", color: C.muted, bg: "rgba(122, 143, 168, 0.12)" };

          return (
            <Card key={w.id} style={{ padding: 14 }}>
              <div
                onClick={() => setOpenId(open ? null : w.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{w.word}</div>
                  <div
                    style={{
                      fontSize: 13,
                      color: C.muted,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: open ? "normal" : "nowrap",
                    }}
                  >
                    {w.definition}
                  </div>
                </div>
                <Pill color={status.color} bg={status.bg}>
                  {status.label}
                </Pill>
                <StarButton on={state.starred.includes(w.id)} onToggle={() => onStar(w.id)} />
              </div>

              {open && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid " + C.border }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>
                      {POS_LABEL[w.pos]}
                    </span>
                    <SpeakerButton text={w.word} size={16} />
                  </div>
                  <div style={{ fontSize: 14 }}>
                    <span style={{ color: C.green, fontWeight: 700 }}>Similar: </span>
                    {w.synonyms.join(", ")}
                  </div>
                  {w.antonyms.length > 0 && (
                    <div style={{ fontSize: 14, marginTop: 4 }}>
                      <span style={{ color: C.accent, fontWeight: 700 }}>Opposite: </span>
                      {w.antonyms.join(", ")}
                    </div>
                  )}
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 14,
                      fontStyle: "italic",
                      color: C.muted,
                      lineHeight: 1.6,
                    }}
                  >
                    {parts.before}
                    <span style={{ color: C.gold, fontStyle: "normal", fontWeight: 700 }}>
                      {parts.target}
                    </span>
                    {parts.after}
                  </div>
                  {p && p.seen > 0 && (
                    <div style={{ marginTop: 10, fontSize: 12, color: C.dim }}>
                      Answered {p.correct} of {p.seen} correctly
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {words.length === 0 && (
          <Card style={{ textAlign: "center", color: C.muted, fontSize: 14 }}>
            No words match that filter yet.
          </Card>
        )}
      </div>
    </div>
  );
}
