"use client";

import type { EquityGrant } from "@/types/equity";

interface Props {
  grants: EquityGrant[];
  price: number;
  taxRate: number;
}

const C = {
  panel: "#111827", border: "#1e2d4a", accent: "#c94a00",
  green: "#3db87a", gold: "#e8b84b", text: "#e8dfc8",
  muted: "#7a8fa8", dim: "#3a4a60", dark: "#0d1525",
};

function fmtUSD(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function fmtShares(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
function daysUntil(dateStr: string) {
  return Math.round((new Date(dateStr + "T12:00:00").getTime() - Date.now()) / 86400000);
}

function recommendation(spread: number, days: number | null): { action: string; color: string; reason: string } {
  if (days != null && days < 180) return { action: "EXERCISE NOW", color: "#ff4422", reason: "Expiring in under 6 months" };
  if (days != null && days < 540 && spread > 0) return { action: "EXERCISE SOON", color: C.accent, reason: "Under 18 months, meaningful value at risk" };
  if (spread <= 0) return { action: "HOLD / WAIT", color: C.muted, reason: "Out of the money - wait for recovery" };
  if (spread < 5) return { action: "MONITOR", color: C.gold, reason: "Minimally ITM - weigh tax year timing" };
  return { action: "CONSIDER", color: C.gold, reason: "ITM with runway - time exercise to tax year" };
}

export default function ExerciseTimingTab({ grants, price, taxRate }: Props) {
  const nqoGrants = grants.filter((g) => g.grant_type === "NQO" && g.strike_price != null);

  const rows = nqoGrants.map((g) => {
    const strike = g.strike_price ?? 0;
    const vestedShares = g.vest_schedule.filter((v) => v.vested).reduce((s, v) => s + v.shares, 0);
    const spread = price - strike;
    const itm = spread > 0;
    const netToday = itm ? spread * vestedShares * (1 - taxRate) : 0;
    const days = g.expiration_date ? daysUntil(g.expiration_date) : null;
    const rec = recommendation(spread, days);
    const breakeven = itm ? (strike + spread * 1.15).toFixed(2) : "--";
    return { ...g, strike, vestedShares, spread, itm, netToday, days, rec, breakeven };
  }).filter((r) => r.vestedShares > 0);

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ background: "#0d1a10", border: "1px solid " + C.green, borderRadius: 8, padding: 14, marginBottom: 20, fontSize: 12, color: C.muted }}>
        <span style={{ color: C.green, fontWeight: 600 }}>Note: </span>
        NQOs taxed as ordinary income in year of exercise. Consider spreading exercises across tax years to avoid stacking income. Consult a tax advisor before exercising.
      </div>

      <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid " + C.border }}>
              {["Grant", "Strike", "Shares", "Net Today", "Breakeven to Wait", "Days to Exp", "Recommendation", "Reason"].map((h, i) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: i < 2 ? "left" : "right", fontSize: 10, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.08em", fontWeight: 400, whiteSpace: "nowrap" as const }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.grant_id} style={{ borderBottom: "1px solid " + C.dark, background: idx % 2 === 0 ? "transparent" : C.dark }}>
                <td style={{ padding: "11px 12px", fontFamily: "monospace", fontSize: 11, color: C.muted }}>{r.grant_id}</td>
                <td style={{ padding: "11px 12px", color: C.muted }}>${r.strike.toFixed(2)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: C.muted }}>{fmtShares(r.vestedShares)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: r.itm ? C.green : C.dim, fontWeight: 600 }}>
                  {r.itm ? fmtUSD(r.netToday) : "--"}
                </td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: C.muted }}>
                  {r.itm ? "$" + r.breakeven : "--"}
                </td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: r.days != null && r.days < 540 ? C.accent : C.muted }}>
                  {r.days ?? "--"}
                </td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}>
                  <span style={{ background: r.rec.color + "22", color: r.rec.color, padding: "2px 7px", borderRadius: 3, fontSize: 10 }}>
                    {r.rec.action}
                  </span>
                </td>
                <td style={{ padding: "11px 12px", color: C.dim, fontSize: 11 }}>{r.rec.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
