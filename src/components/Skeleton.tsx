"use client";

import React from "react";
import { C } from "@/lib/tokens";

interface SkeletonLineProps {
  width?: string | number;
  height?: number;
  mb?: number;
  borderRadius?: number;
}

export function SkeletonLine({ width = "100%", height = 16, mb = 0, borderRadius = 4 }: SkeletonLineProps) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      marginBottom: mb,
      background: `linear-gradient(90deg, ${C.panel} 0%, ${C.dim} 50%, ${C.panel} 100%)`,
      backgroundSize: "200% 100%",
      animation: "skeleton-shimmer 1.4s ease-in-out infinite",
    }} />
  );
}

// Wrap a set of skeleton lines to inject the keyframe once.
export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {children}
    </>
  );
}

// Stat card skeleton — matches StatCard dimensions.
export function SkeletonCard() {
  return (
    <div style={{
      background: C.panel,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: 20,
      flex: "1 1 160px",
    }}>
      <SkeletonLine width="55%" height={10} mb={10} />
      <SkeletonLine width="80%" height={28} mb={6} />
      <SkeletonLine width="40%" height={10} />
    </div>
  );
}
