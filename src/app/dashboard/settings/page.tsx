"use client";

import { useEffect, useState } from "react";

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

const S: Record<string, React.CSSProperties> = {
  page: { padding: "24px 20px", fontFamily: "Georgia, serif", color: C.text, maxWidth: 900, margin: "0 auto" },
  heading: { fontSize: "1.4rem", fontWeight: 700, color: C.text, marginBottom: 4 },
  sub: { fontSize: "0.8rem", color: C.muted, marginBottom: 28 },
  section: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: "0.75rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.dim}` },
  rowLast: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" },
  label: { fontSize: "0.85rem", color: C.muted },
  value: { fontSize: "0.85rem", color: C.text, fontWeight: 600 },
  danger: { background: `${C.accent}11`, border: `1px solid ${C.accent}44`, borderRadius: 8, padding: 16, marginTop: 12 },
  input: { background: C.dark, border: `1px solid ${C.dim}`, borderRadius: 6, padding: "7px 12px", fontSize: "0.85rem", color: C.text, fontFamily: "Georgia, serif", width: "100%" },
  auditRow: { display: "flex", gap: 12, padding: "8px 0", borderBottom: `1px solid ${C.dim}`, alignItems: "flex-start" },
  auditTime: { fontSize: "0.75rem", color: C.muted, whiteSpace: "nowrap", minWidth: 140 },
  auditAction: { fontSize: "0.8rem", color: C.text },
  auditMeta: { fontSize: "0.75rem", color: C.dim },
};

function badge(color: string): React.CSSProperties {
  return { background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600 };
}
function btn(color: string): React.CSSProperties {
  return { background: "transparent", border: `1px solid ${color}`, color, borderRadius: 6, padding: "7px 16px", fontSize: "0.8rem", cursor: "pointer", fontFamily: "Georgia, serif" };
}
function btnSolid(color: string): React.CSSProperties {
  return { background: color, border: `1px solid ${color}`, color: "#fff", borderRadius: 6, padding: "7px 16px", fontSize: "0.8rem", cursor: "pointer", fontFamily: "Georgia, serif" };
}

interface Member {
  id: string;
  display_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface AuditEntry {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  created_at: string;
  member_id: string | null;
}

interface PlaidItem {
  id: string;
  institution_name: string;
  status: string;
  products: string[];
  created_at: string;
  last_successful_update: string | null;
}

interface SettingsData {
  member: Member;
  allMembers: Member[];
  auditLog: AuditEntry[];
  plaidItems: PlaidItem[];
  auth0Sub: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

const ACTION_LABELS: Record<string, string> = {
  login: "Signed in",
  logout: "Signed out",
  plaid_connect: "Connected Plaid account",
  plaid_disconnect: "Disconnected Plaid account",
  plaid_reauth: "Re-authenticated Plaid",
  data_export: "Exported household data",
  data_nuke: "Deleted all data",
  settings_change: "Changed settings",
  grant_update: "Updated equity grant",
  scenario_create: "Created scenario",
  scenario_delete: "Deleted scenario",
  advisor_link_create: "Created advisor link",
  advisor_link_revoke: "Revoked advisor link",
};

function AuditLog({ entries, members }: { entries: AuditEntry[]; members: Member[] }) {
  const [expanded, setExpanded] = useState(false);
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m.display_name]));
  const shown = expanded ? entries : entries.slice(0, 10);

  if (entries.length === 0) {
    return <p style={{ fontSize: "0.8rem", color: C.dim }}>No activity recorded yet.</p>;
  }

  return (
    <div>
      {shown.map((e) => (
        <div key={e.id} style={S.auditRow}>
          <span style={S.auditTime}>{fmtDateTime(e.created_at)}</span>
          <div style={{ flex: 1 }}>
            <div style={S.auditAction}>{ACTION_LABELS[e.action] ?? e.action}</div>
            <div style={S.auditMeta}>
              {e.member_id && memberMap[e.member_id] ? memberMap[e.member_id] + " · " : ""}
              {e.resource_type ? e.resource_type : ""}
              {e.ip_address ? " · " + e.ip_address : ""}
            </div>
          </div>
        </div>
      ))}
      {entries.length > 10 && (
        <button
          style={{ ...btn(C.muted), marginTop: 10 }}
          onClick={() => setExpanded((x) => !x)}
        >
          {expanded ? "Show less" : `Show all ${entries.length} entries`}
        </button>
      )}
    </div>
  );
}

