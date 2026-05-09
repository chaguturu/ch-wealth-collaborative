"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const C = {
  bg: "#0b0f1c",
  panel: "#111827",
  border: "#1e2d4a",
  accent: "#c94a00",
  green: "#3db87a",
  gold: "#e8b84b",
  blue: "#5b9bd5",
  text: "#e8dfc8",
  muted: "#7a8fa8",
  dim: "#3a4a60",
  dark: "#0d1525",
};

function fmtUSD(n: number, decimals = 0) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: decimals });
}

function shortDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

interface PlaidAccount {
  id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  current_balance: number | null;
  iso_currency: string;
  balance_cached_at: string | null;
}

interface ManualAccount {
  id: string;
  name: string;
  type: string;
  subtype: string | null;
  balance: number;
  institution: string | null;
}

interface Snapshot {
  snapshot_date: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  equity_comp_value: number | null;
}

interface Grant {
  grant_id: string;
  grant_type: string;
  total_shares: number;
  strike_price: number | null;
  psu_achievement_pct: number;
  equity_vest_schedule: Array<{ vest_date: string; shares: number; vested: boolean }>;
}

function computeEquityValue(grants: Grant[], price: number): number {
  let total = 0;
  for (const g of grants) {
    if (g.grant_type === "RSU") {
      const shares = g.equity_vest_schedule.reduce((s, v) => s + v.shares, 0);
      total += shares * price;
    } else if (g.grant_type === "PSU") {
      const achievement = g.psu_achievement_pct / 100;
      total += g.total_shares * achievement * price;
    } else if (g.grant_type === "NQO" && g.strike_price != null) {
      const spread = price - g.strike_price;
      if (spread <= 0) continue;
      const vested = g.equity_vest_schedule.filter((v) => v.vested).reduce((s, v) => s + v.shares, 0);
      total += vested * spread;
    }
  }
  return total;
}

function isAsset(type: string) {
  return type === "depository" || type === "investment" || type === "other";
}
function isLiability(type: string) {
  return type === "credit" || type === "loan";
}

const TYPE_COLORS: Record<string, string> = {
  depository: C.blue,
  investment: C.green,
  credit: C.accent,
  loan: "#ff6b35",
  other: C.muted,
  equity: C.gold,
};

const TYPE_LABELS: Record<string, string> = {
  depository: "Cash & Checking",
  investment: "Investments",
  credit: "Credit Cards",
  loan: "Loans",
  other: "Other",
  equity: "CVS Equity",
};

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20, flex: "1 1 160px" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Georgia, serif", color: color ?? C.text }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function AllocationBar({ slices }: { slices: Array<{ label: string; value: number; color: string }> }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return null;
  return (
    <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", gap: 1 }}>
      {slices.filter((s) => s.value > 0).map((s) => (
        <div key={s.label} style={{ width: (s.value / total * 100) + "%", background: s.color, minWidth: 2 }} />
      ))}
    </div>
  );
}

function AccountRow({ name, type, subtype, balance, isLiab }: { name: string; type: string; subtype: string | null; balance: number; isLiab: boolean }) {
  const color = TYPE_COLORS[type] ?? C.muted;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid " + C.dark }}>
      <div>
        <div style={{ fontSize: 13, color: C.text }}>{name}</div>
        {subtype && <div style={{ fontSize: 11, color: C.dim, marginTop: 2, textTransform: "capitalize" as const }}>{subtype.replace(/_/g, " ")}</div>}
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "Georgia, serif", color: isLiab ? C.accent : C.green }}>
          {isLiab ? "-" : ""}{fmtUSD(Math.abs(balance))}
        </div>
        <div style={{ fontSize: 10, color }}>
          {TYPE_LABELS[type] ?? type}
        </div>
      </div>
    </div>
  );
}

