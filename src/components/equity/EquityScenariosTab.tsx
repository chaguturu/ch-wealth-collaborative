"use client";

import type { EquityGrant, PsuSliders } from "@/types/equity";

interface Props {
  grants: EquityGrant[];
  taxRate: number;
  psuSliders: PsuSliders;
}

const C = {
  panel: "#111827", border: "#1e2d4a", accent: "#c94a00",
  green: "#3db87a", gold: "#e8b84b", blue: "#5b9bd5",
  text: "#e8dfc8", muted: "#7a8fa8", dim: "#3a4a60", dark: "#0d1525",
};

const S_LABEL = { fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 6 };

function fmtUSD(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const SCENARIOS = [
  { label: "Bear", price: 60, color: C.accent },
  { label: "Base", price: 87, color: C.blue },
  { label: "Bull", price: 120, color: C.green },
  { label: "Recovery", price: 105, color: C.gold },
];

function calcTotal(grants: EquityGrant[], price: number, psuSliders: PsuSliders, taxRate: number) {
  let rsu = 0, psu = 0, opts = 0;
  for (const g of grants) {
    if (g.grant_type === "RSU") {
      rsu += g.vest_schedule.reduce((s, v) => s + v.shares, 0) * price;
    } else if (g.grant_type === "PSU") {
      const achievement = (psuSliders[g.grant_id] ?? g.psu_achievement_pct) / 100;
      psu += g.total_shares * achievement * price;
    } else if (g.grant_type === "NQO" && g.strike_price != null) {
      const spread = price - g.strike_price;
      if (spread <= 0) continue;
      const vested = g.vest_schedule.filter((v) => v.vested).reduce((s, v) => s + v.shares, 0);
      opts += vested * spread;
    }
  }
  const gross = rsu + psu + opts;
  return { rsu, psu, opts, gross, net: gross * (1 - taxRate) };
}

export default function EquityScenariosTab({ grants, taxRate, psuSliders }: Props) {
  const results = SCENARIOS.map((s) => ({ ...s, ...calcTotal(grants, s.price, psuSliders, taxRate) }));
  const maxGross = Math.max(...results.map((r) => r.gross), 1);

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginBottom: 24 }}>
        {results.map((r) => (
          <div key={r.label} style={{ background: C.panel, border: "1px solid " + r.color, borderRadius: 8, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: r.color, letterSpacing: "0.1em" }}>{r.label.toUpperCase()}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: r.color }}>${r.price}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><div style={S_LABEL}>RSU Value</div><div style={{ fontSize: 14, color: C.blue }}>{fmtUSD(r.rsu)}</div></div>
              <div><div style={S_LABEL}>PSU Value</div><div style={{ fontSize: 14, color: C.gold }}>{fmtUSD(r.psu)}</div></div>
              <div><div style={S_LABEL}>Options (Vested)</div><div style={{ fontSize: 14, color: C.muted }}>{fmtUSD(r.opts)}</div></div>
              <div><div style={S_LABEL}>Total Gross</div><div style={{ fontSize: 14, color: C.text }}>{fmtUSD(r.gross)}</div></div>
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid " + C.border, display: "flex", justifyContent: "space-between" }}>
              <span style={S_LABEL}>Net After Tax</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: r.color }}>{fmtUSD(r.net)}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ width: "100%", height: 6, background: C.dark, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: (r.gross / maxGross * 100) + "%", height: "100%", background: r.color, borderRadius: 3 }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.accent, marginBottom: 16 }}>Side-by-Side Comparison</div>
        <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid " + C.border }}>
              <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, color: C.muted, textTransform: "uppercase" as const, fontWeight: 400 }}>Metric</th>
              {results.map((r) => (
                <th key={r.label} style={{ padding: "10px 12px", textAlign: "right", fontSize: 10, color: r.color, textTransform: "uppercase" as const, fontWeight: 700 }}>{r.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: "CVS Price", fn: (r: typeof results[0]) => "$" + r.price, bold: false },
              { label: "RSU Value", fn: (r: typeof results[0]) => fmtUSD(r.rsu), bold: false },
              { label: "PSU Value", fn: (r: typeof results[0]) => fmtUSD(r.psu), bold: false },
              { label: "Options (vested)", fn: (r: typeof results[0]) => fmtUSD(r.opts), bold: false },
              { label: "Total Gross", fn: (r: typeof results[0]) => fmtUSD(r.gross), bold: true },
              { label: "Total Net (after tax)", fn: (r: typeof results[0]) => fmtUSD(r.net), bold: true },
            ].map((row, idx) => (
              <tr key={row.label} style={{ borderBottom: "1px solid " + C.dark, background: idx % 2 === 0 ? "transparent" : C.dark }}>
                <td style={{ padding: "11px 12px", color: row.bold ? C.text : C.muted, fontWeight: row.bold ? 600 : 400 }}>{row.label}</td>
                {results.map((r) => (
                  <td key={r.label} style={{ padding: "11px 12px", textAlign: "right", color: row.bold ? r.color : C.text, fontWeight: row.bold ? 700 : 400 }}>
                    {row.fn(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
