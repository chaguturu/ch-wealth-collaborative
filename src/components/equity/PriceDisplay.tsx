"use client";

import { formatCurrency } from "@/lib/formatters";

interface Props {
  price: number;
  source: "live" | "fallback" | "loading";
  ticker: string;
  onOverride: (price: number) => void;
  overrideActive: boolean;
}

export default function PriceDisplay({ price, source, ticker, onOverride, overrideActive }: Props) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "16px 20px",
      backgroundColor: "#111827",
      borderBottom: "1px solid #1E2D4A",
      flexWrap: "wrap",
    }}>
      <div>
        <span style={{ fontSize: "1.5rem", fontWeight: "700", color: "#E8B84B", fontFamily: "Georgia, serif" }}>
          {formatCurrency(price, 2)}
        </span>
        <span style={{ fontSize: "0.75rem", color: "#7A8FA8", marginLeft: "8px" }}>
          {ticker}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {source === "loading" && (
          <span style={{ fontSize: "0.75rem", color: "#7A8FA8" }}>Fetching...</span>
        )}
        {source === "live" && !overrideActive && (
          <>
            <div style={{
              width: "7px", height: "7px", borderRadius: "50%",
              backgroundColor: "#3DB87A",
            }} />
            <span style={{ fontSize: "0.75rem", color: "#3DB87A" }}>Live</span>
          </>
        )}
        {source === "fallback" && !overrideActive && (
          <span style={{ fontSize: "0.75rem", color: "#7A8FA8" }}>Fallback price</span>
        )}
        {overrideActive && (
          <span style={{ fontSize: "0.75rem", color: "#E8B84B" }}>Manual override</span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
        <span style={{ fontSize: "0.75rem", color: "#7A8FA8" }}>Override:</span>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder={String(price)}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val > 0) onOverride(val);
          }}
          style={{
            width: "80px",
            backgroundColor: "#0D1525",
            border: "1px solid #1E2D4A",
            borderRadius: "4px",
            color: "#E8DFC8",
            fontSize: "0.875rem",
            padding: "4px 8px",
            fontFamily: "Georgia, serif",
          }}
        />
      </div>
    </div>
  );
}
