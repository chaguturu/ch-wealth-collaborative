"use client";

// Small shared pieces for the vocabulary trainer.
// ASCII-only.

import React from "react";
import { C } from "@/lib/tokens";

export const V = {
  ...C,
  correct: "#3db87a",
  wrong: "#e06a4a",
  star: "#e8b84b",
} as const;

export function Card({
  children,
  style,
  onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.panel,
        border: "1px solid " + C.border,
        borderRadius: 12,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  style,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "quiet";
  disabled?: boolean;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) {
  const base: React.CSSProperties = {
    minHeight: 46,
    padding: "0 18px",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    transition: "opacity 0.15s ease, background-color 0.15s ease",
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: C.accent, color: "#fff" },
    ghost: { background: "transparent", color: C.text, border: "1px solid " + C.border },
    quiet: { background: "transparent", color: C.muted },
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

export function Pill({
  children,
  color = C.muted,
  bg,
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 100,
        fontSize: 12,
        fontWeight: 600,
        color,
        background: bg ?? "rgba(122, 143, 168, 0.12)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function Meter({ value, total, color = C.green }: { value: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
      style={{ height: 8, borderRadius: 100, background: C.dark, overflow: "hidden" }}
    >
      <div
        style={{
          width: pct + "%",
          height: "100%",
          background: color,
          borderRadius: 100,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

export function Stat({ label, value, color = C.text }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div style={{ textAlign: "center", flex: 1, minWidth: 72 }}>
      <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: C.muted,
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/** Reads a word aloud. Silently does nothing where speech is unsupported. */
export function speak(text: string): void {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  try {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    synth.speak(utterance);
  } catch {
    // Speech is a nicety; never let it break a study session.
  }
}

export function SpeakerButton({ text, size = 20 }: { text: string; size?: number }) {
  return (
    <button
      type="button"
      aria-label={"Pronounce " + text}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      style={{
        minHeight: 36,
        minWidth: 36,
        padding: 0,
        borderRadius: 8,
        color: C.muted,
        background: "transparent",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
    </button>
  );
}

export function StarButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={on ? "Remove star" : "Star this word"}
      aria-pressed={on}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      style={{
        minHeight: 36,
        minWidth: 36,
        padding: 0,
        borderRadius: 8,
        color: on ? V.star : C.dim,
        background: "transparent",
      }}
    >
      <svg width={20} height={20} viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
        <polygon points="12 2 15.1 8.6 22 9.6 17 14.5 18.2 21.4 12 18.1 5.8 21.4 7 14.5 2 9.6 8.9 8.6 12 2" />
      </svg>
    </button>
  );
}

export function BackBar({ title, onBack, right }: { title: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 4px 14px",
      }}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        style={{ minHeight: 40, minWidth: 40, padding: 0, color: C.muted, background: "transparent" }}
      >
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{title}</div>
      {right}
    </div>
  );
}
