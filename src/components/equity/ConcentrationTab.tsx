"use client";

import { useState } from "react";
import type { EquityGrant, PsuSliders } from "@/types/equity";

interface Props {
  grants: EquityGrant[];
  price: number;
  taxRate: number;
  psuSliders: PsuSliders;
  totalWealth: string;
  setTotalWealth: (v: string) => void;
}

const C = {
  panel: "#111827", border: "#1e2d4a", accent: "#c94a00",
  green: "#3db87a", gold: "#e8b84b", blue: "#5b9bd5",
  text: "#e8dfc8", muted: "#7a8fa8", dim: "#3a4a60", dark: "#0d1525", bg: "#0b0f1c",
};

function fmtUSD(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function NumInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", background: C.dark, border: "1px solid " + C.border, borderRadius: 6, overflow: "hidden" }}>
      <span style={{ padding: "0 10px", color: C.green, fontSize: 13 }}>$</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step="100000"
        min="0"
        style={{ background: "transparent", border: "none", color: C.text, fontSize: 14, fontFamily: "Georgia, serif", padding: "8px 8px 8px 0", width: "100%", outline: "none" }}
      />
    </div>
  );
}

const UNDERWATER_GRANT = { grant: "NQ220016", strike: 101.09, totalShares: 12993 };

export default function ConcentrationTab({ grants, price, taxRate, psuSliders, totalWealth, setTotalWealth }: Props) {
  let rsuValue = 0, psuValue = 0, optValue = 0;

  for (const g of grants) {
    if (g.grant_type === "RSU") {
      rsuValue += g.vest_schedule.reduce((s, v) => s + v.shares, 0) * price;
    } else if (g.grant_type === "PSU") {
      const achievement = (psuSliders[g.grant_id] ?? g.psu_achievement_pct) / 100;
      psuValue += g.total_shares * achievement * price;
    } else if (g.grant_type === "NQO" && g.strike_price != null) {
      const spread = price - g.strike_price;
      if (spread <= 0) continue;
      const vested = g.vest_schedule.filter((v) => v.vested).reduce((s, v) => s + v.shares, 0);
      optValue += vested * spread;
    }
  }

  const totalCVS = rsuValue + psuValue + optValue;
  const netCVS = totalCVS * (1 - taxRate);
  const wealthNum = parseFloat(totalWealth) || 0;
  const otherWealth = wealthNum - totalCVS;
  const concentration = wealthNum > 0 ? (totalCVS / wealthNum) * 100 : 0;

  const SLICES = [
    { label: "RSU Value", value: rsuValue, color: C.blue },
    { label: "PSU Value", value: psuValue, color: C.gold },
    { label: "Options (vested ITM)", value: optValue, color: C.green },
    { label: "Other Wealth", value: Math.max(otherWealth, 0), color: C.dim },
  ].filter((s) => s.value > 0);

  const total = SLICES.reduce((s, sl) => s + sl.value, 0);

  const pctRecovery = ((UNDERWATER_GRANT.strike / price) - 1) * 100;

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.accent, marginBottom: 12 }}>Total Portfolio Value (for concentration calc)</div>
          <NumInput value={totalWealth} onChange={setTotalWealth} />
          <div style={{ marginTop: 8, fontSize: 11, color: C.muted }}>Enter your estimated total net worth to calculate CVS concentration</div>
        </div>
        <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 6 }}>CVS Concentration</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Georgia, serif", color: concentration > 40 ? C.accent : concentration > 25 ? C.gold : C.green }}>
            {wealthNum > 0 ? concentration.toFixed(1) + "%" : "--"}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
            {concentration > 40 ? "High concentration risk" : concentration > 25 ? "Moderate concentration" : "Manageable concentration"}
          </div>
        </div>
      </div>

      <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.accent, marginBottom: 16 }}>CVS Equity Breakdown</div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" as const }}>
          <div style={{ flex: "0 0 auto" }}>
            {total > 0 && (
              <div style={{
                width: 140, height: 140, borderRadius: "50%",
                background: "conic-gradient(" + SLICES.map((sl, i) => {
                  const start = SLICES.slice(0, i).reduce((s, x) => s + x.value, 0) / total * 360;
                  const end = SLICES.slice(0, i + 1).reduce((s, x) => s + x.value, 0) / total * 360;
                  return sl.color + " " + start + "deg " + end + "deg";
                }).join(", ") + ")",
                position: "relative" as const,
              }}>
                <div style={{ position: "absolute" as const, inset: "30%", borderRadius: "50%", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.muted }}>CVS</div>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>{fmtUSD(totalCVS)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {SLICES.map((sl) => (
              <div key={sl.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: sl.color }} />
                  <span style={{ fontSize: 12, color: C.muted }}>{sl.label}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{fmtUSD(sl.value)}</div>
                  <div style={{ fontSize: 10, color: C.dim }}>{total > 0 ? ((sl.value / total) * 100).toFixed(1) + "%" : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.accent, marginBottom: 16 }}>
          NQ220016 Breakeven Analysis (Underwater $101.09 Strike)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Current Price", value: "$" + price.toFixed(2), color: C.muted },
            { label: "Strike Price", value: "$101.09", color: C.accent },
            { label: "Recovery Needed", value: "+" + pctRecovery.toFixed(1) + "%", color: price < 101.09 ? C.accent : C.green },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Georgia, serif", color }}>{value}</div>
              {label === "Recovery Needed" && (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                  {price >= 101.09 ? "Currently ITM!" : "to be in the money"}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
          At various recovery prices, NQ220016 (12,993 vested shares) net gain would be:
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          {[90, 95, 100, 101.09, 105, 110, 115, 120, 130].map((p) => {
            const spread = p - UNDERWATER_GRANT.strike;
            const net = spread > 0 ? spread * UNDERWATER_GRANT.totalShares * (1 - taxRate) : null;
            const isCur = Math.abs(p - price) < 1;
            return (
              <div key={p} style={{ background: isCur ? "#1a1400" : C.dark, border: "1px solid " + (isCur ? C.gold : C.border), borderRadius: 6, padding: "10px 14px", textAlign: "center", minWidth: 80 }}>
                <div style={{ fontSize: 11, color: isCur ? C.gold : C.muted }}>${p.toFixed(0)}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: net ? C.green : C.dim, marginTop: 4 }}>
                  {net ? fmtUSD(net) : "OTM"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
