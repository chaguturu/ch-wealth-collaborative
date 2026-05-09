"use client";

import type { EquityGrant, PsuSliders } from "@/types/equity";

interface Props {
  grants: EquityGrant[];
  price: number;
  taxRate: number;
  psuSliders: PsuSliders;
  bilhYear: string | null;
  setBilhYear: (y: string | null) => void;
}

const C = {
  panel: "#111827", border: "#1e2d4a", accent: "#c94a00",
  green: "#3db87a", gold: "#e8b84b", blue: "#5b9bd5",
  text: "#e8dfc8", muted: "#7a8fa8", dim: "#3a4a60", dark: "#0d1525",
};

function fmtUSD(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const YEARS = [2025, 2026, 2027, 2028, 2029];

export default function TaxStackingTab({ grants, price, taxRate, psuSliders, bilhYear, setBilhYear }: Props) {
  const rows = YEARS.map((yr) => {
    const rsuIncome = grants
      .filter((g) => g.grant_type === "RSU")
      .flatMap((g) => g.vest_schedule)
      .filter((v) => new Date(v.vest_date).getFullYear() === yr)
      .reduce((s, v) => s + v.shares * price, 0);

    const psuIncome = grants
      .filter((g) => g.grant_type === "PSU")
      .flatMap((g) =>
        g.vest_schedule
          .filter((v) => new Date(v.vest_date).getFullYear() === yr)
          .map((v) => Math.round(v.shares * (psuSliders[g.grant_id] ?? g.psu_achievement_pct) / 100) * price)
      )
      .reduce((s, n) => s + n, 0);

    const total = rsuIncome + psuIncome;
    const estTax = total * taxRate;
    const forfeit = bilhYear != null && yr >= parseInt(bilhYear);

    return { year: yr, rsuIncome, psuIncome, total, estTax, forfeit };
  });

  const maxTotal = Math.max(...rows.filter((r) => !r.forfeit).map((r) => r.total), 1);

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.accent, marginBottom: 12 }}>BILH Transition Date (forfeits unvested grants)</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          {["None", "2025", "2026", "2027", "2028"].map((y) => {
            const active = (y === "None" && !bilhYear) || bilhYear === y;
            return (
              <button
                key={y}
                onClick={() => setBilhYear(y === "None" ? null : y)}
                style={{
                  background: active ? C.accent : C.dark,
                  border: "1px solid " + (active ? C.accent : C.border),
                  borderRadius: 6, color: active ? "#fff" : C.muted,
                  padding: "7px 14px", cursor: "pointer", fontSize: 12,
                  fontFamily: "Georgia, serif",
                }}
              >
                {y}
              </button>
            );
          })}
        </div>
        {bilhYear && (
          <div style={{ marginTop: 10, fontSize: 12, color: C.gold }}>
            Grants unvested as of {bilhYear} would be forfeited on transition.
          </div>
        )}
      </div>

      <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.accent, marginBottom: 16 }}>Vest Income by Year (Stacking View)</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 150 }}>
          {rows.map((r) => {
            if (r.forfeit) {
              return (
                <div key={r.year} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 10, color: C.dim }}>Forfeited</div>
                  <div style={{ width: "100%", height: 120, border: "1px dashed " + C.dim, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 18, color: C.dim }}>x</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.dim }}>{r.year}</div>
                </div>
              );
            }
            const rsuH = (r.rsuIncome / maxTotal) * 120;
            const psuH = (r.psuIncome / maxTotal) * 120;
            return (
              <div key={r.year} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 10, color: C.muted }}>{fmtUSD(r.total)}</div>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 120 }}>
                  <div style={{ width: "100%", height: psuH, background: C.gold, borderRadius: "2px 2px 0 0" }} />
                  <div style={{ width: "100%", height: rsuH, background: C.blue }} />
                </div>
                <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{r.year}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: C.muted }}>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.blue, marginRight: 4, verticalAlign: "middle" }} />RSU</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.gold, marginRight: 4, verticalAlign: "middle" }} />PSU</span>
        </div>
      </div>

      <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid " + C.border }}>
              {["Year", "RSU Income", "PSU Income", "Total Vest Income", "Est Tax", "Net", "Status"].map((h, i) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: i < 1 ? "left" : "right", fontSize: 10, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.08em", fontWeight: 400, whiteSpace: "nowrap" as const }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.year} style={{ borderBottom: "1px solid " + C.dark, background: idx % 2 === 0 ? "transparent" : C.dark, opacity: r.forfeit ? 0.4 : 1 }}>
                <td style={{ padding: "11px 12px", color: C.text, fontWeight: 600 }}>{r.year}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: C.blue }}>{r.forfeit ? "--" : fmtUSD(r.rsuIncome)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: C.gold }}>{r.forfeit ? "--" : fmtUSD(r.psuIncome)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: C.text }}>{r.forfeit ? "--" : fmtUSD(r.total)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: C.accent }}>{r.forfeit ? "--" : fmtUSD(r.estTax)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: C.green, fontWeight: 600 }}>{r.forfeit ? "--" : fmtUSD(r.total - r.estTax)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}>
                  {r.forfeit
                    ? <span style={{ background: "#2a0800", color: C.accent, padding: "2px 7px", borderRadius: 3, fontSize: 10 }}>FORFEITED</span>
                    : <span style={{ background: "#0d2010", color: C.green, padding: "2px 7px", borderRadius: 3, fontSize: 10 }}>VESTING</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
