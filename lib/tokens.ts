// Shared design tokens — import C and helpers from here instead of redeclaring locally.
// ASCII-only (Mobile Safari Babel constraint).

export const C = {
  bg:     "#0b0f1c",
  panel:  "#111827",
  border: "#1e2d4a",
  accent: "#c94a00",
  green:  "#3db87a",
  gold:   "#e8b84b",
  blue:   "#5b9bd5",
  text:   "#e8dfc8",
  muted:  "#7a8fa8",
  dim:    "#3a4a60",
  dark:   "#0d1525",
} as const;

export type Colors = typeof C;
