"use client";

import type { EquityGrant } from "@/types/equity";

interface Props {
  grants: EquityGrant[];
  price: number;
  taxRate: number;
}

const C = {
  panel: "#111827", border: "#1e2d4a", accent: "#c94a00",
  green: "#3db87a", text: "#e8dfc8", muted: "#7a8fa8", dim: "#3a4a60", dark: "#0d1525",
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
function daysUntil(dateStr: string) {
  return Math.round((new Date(dateStr + "T12:00:00").getTime() - Date.now()) / 86400000);
}

const TODAY = new Date().toISOString().slice(0, 10);

export default function OptionsTab({ grants, price, taxRate }: Props) {
  const nqoGrants = grants.filter((g) => g.grant_type === "NQO" && g.strike_price != null);

  const rows = nqoGrants.map((g) => {
    const vestedShares = g.vest_schedule.filter((v) => v.vested).reduce((s, v) => s + v.shares, 0);
    const unvestedShares = g.vest_schedule.filter((v) => !v.vested).reduce((s, v) => s + v.shares, 0);
    const spread = price - (g.strike_price ?? 0);
    const itm = spread > 0;
    const grossSpread = itm ? spread * vestedShares : 0;
    const netGain = grossSpread * (1 - taxRate);
    return { ...g, vestedShares, unvestedShares, spread, itm, grossSpread, netGain };
  });

  const itmVested = rows.filter((r) => r.itm).reduce((s, r) => s + r.vestedShares, 0);
  const otmVested = rows.filter((r) => !r.itm).reduce((s, r) => s + r.vestedShares, 0);
  const netVested = rows.reduce((s, r) => s + r.netGain, 0);

  const urgentGrants = rows.filter((r) => {
    if (!r.expiration_date) return false;
    const d = daysUntil(r.expiration_date);
    return d < 1200 && d > 0;
  }).sort((a, b) => (a.expiration_date ?? "") < (b.expiration_date ?? "") ? -1 : 1);

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Vested ITM Shares", value: fmtShares(itmVested), color: C.green },
          { label: "Vested OTM Shares", value: fmtShares(otmVested), color: C.accent },
          { label: "Net Vested Gain", value: fmtUSD(netVested), color: C.green },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Georgia, serif", color }}>{value}</div>
          </div>
        ))}
      </div>

      {urgentGrants.length > 0 && (
        <div style={{ background: "#1a0d00", border: "1px solid " + C.accent, borderRadius: 8, padding: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.accent, fontWeight: 600, marginBottom: 8 }}>(!) Expiration Alerts</div>
          {urgentGrants.map((g) => {
            const days = daysUntil(g.expiration_date!);
            const spread = price - (g.strike_price ?? 0);
            return (
              <div key={g.grant_id} style={{ fontSize: 12, color: C.text, marginBottom: 4 }}>
                {g.grant_id} expires {shortDate(g.expiration_date!)} ({days} days) - strike ${(g.strike_price ?? 0).toFixed(2)} - {spread > 0 ? "ITM $" + spread.toFixed(2) + "/share" : "OTM"}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid " + C.border }}>
              {["Grant", "Strike", "Vested", "Unvested", "Spread", "Gross Spread", "Net Gain", "Expires"].map((h, i) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: i < 2 ? "left" : "right", fontSize: 10, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.1em", fontWeight: 400, whiteSpace: "nowrap" as const }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.grant_id} style={{ borderBottom: "1px solid " + C.dark, background: idx % 2 === 0 ? "transparent" : C.dark, opacity: r.itm ? 1 : 0.65 }}>
                <td style={{ padding: "10px 12px", color: C.muted, fontFamily: "monospace", fontSize: 11 }}>{r.grant_id}</td>
                <td style={{ padding: "10px 12px", color: C.muted }}>${(r.strike_price ?? 0).toFixed(2)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.green }}>{fmtShares(r.vestedShares)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.muted }}>{r.unvestedShares > 0 ? fmtShares(r.unvestedShares) : "--"}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: r.itm ? C.green : C.accent }}>
                  {r.itm ? "+" : ""}{r.spread.toFixed(2)}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: r.itm ? C.text : C.dim }}>{r.itm ? fmtUSD(r.grossSpread) : "--"}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: r.itm ? C.green : C.dim, fontWeight: r.itm ? 600 : 400 }}>{r.itm ? fmtUSD(r.netGain) : "--"}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.dim, fontSize: 11 }}>
                  {r.expiration_date ? shortDate(r.expiration_date) : "--"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: C.dim }}>
        NQO spread taxed as ordinary income. Grants with strike above current price are OTM.
      </div>
    </div>
  );
}