export default function NetWorthPage() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [manualAccounts, setManualAccounts] = useState<ManualAccount[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [cvsPrice, setCvsPrice] = useState(87.37);
  const [priceStatus, setPriceStatus] = useState<"loading" | "live" | "fallback">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/networth")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setAccounts(d.accounts ?? []);
        setManualAccounts(d.manualAccounts ?? []);
        setSnapshots(d.snapshots ?? []);
        setGrants(d.grants ?? []);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load data."); setLoading(false); });
  }, []);

  useEffect(() => {
    fetch("/api/equity/price?ticker=CVS")
      .then((r) => r.json())
      .then((d) => {
        setCvsPrice(d.price ?? 87.37);
        setPriceStatus(d.source === "live" ? "live" : "fallback");
      })
      .catch(() => setPriceStatus("fallback"));
  }, []);

  const equityValue = computeEquityValue(grants, cvsPrice);

  const plaidAssets = accounts.filter((a) => isAsset(a.type)).reduce((s, a) => s + (a.current_balance ?? 0), 0);
  const plaidLiabilities = accounts.filter((a) => isLiability(a.type)).reduce((s, a) => s + Math.abs(a.current_balance ?? 0), 0);
  const manualAssets = manualAccounts.filter((a) => isAsset(a.type)).reduce((s, a) => s + a.balance, 0);
  const manualLiabilities = manualAccounts.filter((a) => isLiability(a.type)).reduce((s, a) => s + Math.abs(a.balance), 0);

  const totalAssets = plaidAssets + manualAssets + equityValue;
  const totalLiabilities = plaidLiabilities + manualLiabilities;
  const netWorth = totalAssets - totalLiabilities;

  const cashBalance = accounts.filter((a) => a.type === "depository").reduce((s, a) => s + (a.current_balance ?? 0), 0)
    + manualAccounts.filter((a) => a.type === "depository").reduce((s, a) => s + a.balance, 0);
  const investBalance = accounts.filter((a) => a.type === "investment").reduce((s, a) => s + (a.current_balance ?? 0), 0)
    + manualAccounts.filter((a) => a.type === "investment").reduce((s, a) => s + a.balance, 0);

  const allocationSlices = [
    { label: "Cash", value: cashBalance, color: C.blue },
    { label: "Investments", value: investBalance, color: C.green },
    { label: "CVS Equity", value: equityValue, color: C.gold },
  ].filter((s) => s.value > 0);

  const totalAlloc = allocationSlices.reduce((s, x) => s + x.value, 0);

  const chartData = snapshots.map((s) => ({
    date: shortDate(s.snapshot_date),
    netWorth: Math.round(s.net_worth),
  }));

  const sortedAccounts = [...accounts].sort((a, b) => {
    const order: Record<string, number> = { depository: 0, investment: 1, credit: 2, loan: 3, other: 4 };
    return (order[a.type] ?? 5) - (order[b.type] ?? 5);
  });

  return (
    <div style={{ fontFamily: "Georgia, serif", background: C.bg, minHeight: "100vh", color: C.text }}>
      <div style={{ background: "linear-gradient(135deg, #0b0f1c 0%, #132040 100%)", borderBottom: "1px solid " + C.accent, padding: "20px 24px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.3em", color: C.accent, textTransform: "uppercase" as const, marginBottom: 4 }}>
          Chaguturu-Hardin Household
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.text }}>Net Worth</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 8 }}>
          {loading ? (
            <div style={{ fontSize: 36, fontWeight: 700, color: C.muted }}>--</div>
          ) : (
            <div style={{ fontSize: 36, fontWeight: 700, color: netWorth >= 0 ? C.green : C.accent }}>
              {fmtUSD(netWorth)}
            </div>
          )}
          <div style={{ fontSize: 11, color: C.muted }}>
            {priceStatus === "live" && <span style={{ color: C.green }}>live price</span>}
            {priceStatus === "fallback" && <span style={{ color: C.dim }}>est. price</span>}
          </div>
        </div>
      </div>

      {error && <div style={{ padding: 20, color: C.accent, fontSize: 14 }}>{error}</div>}

      {!loading && (
        <div style={{ padding: "20px 24px" }}>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 24 }}>
            <StatCard label="Total Assets" value={fmtUSD(totalAssets)} color={C.green} />
            <StatCard label="Total Liabilities" value={fmtUSD(totalLiabilities)} color={C.accent} />
            <StatCard label="CVS Equity" value={fmtUSD(equityValue)} color={C.gold}
              sub={"CVS @ $" + cvsPrice.toFixed(2)} />
            <StatCard label="Liquid Cash" value={fmtUSD(cashBalance)} color={C.blue} />
          </div>

          {allocationSlices.length > 0 && (
            <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.accent, marginBottom: 16 }}>Asset Allocation</div>
              <AllocationBar slices={allocationSlices} />
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "16px 24px", marginTop: 16 }}>
                {allocationSlices.map((s) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, color: C.muted }}>{s.label}</div>
                      <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{fmtUSD(s.value)}</div>
                      <div style={{ fontSize: 10, color: C.dim }}>{totalAlloc > 0 ? ((s.value / totalAlloc) * 100).toFixed(0) + "%" : ""}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chartData.length >= 2 && (
            <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.accent, marginBottom: 16 }}>Net Worth Trend</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v) => [fmtUSD(v as number), "Net Worth"]}
                    contentStyle={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 6, fontSize: 12 }}
                    labelStyle={{ color: C.text }}
                    itemStyle={{ color: C.green }}
                  />
                  <Line type="monotone" dataKey="netWorth" stroke={C.green} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {sortedAccounts.length > 0 && (
            <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.accent, marginBottom: 16 }}>
                Connected Accounts ({sortedAccounts.length})
              </div>
              {sortedAccounts.map((a) => (
                <AccountRow
                  key={a.id}
                  name={a.official_name ?? a.name}
                  type={a.type}
                  subtype={a.subtype}
                  balance={a.current_balance ?? 0}
                  isLiab={isLiability(a.type)}
                />
              ))}
            </div>
          )}

          {manualAccounts.length > 0 && (
            <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.accent, marginBottom: 16 }}>
                Manual Accounts ({manualAccounts.length})
              </div>
              {manualAccounts.map((a) => (
                <AccountRow
                  key={a.id}
                  name={a.name}
                  type={a.type}
                  subtype={a.subtype}
                  balance={a.balance}
                  isLiab={isLiability(a.type)}
                />
              ))}
            </div>
          )}

          {sortedAccounts.length === 0 && manualAccounts.length === 0 && (
            <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 32, textAlign: "center" as const }}>
              <div style={{ fontSize: 14, color: C.muted, marginBottom: 8 }}>No accounts connected yet</div>
              <div style={{ fontSize: 12, color: C.dim }}>Connect your bank accounts in the Accounts tab to see a complete net worth picture.</div>
            </div>
          )}

          <div style={{ fontSize: 11, color: C.dim, textAlign: "center" as const, marginTop: 8 }}>
            CVS equity at ${cvsPrice.toFixed(2)}/share (100% PSU target). Balances from Plaid -- may be delayed up to 24h.
          </div>

        </div>
      )}

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: C.muted, fontSize: 14 }}>
          Loading...
        </div>
      )}
    </div>
  );
}
