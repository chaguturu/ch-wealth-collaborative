"use client";

import type { EquityGrant } from "@/types/equity";

interface Props {
  grants: EquityGrant[];
  price: number;
  taxRate: number;
  asOfYear: number;
  setAsOfYear: (y: number) => void;
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
function shortDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const YEARS = [2025, 2026, 2027, 2028, 2029];
const PRICES = [50, 60, 70, 75, 80, 85, 90, 95, 100, 105, 110, 120, 130, 140, 150, 160];

export default function SensitivityTab({ grants, price, taxRate, asOfYear, setAsOfYear }: Props) {
  const nqoGrants = grants.filter((g) => g.grant_type === "NQO" && g.strike_price != null);

  const grantRows = nqoGrants.map((g) => {
    const strike = g.strike_price ?? 0;
    const vestedShares = g.vest_schedule
      .filter((v) => new Date(v.vest_date).getFullYear() <= asOfYear)
      .reduce((s, v) => s + v.shares, 0);
    const unvestedShares = g.vest_schedule
      .filter((v) => new Date(v.vest_date).getFullYear() > asOfYear)
      .reduce((s, v) => s + v.shares, 0);
    return { grant_id: g.grant_id, strike, expiration_date: g.expiration_date, vestedShares, unvestedShares };
  });

  function netAt(p: number, shares: number, strike: number): number | null {
    const spread = p - strike;
    if (spread <= 0 || shares === 0) return null;
    return spread * shares * (1 - taxRate);
  }

  const totalByPrice = PRICES.map((p) => {
    const net = grantRows.reduce((s, g) => s + (netAt(p, g.vestedShares, g.strike) ?? 0), 0);
    return { price: p, net };
  });

  const maxNet = Math.max(...totalByPrice.map((r) => r.net), 1);
  const totalVested = grantRows.reduce((s, g) => s + g.vestedShares, 0);
  const totalUnvested = grantRows.reduce((s, g) => s + g.unvestedShares, 0);
  const currentNet = grantRows.reduce((s, g) => s + (netAt(price, g.vestedShares, g.strike) ?? 0), 0);

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" as const }}>
        {YEARS.map((y) => (
          <button
            key={y}
            onClick={() => setAsOfYear(y)}
            style={{
              background: asOfYear === y ? C.accent : C.dark,
              border: "1px solid " + (asOfYear === y ? C.accent : C.border),
              borderRadius: 6, color: asOfYear === y ? "#fff" : C.muted,
              padding: "8px 16px", cursor: "pointer", fontSize: 13,
              fontFamily: "Georgia, serif", fontWeight: asOfYear === y ? 700 : 400,
            }}
          >
            {y}
          </button>
        ))}
        <span style={{ fontSize: 12, color: C.muted, alignSelf: "center", marginLeft: 4 }}>
          View options vested as of year-end
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Vested Shares (" + asOfYear + ")", value: fmtShares(totalVested), color: C.green },
          { label: "Unvested Remaining", value: fmtShares(totalUnvested), color: C.muted },
          { label: "Net @ $" + price.toFixed(0), value: fmtUSD(currentNet), color: C.green },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Georgia, serif", color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.accent, marginBottom: 16 }}>Net After-Tax Value at Each Price</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 130, overflowX: "auto" }}>
          {totalByPrice.map((row) => {
            const barH = (row.net / maxNet) * 110;
            const isCur = Math.abs(row.price - price) < 3;
            return (
              <div key={row.price} style={{ flex: "0 0 auto", width: 42, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ fontSize: 9, color: isCur ? C.gold : C.dim, height: 12, textAlign: "center" }}>
                  {row.net > 0 ? "$" + Math.round(row.net / 1000000) + "M" : ""}
                </div>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 110 }}>
                  <div style={{ width: "100%", height: Math.max(barH, 2), background: isCur ? C.gold : C.green, borderRadius: "3px 3px 0 0", opacity: row.net === 0 ? 0.2 : 1 }} />
                </div>
                <div style={{ fontSize: 10, color: isCur ? C.gold : C.muted, fontWeight: isCur ? 700 : 400 }}>${row.price}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20, overflowX: "auto" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.accent, marginBottom: 16 }}>Net Value by Grant and Price</div>
        <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 11, minWidth: 800 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid " + C.border }}>
              <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: C.muted, textTransform: "uppercase" as const, fontWeight: 400, position: "sticky" as const, left: 0, background: C.panel, whiteSpace: "nowrap" as const }}>Grant</th>
              <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 10, color: C.muted, textTransform: "uppercase" as const, fontWeight: 400, whiteSpace: "nowrap" as const }}>Strike</th>
              <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 10, color: C.green, textTransform: "uppercase" as const, fontWeight: 400, whiteSpace: "nowrap" as const }}>Vested</th>
              {PRICES.map((p) => {
                const isCur = Math.abs(p - price) < 3;
                return (
                  <th key={p} style={{ padding: "8px 6px", textAlign: "right", fontSize: 10, color: isCur ? C.gold : C.muted, fontWeight: isCur ? 700 : 400, whiteSpace: "nowrap" as const, minWidth: 64, background: isCur ? "#1a1400" : "transparent" }}>
                    ${p}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {grantRows.map((g, gi) => {
              const maxG = Math.max(...PRICES.map((p) => netAt(p, g.vestedShares, g.strike) ?? 0), 1);
              return (
                <tr key={g.grant_id} style={{ borderBottom: "1px solid " + C.dark, background: gi % 2 === 0 ? "transparent" : C.dark, opacity: g.vestedShares > 0 ? 1 : 0.4 }}>
                  <td style={{ padding: "9px 12px", position: "sticky" as const, left: 0, background: gi % 2 === 0 ? C.panel : C.dark, whiteSpace: "nowrap" as const }}>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: C.muted }}>{g.grant_id}</div>
                    {g.expiration_date && <div style={{ fontSize: 9, color: C.dim, marginTop: 1 }}>exp {shortDate(g.expiration_date)}</div>}
                  </td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: C.muted }}>${g.strike.toFixed(2)}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: C.green, fontWeight: 600 }}>{fmtShares(g.vestedShares)}</td>
                  {PRICES.map((p) => {
                    const net = netAt(p, g.vestedShares, g.strike);
                    const isCur = Math.abs(p - price) < 3;
                    const intensity = (net != null && maxG > 0) ? net / maxG : 0;
                    const cellColor = net === null ? C.dim : `hsl(140,${30 + intensity * 50}%,${28 + intensity * 22}%)`;
                    return (
                      <td key={p} style={{ padding: "9px 6px", textAlign: "right", color: cellColor, background: isCur ? "#1a1400" : "transparent", fontWeight: intensity > 0.7 ? 600 : 400, fontSize: 11 }}>
                        {net === null ? "--" : fmtUSD(net)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr style={{ borderTop: "2px solid " + C.accent, background: C.dark }}>
              <td style={{ padding: "10px 12px", fontWeight: 700, color: C.text, position: "sticky" as const, left: 0, background: C.dark }}>TOTAL</td>
              <td />
              <td style={{ padding: "10px 10px", textAlign: "right", color: C.green, fontWeight: 700 }}>{fmtShares(totalVested)}</td>
              {PRICES.map((p) => {
                const tot = grantRows.reduce((s, g) => s + (netAt(p, g.vestedShares, g.strike) ?? 0), 0);
                const isCur = Math.abs(p - price) < 3;
                const intensity = maxNet > 0 ? tot / maxNet : 0;
                return (
                  <td key={p} style={{ padding: "10px 6px", textAlign: "right", fontWeight: 700, background: isCur ? "#1a1400" : "transparent", color: tot > 0 ? `hsl(140,${40 + intensity * 40}%,${38 + intensity * 18}%)` : C.dim }}>
                    {tot > 0 ? fmtUSD(tot) : "--"}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
