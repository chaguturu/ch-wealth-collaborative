"use client";

import React from "react";
import { C } from "@/lib/tokens";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export default function PageHeader({ eyebrow, title, subtitle, right }: PageHeaderProps) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #0b0f1c 0%, #132040 100%)",
      borderBottom: `1px solid ${C.accent}`,
      padding: "20px 24px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{
            fontSize: 10,
            letterSpacing: "0.3em",
            color: C.accent,
            textTransform: "uppercase",
            marginBottom: 4,
          }}>
            {eyebrow}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.text }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{subtitle}</div>
          )}
        </div>
        {right && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{right}</div>}
      </div>
    </div>
  );
}
