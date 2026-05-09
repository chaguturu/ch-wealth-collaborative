"use client";

import type { EquityGrant, PsuSliders } from "@/types/equity";

interface Props {
  grants: EquityGrant[];
  price: number;
  taxRate: number;
  psuSliders: PsuSliders;
}

const C = {
  panel: "#111827", border: "#1e2d4a", accent: "#c94a00",
  green: "#3db87a", gold: "#e8b84b", blue: "#5b9bd5",
  text: "#e8dfc8", muted: "#7a8fa8", dim: "#3a4a60", dark: "#0d1525",
};

function fmtUSD(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function fmtShares(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function SummaryTab({ grants, price, taxRate, psuSliders }: Props) {
  const years = Array.from(new Set(
    grants.flatMap((g) =>
      (g.grant_type === "RSU" || g.grant_type === "PSU")
        ? g.vest_schedule.map((v) => new Date(v.vest_date).getFullYear())
        : []
    )
  )).sort();

  const rows = years.map((yr) => {
    const rsuShares = grants
      .filter((g) => g.grant_type === "RSU")
      .flatMap((g) => g.vest_schedule)
      .filter((v) => new Date(v.vest_date).getFullYear() === yr)
      .reduce((s, v) => s + v.shares, 0);

    const psuShares = grants
      .filter((g) => g.grant_type === "PSU")
      .flatMap((g) =>
        g.vest_schedule
          .filter((v) => new Date(v.vest_date).getFullYear() === yr)
          .map((v) => Math.round(v.shares * (psuSliders[g.grant_id] ?? g.psu_achievement_pct) / 100))
      )
      .reduce((s, n) => s + n, 0);

    const totalShares = rsuShares + psuShares;
    const gross = totalShares * price;
    const taxAmt = gross * taxRate;
    const net = gross - taxAmt;
    return { year: yr, rsuShares, psuShares, totalShares, gross, taxAmt, net };
  });

  const totalGross = rows.reduce((s, r) => s + r.gross, 0);
  const totalNet = rows.reduce((s, r) => s + r.net, 0);
  const totalTax = rows.reduce((s, r) => s + r.taxAmt, 0);
  const maxGross = Math.max(...rows.map((r) => r.gross), 1);

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Gross Value", value: fmtUSD(totalGross), color: C.text },
          { label: "Total Tax", value: fmtUSD(totalTax), color: C.accent },
          { label: "Total Net (After Tax)", value: fmtUSD(totalNet), color: C.green },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Georgia, serif", color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.accent, marginBottom: 16 }}>Gross Vest Value by Year</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 140 }}>
          {rows.map((r) => {
            const totalH = (r.gross / maxGross) * 120;
            const taxH = (r.taxAmt / maxGross) * 120;
            const netH = totalH - taxH;
            return (
              <div key={r.year} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 10, color: C.muted, textAlign: "center" }}>{fmtUSD(r.gross)}</div>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 120 }}>
                  <div style={{ width: "100%", height: taxH, background: C.accent, opacity: 0.85, borderRadius: "2px 2px 0 0" }} />
                  <div style={{ width: "100%", height: netH, background: C.green }} />
                </div>
                <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{r.year}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: C.muted }}>
          <span>
            <span style={{ display: "inline-block", width: 10, height: 10, background: C.green, marginRight: 4, verticalAlign: "middle" }} />
            Net after tax
          </span>
          <span>
            <span style={{ display: "inline-block", width: 10, height: 10, background: C.accent, marginRight: 4, verticalAlign: "middle" }} />
            Tax
          </span>
        </div>
      </div>

      <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid " + C.border }}>
              {["Year", "RSU Shares", "PSU Shares", "Gross", "Tax", "Net After Tax"].map((h, i) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: i === 0 ? "left" : "right", fontSize: 10, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.1em", fontWeight: 400 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.year} style={{ borderBottom: "1px solid " + C.dark, background: idx % 2 === 0 ? "transparent" : C.dark }}>
                <td style={{ padding: "11px 12px", color: C.text, fontWeight: 600 }}>{r.year}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: C.muted }}>{fmtShares(r.rsuShares)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: C.gold }}>{fmtShares(r.psuShares)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: C.text }}>{fmtUSD(r.gross)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: C.accent }}>{fmtUSD(r.taxAmt)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: C.green, fontWeight: 600 }}>{fmtUSD(r.net)}</td>
              </tr>
            ))}
            <tr style={{ borderTop: "2px solid " + C.accent, background: C.dark }}>
              <td style={{ padding: "12px", color: C.text, fontWeight: 700 }}>TOTAL</td>
              <td style={{ padding: "12px", textAlign: "right", color: C.muted }}>{fmtShares(rows.reduce((s, r) => s + r.rsuShares, 0))}</td>
              <td style={{ padding: "12px", textAlign: "right", color: C.gold }}>{fmtShares(rows.reduce((s, r) => s + r.psuShares, 0))}</td>
              <td style={{ padding: "12px", textAlign: "right", color: C.text, fontWeight: 700 }}>{fmtUSD(totalGross)}</td>
              <td style={{ padding: "12px", textAlign: "right", color: C.accent, fontWeight: 700 }}>{fmtUSD(totalTax)}</td>
              <td style={{ padding: "12px", textAlign: "right", color: C.green, fontWeight: 700 }}>{fmtUSD(totalNet)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
