"use client";

// Flip-card drill. Tap or press space to reveal, then grade yourself.
// ASCII-only.

import React, { useCallback, useEffect, useState } from "react";
import type { VocabWord } from "@/types/vocab";
import { POS_LABEL } from "@/types/vocab";
import { splitSentence } from "@/data/vocab";
import { C } from "@/lib/tokens";
import { BackBar, Button, Card, Meter, SpeakerButton, StarButton, V, speak } from "./ui";

interface Props {
  deck: VocabWord[];
  starred: string[];
  autoSpeak: boolean;
  onGrade: (wordId: string, correct: boolean) => void;
  onStar: (wordId: string) => void;
  onDone: (result: { correct: number; total: number; missed: string[] }) => void;
  onExit: () => void;
}

export default function Flashcards({
  deck,
  starred,
  autoSpeak,
  onGrade,
  onStar,
  onDone,
  onExit,
}: Props) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);

  const word = deck[index];

  useEffect(() => {
    if (word && autoSpeak) speak(word.word);
  }, [word, autoSpeak]);

  const grade = useCallback(
    (knewIt: boolean) => {
      if (!word) return;
      onGrade(word.id, knewIt);
      const nextCorrect = correct + (knewIt ? 1 : 0);
      const nextMissed = knewIt ? missed : [...missed, word.id];
      setCorrect(nextCorrect);
      setMissed(nextMissed);

      if (index + 1 >= deck.length) {
        onDone({ correct: nextCorrect, total: deck.length, missed: nextMissed });
        return;
      }
      setIndex(index + 1);
      setRevealed(false);
    },
    [word, correct, missed, index, deck.length, onGrade, onDone]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!revealed) setRevealed(true);
      } else if (revealed && (e.key === "1" || e.key === "ArrowLeft")) {
        grade(false);
      } else if (revealed && (e.key === "2" || e.key === "ArrowRight")) {
        grade(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, grade]);

  if (!word) return null;

  const parts = splitSentence(word);
  const isStarred = starred.includes(word.id);

  return (
    <div>
      <BackBar
        title={"Flashcards " + (index + 1) + " / " + deck.length}
        onBack={onExit}
        right={<StarButton on={isStarred} onToggle={() => onStar(word.id)} />}
      />
      <div style={{ marginBottom: 16 }}>
        <Meter value={index} total={deck.length} color={C.blue} />
      </div>

      <Card
        onClick={() => setRevealed(true)}
        style={{
          minHeight: 300,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          cursor: revealed ? "default" : "pointer",
          textAlign: "center",
          background: "linear-gradient(160deg, #131c33 0%, #111827 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.01em" }}>{word.word}</div>
          <SpeakerButton text={word.word} />
        </div>
        <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic", marginTop: 2 }}>
          {POS_LABEL[word.pos]}
        </div>

        {!revealed ? (
          <div style={{ marginTop: 28, fontSize: 13, color: C.dim }}>
            Tap the card to see the meaning
          </div>
        ) : (
          <div style={{ marginTop: 20, textAlign: "left" }}>
            <div style={{ fontSize: 18, lineHeight: 1.5 }}>{word.definition}</div>

            <div style={{ marginTop: 16, fontSize: 14 }}>
              <span style={{ color: C.green, fontWeight: 700 }}>Similar: </span>
              <span style={{ color: C.text }}>{word.synonyms.join(", ")}</span>
            </div>
            {word.antonyms.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 14 }}>
                <span style={{ color: C.accent, fontWeight: 700 }}>Opposite: </span>
                <span style={{ color: C.text }}>{word.antonyms.join(", ")}</span>
              </div>
            )}

            <div
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTop: "1px solid " + C.border,
                fontSize: 15,
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
          </div>
        )}
      </Card>

      <div style={{ marginTop: 16 }}>
        {!revealed ? (
          <Button onClick={() => setRevealed(true)} style={{ width: "100%" }}>
            Show meaning
          </Button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              variant="ghost"
              onClick={() => grade(false)}
              style={{ flex: 1, borderColor: V.wrong, color: V.wrong }}
            >
              Still learning
            </Button>
            <Button
              onClick={() => grade(true)}
              style={{ flex: 1, background: V.correct, color: "#08120c" }}
            >
              Got it
            </Button>
          </div>
        )}
      </div>

      <div style={{ marginTop: 14, textAlign: "center", fontSize: 12, color: C.dim }}>
        Space reveals. Then 1 = still learning, 2 = got it.
      </div>
    </div>
  );
}
