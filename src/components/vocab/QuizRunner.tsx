"use client";

// Multiple-choice drill covering both ISEE question shapes: synonym/meaning
// and sentence completion. Answering locks the choices and shows the word's
// full entry before moving on.
// ASCII-only.

import React, { useCallback, useEffect, useState } from "react";
import { POS_LABEL } from "@/types/vocab";
import { WORD_BY_ID, splitSentence } from "@/data/vocab";
import type { Question } from "@/lib/vocab/session";
import { C } from "@/lib/tokens";
import { BackBar, Button, Card, Meter, SpeakerButton, StarButton, V, speak } from "./ui";

interface Props {
  title: string;
  questions: Question[];
  starred: string[];
  autoSpeak: boolean;
  onGrade: (wordId: string, correct: boolean) => void;
  onStar: (wordId: string) => void;
  onDone: (result: { correct: number; total: number; missed: string[] }) => void;
  onExit: () => void;
}

function promptText(q: Question): string {
  if (q.kind === "synonym") return "Which word means the same as";
  if (q.kind === "definition") return "What does this word mean?";
  return "Choose the word that best completes the sentence.";
}

export default function QuizRunner({
  title,
  questions,
  starred,
  autoSpeak,
  onGrade,
  onStar,
  onDone,
  onExit,
}: Props) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);

  const q = questions[index];
  const word = q ? WORD_BY_ID[q.wordId] : undefined;

  useEffect(() => {
    if (word && autoSpeak && q && q.kind !== "cloze") speak(word.word);
  }, [word, q, autoSpeak]);

  const choose = useCallback(
    (i: number) => {
      if (picked !== null || !q) return;
      setPicked(i);
      const right = i === q.answerIndex;
      onGrade(q.wordId, right);
      if (right) setCorrect((n) => n + 1);
      else setMissed((m) => (m.includes(q.wordId) ? m : [...m, q.wordId]));
    },
    [picked, q, onGrade]
  );

  const next = useCallback(() => {
    if (index + 1 >= questions.length) {
      onDone({ correct, total: questions.length, missed });
      return;
    }
    setIndex(index + 1);
    setPicked(null);
  }, [index, questions.length, correct, missed, onDone]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (picked === null) {
        const n = Number(e.key);
        if (n >= 1 && n <= 4) choose(n - 1);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        next();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picked, choose, next]);

  if (!q || !word) return null;

  const answered = picked !== null;
  const gotItRight = picked === q.answerIndex;
  const parts = splitSentence(word);

  return (
    <div>
      <BackBar
        title={title + " " + (index + 1) + " / " + questions.length}
        onBack={onExit}
        right={<StarButton on={starred.includes(word.id)} onToggle={() => onStar(word.id)} />}
      />
      <div style={{ marginBottom: 18 }}>
        <Meter value={index} total={questions.length} color={C.blue} />
      </div>

      <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>{promptText(q)}</div>

      <Card style={{ marginBottom: 18 }}>
        {q.cloze ? (
          <div style={{ fontSize: 18, lineHeight: 1.7 }}>
            {q.cloze.before}
            <span
              style={{
                display: "inline-block",
                minWidth: 96,
                borderBottom: "2px solid " + (answered ? (gotItRight ? V.correct : V.wrong) : C.gold),
                textAlign: "center",
                color: answered ? (gotItRight ? V.correct : V.wrong) : "transparent",
                fontWeight: 700,
              }}
            >
              {answered ? q.choices[q.answerIndex] : "____"}
            </span>
            {q.cloze.after}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ fontSize: 30, fontWeight: 700 }}>{q.prompt}</div>
            <SpeakerButton text={q.prompt} />
          </div>
        )}
        {!q.cloze && (
          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: C.muted,
              fontStyle: "italic",
              marginTop: 2,
            }}
          >
            {POS_LABEL[word.pos]}
          </div>
        )}
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {q.choices.map((choice, i) => {
          const isAnswer = i === q.answerIndex;
          const isPicked = i === picked;
          let border: string = C.border;
          let bg: string = C.panel;
          let color: string = C.text;
          if (answered && isAnswer) {
            border = V.correct;
            bg = "rgba(61, 184, 122, 0.12)";
            color = V.correct;
          } else if (answered && isPicked) {
            border = V.wrong;
            bg = "rgba(224, 106, 74, 0.12)";
            color = V.wrong;
          } else if (answered) {
            color = C.muted;
          }

          return (
            <button
              key={choice + i}
              type="button"
              onClick={() => choose(i)}
              disabled={answered}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                minHeight: 54,
                padding: "12px 16px",
                textAlign: "left",
                justifyContent: "flex-start",
                borderRadius: 10,
                border: "1px solid " + border,
                background: bg,
                color,
                fontSize: 16,
                lineHeight: 1.4,
                opacity: answered && !isAnswer && !isPicked ? 0.6 : 1,
                whiteSpace: "normal",
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: C.dark,
                  color: C.muted,
                  fontSize: 12,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </span>
              <span>{choice}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div style={{ marginTop: 18 }}>
          <Card style={{ background: C.dark }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>{word.word}</span>
              <SpeakerButton text={word.word} size={18} />
              <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>
                {POS_LABEL[word.pos]}
              </span>
            </div>
            <div style={{ fontSize: 15, marginBottom: 10 }}>{word.definition}</div>
            <div style={{ fontSize: 14, color: C.muted, fontStyle: "italic", lineHeight: 1.6 }}>
              {parts.before}
              <span style={{ color: C.gold, fontStyle: "normal", fontWeight: 700 }}>
                {parts.target}
              </span>
              {parts.after}
            </div>
          </Card>
          <Button onClick={next} style={{ width: "100%", marginTop: 12 }}>
            {index + 1 >= questions.length ? "See results" : "Next"}
          </Button>
        </div>
      )}

      <div style={{ marginTop: 14, textAlign: "center", fontSize: 12, color: C.dim }}>
        Press 1-4 to answer, then Enter for the next question.
      </div>
    </div>
  );
}
