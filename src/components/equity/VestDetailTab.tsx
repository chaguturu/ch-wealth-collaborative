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
function shortDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function VestDetailTab({ grants, price, taxRate, psuSliders }: Props) {
  const events: Array<{
    date: string;
    grant: string;
    type: string;
    shares: number;
    gross: number;
    taxAmt: number;
    net: number;
    note: string;
  }> = [];

  for (const g of grants) {
    if (g.grant_type === "RSU") {
      for (const v of g.vest_schedule) {
        const gross = v.shares * price;
        events.push({ date: v.vest_date, grant: g.grant_id, type: "RSU", shares: v.shares, gross, taxAmt: gross * taxRate, net: gross * (1 - taxRate), note: "" });
      }
    } else if (g.grant_type === "PSU") {
      const pct = psuSliders[g.grant_id] ?? g.psu_achievement_pct;
      for (const v of g.vest_schedule) {
        const achieved = Math.round(v.shares * pct / 100);
        const gross = achieved * price;
        events.push({ date: v.vest_date, grant: g.grant_id, type: "PSU", shares: achieved, gross, taxAmt: gross * taxRate, net: gross * (1 - taxRate), note: pct + "% of " + fmtShares(v.shares) + " target" });
      }
    }
  }

  events.sort((a, b) => a.date < b.date ? -1 : 1);

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid " + C.border }}>
              {["Vest Date", "Grant", "Type", "Shares", "Gross", "Tax", "Net", "Notes"].map((h, i) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: i < 3 ? "left" : "right", fontSize: 10, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.1em", fontWeight: 400, whiteSpace: "nowrap" as const }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((e, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid " + C.dark, background: idx % 2 === 0 ? "transparent" : C.dark }}>
                <td style={{ padding: "10px 12px", color: C.text, whiteSpace: "nowrap" as const }}>{shortDate(e.date)}</td>
                <td style={{ padding: "10px 12px", color: C.muted, fontFamily: "monospace", fontSize: 11 }}>{e.grant}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ background: e.type === "RSU" ? "#162040" : "#261a08", color: e.type === "RSU" ? C.blue : C.gold, padding: "2px 7px", borderRadius: 3, fontSize: 10 }}>
                    {e.type}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.muted }}>{fmtShares(e.shares)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.text }}>{fmtUSD(e.gross)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.accent }}>{fmtUSD(e.taxAmt)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.green, fontWeight: 600 }}>{fmtUSD(e.net)}</td>
                <td style={{ padding: "10px 12px", color: C.dim, fontSize: 11 }}>{e.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
