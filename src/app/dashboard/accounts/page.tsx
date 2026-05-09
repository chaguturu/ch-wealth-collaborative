"use client";

import { useCallback, useEffect, useState } from "react";
import PlaidLinkButton from "@/components/PlaidLinkButton";
import PageHeader from "@/components/PageHeader";
import { SkeletonLine, SkeletonCard, SkeletonPage } from "@/components/Skeleton";
import { C } from "@/lib/tokens";

function fmtUSD(n: number | null) {
  if (n == null) return "--";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface PlaidItem {
  institution_name: string;
  institution_id: string;
}

interface Account {
  id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  current_balance: number | null;
  available_balance: number | null;
  limit_amount: number | null;
  iso_currency: string;
  balance_cached_at: string | null;
  plaid_item_id: string;
  plaid_items: PlaidItem | null;
}

interface ManualAccount {
  id: string;
  name: string;
  type: string;
  subtype: string | null;
  balance: number;
  institution: string | null;
  iso_currency: string;
}

interface Transaction {
  id: string;
  date: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  personal_finance_category: string | null;
  pending: boolean;
  plaid_account_id: string;
}

type TabId = "banking" | "investments" | "liabilities" | "all";

const TAB_TYPES: Record<TabId, string[]> = {
  banking: ["depository"],
  investments: ["investment"],
  liabilities: ["credit", "loan"],
  all: ["depository", "investment", "credit", "loan", "other"],
};

function typeColor(type: string) {
  if (type === "depository") return C.blue;
  if (type === "investment") return C.green;
  if (type === "credit" || type === "loan") return C.accent;
  return C.muted;
}

function isLiab(type: string) {
  return type === "credit" || type === "loan";
}

function AccountCard({ acct, transactions }: { acct: Account; transactions: Transaction[] }) {
  const [expanded, setExpanded] = useState(false);
  const myTx = transactions.filter((t) => t.plaid_account_id === acct.id).slice(0, 10);
  const liab = isLiab(acct.type);
  const bal = acct.current_balance ?? 0;

  return (
    <div style={{ borderBottom: "1px solid " + C.dark }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: "14px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 13, color: C.text, fontFamily: "Georgia, serif" }}>
            {acct.official_name ?? acct.name}
            {acct.mask && <span style={{ fontSize: 11, color: C.dim, marginLeft: 6 }}>...{acct.mask}</span>}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2, textTransform: "capitalize" as const }}>
            {(acct.subtype ?? acct.type).replace(/_/g, " ")}
            {acct.balance_cached_at && (
              <span style={{ color: C.dim, marginLeft: 6 }}>
                updated {fmtDate(acct.balance_cached_at)}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "Georgia, serif", color: liab ? C.accent : C.green }}>
            {liab ? "-" : ""}{fmtUSD(Math.abs(bal))}
          </div>
          {acct.available_balance != null && acct.available_balance !== acct.current_balance && !liab && (
            <div style={{ fontSize: 11, color: C.muted }}>{fmtUSD(acct.available_balance)} avail</div>
          )}
          {liab && acct.limit_amount != null && (
            <div style={{ fontSize: 11, color: C.muted }}>{fmtUSD(acct.limit_amount - Math.abs(bal))} avail</div>
          )}
          <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{expanded ? "hide" : "transactions"}</div>
        </div>
      </button>

      {expanded && (
        <div style={{ paddingBottom: 12 }}>
          {myTx.length === 0 ? (
            <div style={{ fontSize: 12, color: C.dim, paddingLeft: 4, paddingBottom: 8 }}>No transactions synced yet. Use Refresh to sync.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
              <tbody>
                {myTx.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ padding: "6px 4px", color: C.dim, whiteSpace: "nowrap" as const, width: 60 }}>{fmtDate(tx.date)}</td>
                    <td style={{ padding: "6px 4px", color: C.text, flex: 1 }}>
                      {tx.merchant_name ?? tx.name}
                      {tx.pending && <span style={{ fontSize: 10, color: C.gold, marginLeft: 6 }}>pending</span>}
                    </td>
                    <td style={{ padding: "6px 4px", textAlign: "right", color: tx.amount > 0 ? C.accent : C.green, fontFamily: "Georgia, serif", whiteSpace: "nowrap" as const }}>
                      {tx.amount > 0 ? "-" : "+"}{fmtUSD(Math.abs(tx.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function InstitutionGroup({ name, accounts, transactions }: { name: string; accounts: Account[]; transactions: Transaction[] }) {
  const total = accounts.reduce((s, a) => {
    const liab = isLiab(a.type);
    return s + (liab ? -(a.current_balance ?? 0) : (a.current_balance ?? 0));
  }, 0);

  return (
    <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: "16px 20px", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: C.muted }}>{name}</div>
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "Georgia, serif", color: total >= 0 ? C.green : C.accent }}>
          {total < 0 ? "-" : ""}{fmtUSD(Math.abs(total))}
        </div>
      </div>
      {accounts.map((a) => (
        <AccountCard key={a.id} acct={a} transactions={transactions} />
      ))}
    </div>
  );
}

function ManualAccountCard({ acct }: { acct: ManualAccount }) {
  const liab = isLiab(acct.type);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid " + C.dark }}>
      <div>
        <div style={{ fontSize: 13, color: C.text }}>{acct.name}</div>
        <div style={{ fontSize: 11, color: C.muted, textTransform: "capitalize" as const }}>
          {acct.institution ? acct.institution + " - " : ""}{(acct.subtype ?? acct.type).replace(/_/g, " ")}
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "Georgia, serif", color: liab ? C.accent : C.green }}>
        {liab ? "-" : ""}{fmtUSD(Math.abs(acct.balance))}
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [manualAccounts, setManualAccounts] = useState<ManualAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState<TabId>("banking");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setAccounts(d.accounts ?? []);
        setManualAccounts(d.manualAccounts ?? []);
        setTransactions(d.transactions ?? []);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load accounts."); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch("/api/plaid/sync", { method: "POST" });
      load();
    } finally {
      setSyncing(false);
    }
  }, [load]);

  const tabAccounts = accounts.filter((a) => TAB_TYPES[tab].includes(a.type));
  const tabManual = manualAccounts.filter((a) => TAB_TYPES[tab].includes(a.type));

  // Group Plaid accounts by institution
  const byInstitution: Record<string, Account[]> = {};
  for (const a of tabAccounts) {
    const inst = a.plaid_items?.institution_name ?? "Unknown Institution";
    if (!byInstitution[inst]) byInstitution[inst] = [];
    byInstitution[inst].push(a);
  }

  const totalCash = accounts.filter((a) => a.type === "depository").reduce((s, a) => s + (a.current_balance ?? 0), 0);
  const totalInvest = accounts.filter((a) => a.type === "investment").reduce((s, a) => s + (a.current_balance ?? 0), 0);
  const totalLiab = accounts.filter((a) => isLiab(a.type)).reduce((s, a) => s + Math.abs(a.current_balance ?? 0), 0);

  const TABS: Array<{ id: TabId; label: string; count: number }> = [
    { id: "banking", label: "Banking", count: accounts.filter((a) => a.type === "depository").length },
    { id: "investments", label: "Investments", count: accounts.filter((a) => a.type === "investment").length },
    { id: "liabilities", label: "Liabilities", count: accounts.filter((a) => isLiab(a.type)).length },
    { id: "all", label: "All", count: accounts.length + manualAccounts.length },
  ];

  return (
    <div style={{ fontFamily: "Georgia, serif", background: C.bg, minHeight: "100vh", color: C.text }}>
      <PageHeader
        eyebrow="Connected via Plaid"
        title="Accounts"
        right={
          <>
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, color: syncing ? C.dim : C.muted, padding: "8px 14px", cursor: syncing ? "not-allowed" : "pointer", fontSize: 12, fontFamily: "Georgia, serif" }}
            >
              {syncing ? "Syncing..." : "Refresh Balances"}
            </button>
            <PlaidLinkButton onSuccess={load} />
          </>
        }
      />

      {error && <div style={{ padding: 20, color: C.accent, fontSize: 14 }}>{error}</div>}

      {!loading && (
        <div style={{ padding: "20px 24px" }}>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 24 }}>
            {[
              { label: "Cash & Checking", value: totalCash, color: C.blue },
              { label: "Investments", value: totalInvest, color: C.green },
              { label: "Liabilities", value: totalLiab, color: C.accent },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20, flex: "1 1 140px" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Georgia, serif", color }}>{fmtUSD(value)}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", borderBottom: "1px solid " + C.border, marginBottom: 20, overflowX: "auto" }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: "transparent", border: "none",
                  borderBottom: tab === t.id ? "2px solid " + C.accent : "2px solid transparent",
                  color: tab === t.id ? C.text : C.muted,
                  padding: "10px 16px", cursor: "pointer", fontSize: 12,
                  letterSpacing: "0.06em", fontFamily: "Georgia, serif", whiteSpace: "nowrap" as const,
                }}
              >
                {t.label}
                {t.count > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 10, color: tab === t.id ? C.accent : C.dim, background: C.dark, padding: "1px 5px", borderRadius: 8 }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {Object.keys(byInstitution).length > 0 ? (
            Object.entries(byInstitution).map(([inst, accts]) => (
              <InstitutionGroup key={inst} name={inst} accounts={accts} transactions={transactions} />
            ))
          ) : (
            tabAccounts.length === 0 && tabManual.length === 0 && (
              <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 32, textAlign: "center" as const, marginBottom: 12 }}>
                <div style={{ fontSize: 14, color: C.muted, marginBottom: 8 }}>
                  No {tab === "all" ? "" : tab} accounts connected
                </div>
                <div style={{ fontSize: 12, color: C.dim }}>
                  {tab === "investments" ? "Add investment accounts via Plaid or manually." : "Connect your bank to see accounts here."}
                </div>
              </div>
            )
          )}

          {tabManual.length > 0 && (
            <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: "16px 20px", marginBottom: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 4 }}>Manual Accounts</div>
              {tabManual.map((a) => <ManualAccountCard key={a.id} acct={a} />)}
            </div>
          )}

          {transactions.length > 0 && (tab === "banking" || tab === "all") && (
            <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: "16px 20px", marginTop: 8 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.accent, marginBottom: 16 }}>
                Recent Transactions ({transactions.length})
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid " + C.border }}>
                    {["Date", "Description", "Category", "Amount"].map((h, i) => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: i === 3 ? "right" : "left", fontSize: 10, color: C.muted, fontWeight: 400, textTransform: "uppercase" as const, letterSpacing: "0.1em", whiteSpace: "nowrap" as const }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 50).map((tx, i) => (
                    <tr key={tx.id} style={{ borderBottom: "1px solid " + C.dark, background: i % 2 === 0 ? "transparent" : C.dark }}>
                      <td style={{ padding: "9px 12px", color: C.dim, whiteSpace: "nowrap" as const }}>{fmtDate(tx.date)}</td>
                      <td style={{ padding: "9px 12px", color: C.text }}>
                        {tx.merchant_name ?? tx.name}
                        {tx.pending && <span style={{ fontSize: 10, color: C.gold, marginLeft: 6 }}>pending</span>}
                      </td>
                      <td style={{ padding: "9px 12px", color: C.dim, fontSize: 11, textTransform: "capitalize" as const }}>
                        {tx.personal_finance_category?.toLowerCase().replace(/_/g, " ") ?? ""}
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "Georgia, serif", color: tx.amount > 0 ? C.accent : C.green, whiteSpace: "nowrap" as const }}>
                        {tx.amount > 0 ? "-" : "+"}{fmtUSD(Math.abs(tx.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {loading && (
        <SkeletonPage>
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
              <SkeletonLine width="30%" height={10} mb={16} />
              {[1, 2, 3, 4].map((i) => <SkeletonLine key={i} height={44} mb={8} borderRadius={6} />)}
            </div>
          </div>
        </SkeletonPage>
      )}
    </div>
  );
}