function NukeSection({ memberRole }: { memberRole: string }) {
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function handleNuke() {
    if (confirm !== "DELETE MY DATA") return;
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/settings/nuke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error ?? "Failed");
      } else {
        setDone(true);
      }
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (memberRole !== "admin") {
    return <p style={{ fontSize: "0.8rem", color: C.dim }}>Only admins can delete data.</p>;
  }

  if (done) {
    return <p style={{ fontSize: "0.85rem", color: C.green }}>All household data deleted. Equity grants were retained.</p>;
  }

  return (
    <div style={S.danger}>
      <p style={{ fontSize: "0.8rem", color: C.accent, marginBottom: 10, fontWeight: 600 }}>
        This deletes all Plaid connections, transactions, scenarios, net worth history, and journal entries. Equity grants are retained.
      </p>
      <p style={{ fontSize: "0.8rem", color: C.muted, marginBottom: 10 }}>
        Type <strong style={{ color: C.text }}>DELETE MY DATA</strong> to confirm:
      </p>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          style={{ ...S.input, maxWidth: 240 }}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE MY DATA"
          spellCheck={false}
        />
        <button
          style={btnSolid(confirm === "DELETE MY DATA" ? C.accent : C.dim)}
          onClick={handleNuke}
          disabled={loading || confirm !== "DELETE MY DATA"}
        >
          {loading ? "Deleting..." : "Delete All Data"}
        </button>
      </div>
      {err && <p style={{ fontSize: "0.8rem", color: C.accent, marginTop: 8 }}>{err}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [tab, setTab] = useState<"account" | "connections" | "audit" | "danger">("account");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/settings/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chwealth-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ ...S.page, color: C.muted, paddingTop: 60, textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  if (!data || !data.member) {
    return (
      <div style={{ ...S.page, color: C.muted, paddingTop: 60, textAlign: "center" }}>
        Failed to load settings.
      </div>
    );
  }

  const { member, allMembers, auditLog, plaidItems } = data;

  const tabs: Array<{ key: typeof tab; label: string }> = [
    { key: "account", label: "Account" },
    { key: "connections", label: "Connections" },
    { key: "audit", label: "Audit Log" },
    { key: "danger", label: "Data" },
  ];

  return (
    <div style={S.page}>
      <h1 style={S.heading}>Settings</h1>
      <p style={S.sub}>Household: Chaguturu-Hardin</p>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: tab === t.key ? `2px solid ${C.gold}` : "2px solid transparent",
              color: tab === t.key ? C.text : C.muted,
              padding: "8px 16px",
              fontSize: "0.85rem",
              cursor: "pointer",
              fontFamily: "Georgia, serif",
              fontWeight: tab === t.key ? 700 : 400,
              marginBottom: -1,
            }}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Account tab */}
      {tab === "account" && (
        <div>
          <div style={S.section}>
            <div style={S.sectionTitle}>Your Profile</div>
            <div style={S.row}>
              <span style={S.label}>Name</span>
              <span style={S.value}>{member.display_name}</span>
            </div>
            <div style={S.row}>
              <span style={S.label}>Email</span>
              <span style={S.value}>{member.email}</span>
            </div>
            <div style={S.row}>
              <span style={S.label}>Role</span>
              <span style={badge(member.role === "admin" ? C.gold : C.blue)}>{member.role}</span>
            </div>
            <div style={S.row}>
              <span style={S.label}>Auth provider</span>
              <span style={S.value}>Google via Auth0</span>
            </div>
            <div style={S.rowLast}>
              <span style={S.label}>Member since</span>
              <span style={S.value}>{fmtDate(member.created_at)}</span>
            </div>
          </div>

          {allMembers.length > 1 && (
            <div style={S.section}>
              <div style={S.sectionTitle}>Household Members</div>
              {allMembers.map((m, i) => (
                <div key={m.id} style={i < allMembers.length - 1 ? S.row : S.rowLast}>
                  <span style={S.label}>{m.display_name}</span>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: C.muted }}>{m.email}</span>
                    <span style={badge(m.role === "admin" ? C.gold : C.blue)}>{m.role}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={S.section}>
            <div style={S.sectionTitle}>Security</div>
            <div style={S.row}>
              <span style={S.label}>Two-factor authentication</span>
              <span style={badge(C.green)}>Enforced via Auth0</span>
            </div>
            <div style={S.row}>
              <span style={S.label}>Session management</span>
              <span style={{ fontSize: "0.8rem", color: C.muted }}>Managed by Auth0 (7-day tokens)</span>
            </div>
            <div style={S.rowLast}>
              <span style={S.label}>Sign out</span>
              <a href="/auth/logout" style={{ color: C.accent, fontSize: "0.85rem", textDecoration: "none" }}>
                Sign out
              </a>
            </div>
          </div>

          <div style={S.section}>
            <div style={S.sectionTitle}>Data Export</div>
            <p style={{ fontSize: "0.8rem", color: C.muted, marginBottom: 14 }}>
              Download a full JSON backup of your household data — accounts, equity grants, scenarios, net worth history, and more. Excludes Plaid access tokens.
            </p>
            <button style={btnSolid(C.blue)} onClick={handleExport} disabled={exporting}>
              {exporting ? "Preparing export..." : "Download JSON Backup"}
            </button>
          </div>
        </div>
      )}

      {/* Connections tab */}
      {tab === "connections" && (
        <div>
          <div style={S.section}>
            <div style={S.sectionTitle}>Plaid Connections ({plaidItems.length})</div>
            {plaidItems.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: C.dim }}>
                No institutions connected. Go to{" "}
                <a href="/dashboard/accounts" style={{ color: C.blue }}>Accounts</a>{" "}
                to link your first account.
              </p>
            ) : (
              plaidItems.map((item, i) => (
                <div key={item.id} style={i < plaidItems.length - 1 ? S.row : S.rowLast}>
                  <div>
                    <div style={S.value}>{item.institution_name}</div>
                    <div style={{ fontSize: "0.75rem", color: C.muted, marginTop: 2 }}>
                      {item.products.join(", ")} · connected {fmtDate(item.created_at)}
                    </div>
                  </div>
                  <span style={badge(item.status === "active" ? C.green : C.accent)}>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={S.section}>
            <div style={S.sectionTitle}>Auth0 Identity</div>
            <div style={S.row}>
              <span style={S.label}>Auth0 subject</span>
              <span style={{ fontSize: "0.75rem", color: C.muted, fontFamily: "monospace" }}>{data.auth0Sub}</span>
            </div>
            <div style={S.rowLast}>
              <span style={S.label}>Email allowlist</span>
              <span style={badge(C.green)}>Enforced</span>
            </div>
          </div>
        </div>
      )}

      {/* Audit log tab */}
      {tab === "audit" && (
        <div style={S.section}>
          <div style={S.sectionTitle}>Activity Log (last 100 events)</div>
          <AuditLog entries={auditLog} members={allMembers} />
        </div>
      )}

      {/* Data / danger zone tab */}
      {tab === "danger" && (
        <div>
          <div style={S.section}>
            <div style={S.sectionTitle}>Data Export</div>
            <p style={{ fontSize: "0.8rem", color: C.muted, marginBottom: 14 }}>
              Download a full JSON backup of all household data. Plaid access tokens are never included.
            </p>
            <button style={btnSolid(C.blue)} onClick={handleExport} disabled={exporting}>
              {exporting ? "Preparing..." : "Download JSON Backup"}
            </button>
          </div>

          <div style={{ ...S.section, border: `1px solid ${C.accent}44` }}>
            <div style={{ ...S.sectionTitle, color: C.accent }}>Danger Zone</div>
            <p style={{ fontSize: "0.8rem", color: C.muted, marginBottom: 4 }}>
              Delete all Plaid connections, transactions, scenarios, net worth history, and journal entries.
              Equity grants are retained — they are permanent compensation records.
            </p>
            <NukeSection memberRole={member.role} />
          </div>
        </div>
      )}
    </div>
  );
}
