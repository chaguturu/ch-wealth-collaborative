// formatters.ts
// Currency, percent, and date formatters.
// Pure ASCII only. No unicode characters.
// All functions are pure - no side effects.

// formatCurrency
// Formats a number as USD currency.
// Examples: 1234567.89 -> "$1,234,567.89"
//           1234567.89, 0 -> "$1,234,568"

export function formatCurrency(
  value: number | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined || isNaN(value)) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// formatCurrencyCompact
// Formats large numbers in compact form.
// Examples: 1234567 -> "$1.2M"
//           123456  -> "$123.5K"

export function formatCurrencyCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "--";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return sign + "$" + (abs / 1_000_000_000).toFixed(1) + "B";
  if (abs >= 1_000_000)     return sign + "$" + (abs / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000)         return sign + "$" + (abs / 1_000).toFixed(1) + "K";
  return formatCurrency(value, 0);
}

// formatPercent
// Formats a decimal as a percentage.
// Examples: 0.0435 -> "4.35%"
//           0.37   -> "37.00%"

export function formatPercent(
  value: number | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined || isNaN(value)) return "--";
  return (value * 100).toFixed(decimals) + "%";
}

// formatPercentDirect
// Formats a number that is already a percentage (not a decimal).
// Examples: 4.35 -> "4.35%"
//           37   -> "37.00%"

export function formatPercentDirect(
  value: number | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined || isNaN(value)) return "--";
  return value.toFixed(decimals) + "%";
}

// formatShares
// Formats a share count with commas.
// Examples: 10206 -> "10,206"
//           1546.5 -> "1,546.5"

export function formatShares(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "--";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: value % 1 === 0 ? 0 : 4,
  }).format(value);
}

// formatDate
// Formats a date string or Date object.
// Examples: "2026-04-01" -> "Apr 1, 2026"

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "--";
  const d = typeof value === "string" ? new Date(value + "T12:00:00") : value;
  if (isNaN(d.getTime())) return "--";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// formatDateShort
// Examples: "2026-04-01" -> "Apr 2026"

export function formatDateShort(value: string | Date | null | undefined): string {
  if (!value) return "--";
  const d = typeof value === "string" ? new Date(value + "T12:00:00") : value;
  if (isNaN(d.getTime())) return "--";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// daysUntil
// Returns number of days from today until a future date.
// Negative if date is in the past.

export function daysUntil(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value + "T12:00:00") : value;
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// formatDaysUntil
// Examples: 30 -> "in 30 days"
//           -5 -> "5 days ago"
//            0 -> "today"

export function formatDaysUntil(value: string | Date | null | undefined): string {
  const days = daysUntil(value);
  if (days === null) return "--";
  if (days === 0) return "today";
  if (days > 0) return "in " + days + " day" + (days === 1 ? "" : "s");
  return Math.abs(days) + " day" + (Math.abs(days) === 1 ? "" : "s") + " ago";
}

// formatStrike
// Formats a strike price with dollar sign and 2 decimals.
// Example: 75.27 -> "$75.27"

export function formatStrike(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "--";
  return "$" + value.toFixed(2);
}

// isInTheMoney
// Returns true if current price is above strike price.

export function isInTheMoney(
  currentPrice: number,
  strikePrice: number
): boolean {
  return currentPrice > strikePrice;
}

// formatSpread
// Returns the per-share spread (current price minus strike).
// Example: current=87.37, strike=75.27 -> "$12.10"

export function formatSpread(
  currentPrice: number | null | undefined,
  strikePrice: number | null | undefined
): string {
  if (!currentPrice || !strikePrice) return "--";
  const spread = currentPrice - strikePrice;
  if (spread <= 0) return "OTM";
  return formatCurrency(spread);
}
