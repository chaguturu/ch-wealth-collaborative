"use client";

// End-of-session summary with a review list of anything missed.
// ASCII-only.

import React from "react";
import { WORD_BY_ID } from "@/data/vocab";
import { C } from "@/lib/tokens";
import { Button, Card, Meter, SpeakerButton } from "./ui";

export interface SessionResult {
  correct: number;
  total: number;
  missed: string[];
}

interface Props {
  result: SessionResult;
  onRetryMissed: () => void;
  onAgain: () => void;
  onHome: () => void;
}

function encouragement(pct: number): { headline: string; color: string } {
  if (pct >= 95) return { headline: "Perfect run", color: C.gold };
  if (pct >= 80) return { headline: "Nicely done", color: C.green };
  if (pct >= 60) return { headline: "Getting there", color: C.blue };
  return { headline: "Good practice", color: C.muted };
}

export default function Results({ result, onRetryMissed, onAgain, onHome }: Props) {
  const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const tone = encouragement(pct);
  const missedWords = result.missed.map((id) => WORD_BY_ID[id]).filter(Boolean);

  return (
    <div style={{ paddingTop: 12 }}>
      <Card style={{ textAlign: "center", padding: 28 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.muted,
          }}
        >
          Session complete
        </div>
        <div style={{ fontSize: 44, fontWeight: 700, color: tone.color, marginTop: 8, lineHeight: 1 }}>
          {pct}%
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, marginTop: 8 }}>{tone.headline}</div>
        <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>
          {result.correct} of {result.total} correct
        </div>
        <div style={{ marginTop: 16 }}>
          <Meter value={result.correct} total={result.total} color={tone.color} />
        </div>
      </Card>

      {missedWords.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.muted,
              marginBottom: 10,
            }}
          >
            Worth another look ({missedWords.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {missedWords.map((w) => (
              <Card key={w.id} style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{w.word}</span>
                  <SpeakerButton text={w.word} size={16} />
                </div>
                <div style={{ fontSize: 14, color: C.muted, marginTop: 2 }}>{w.definition}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        {missedWords.length > 0 && (
          <Button onClick={onRetryMissed} style={{ width: "100%" }}>
            Drill the {missedWords.length} I missed
          </Button>
        )}
        <Button variant="ghost" onClick={onAgain} style={{ width: "100%" }}>
          New session
        </Button>
        <Button variant="quiet" onClick={onHome} style={{ width: "100%" }}>
          Back to menu
        </Button>
      </div>
    </div>
  );
}
