"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts";

const C = {
  bg: "#0b0f1c", panel: "#111827", border: "#1e2d4a",
  accent: "#c94a00", green: "#3db87a", gold: "#e8b84b",
  blue: "#5b9bd5", text: "#e8dfc8", muted: "#7a8fa8",
  dim: "#3a4a60", dark: "#0d1525",
};

function fmtUSD(n: number) {
  if (Math.abs(n) >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return "$" + (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function fmtFull(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function shortDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const EVENT_TYPE_COLOR: Record<string, string> = {
  career: C.blue, equity: C.gold, life: C.green, market: C.accent,
};
const EVENT_TYPE_LABEL: Record<string, string> = {
  career: "Career", equity: "Equity", life: "Life", market: "Market",
};

const EVENT_SUBTYPES: Array<{ type: string; subtype: string; label: string; paramLabel: string; paramKey: string; isPercent?: boolean }> = [
  { type: "career", subtype: "promotion", label: "Promotion / Raise", paramLabel: "Annual income change ($)", paramKey: "annual_income_change" },
  { type: "career", subtype: "job_change", label: "Job Change", paramLabel: "Annual income change ($)", paramKey: "annual_income_change" },
  { type: "career", subtype: "sabbatical", label: "Sabbatical / Leave", paramLabel: "Income loss per year ($)", paramKey: "annual_income_change" },
  { type: "career", subtype: "retirement", label: "Retirement", paramLabel: "Annual income change ($)", paramKey: "annual_income_change" },
  { type: "equity", subtype: "exercise_options", label: "Exercise Options", paramLabel: "Net proceeds after tax ($)", paramKey: "cash_impact" },
  { type: "equity", subtype: "sell_shares", label: "Sell Shares", paramLabel: "Net proceeds after tax ($)", paramKey: "cash_impact" },
  { type: "equity", subtype: "new_grant", label: "New Grant", paramLabel: "Estimated value ($)", paramKey: "cash_impact" },
  { type: "life", subtype: "home_purchase", label: "Home Purchase", paramLabel: "Down payment + costs ($, negative)", paramKey: "cash_impact" },
  { type: "life", subtype: "major_expense", label: "Major Expense", paramLabel: "Amount ($, negative)", paramKey: "cash_impact" },
  { type: "life", subtype: "inheritance", label: "Inheritance / Windfall", paramLabel: "Amount ($)", paramKey: "cash_impact" },
  { type: "life", subtype: "giving", label: "Charitable Giving", paramLabel: "Amount ($, negative)", paramKey: "cash_impact" },
  { type: "market", subtype: "stock_move", label: "CVS Price Move", paramLabel: "New CVS price assumption ($)", paramKey: "cvs_price" },
  { type: "market", subtype: "correction", label: "Portfolio Correction", paramLabel: "Portfolio change (%)", paramKey: "portfolio_pct_change", isPercent: true },
];

interface Scenario {
  id: string;
  name: string;
  description: string | null;
  is_baseline: boolean;
  created_at?: string;
}

interface ScenarioEvent {
  id: string;
  event_type: string;
  event_subtype: string;
  label: string;
  event_date: string;
  end_date: string | null;
  parameters: Record<string, number>;
  sort_order: number;
}

interface Grant {
  grant_id: string;
  grant_type: string;
  total_shares: number;
  strike_price: number | null;
  psu_achievement_pct: number;
  equity_vest_schedule: Array<{ vest_date: string; shares: number; vested: boolean }>;
}

const PROJ_YEARS = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];
const ANNUAL_RETURN = 0.06;
const TAX_RATE = 0.4435;

function projectNetWorth(
  startNW: number,
  grants: Grant[],
  cvsPrice: number,
  events: ScenarioEvent[]
): Array<{ year: number; netWorth: number }> {
  let nw = startNW;
  let annualIncomeDelta = 0;
  let currentCvsPrice = cvsPrice;

  return PROJ_YEARS.map((yr) => {
    // Equity vest income for this year (RSU + PSU net of tax)
    let vestIncome = 0;
    for (const g of grants) {
      const vests = g.equity_vest_schedule.filter(
        (v) => new Date(v.vest_date + "T12:00:00").getFullYear() === yr
      );
      if (g.grant_type === "RSU") {
        vestIncome += vests.reduce((s, v) => s + v.shares, 0) * currentCvsPrice * (1 - TAX_RATE);
      } else if (g.grant_type === "PSU") {
        const ach = g.psu_achievement_pct / 100;
        vestIncome += vests.reduce((s, v) => s + v.shares, 0) * ach * currentCvsPrice * (1 - TAX_RATE);
      }
    }

    // Apply events for this year
    let oneTimeCash = 0;
    for (const ev of events) {
      const evYear = new Date(ev.event_date + "T12:00:00").getFullYear();
      const endYear = ev.end_date ? new Date(ev.end_date + "T12:00:00").getFullYear() : evYear;

      if (evYear === yr) {
        if (ev.event_subtype === "stock_move") {
          currentCvsPrice = ev.parameters.cvs_price ?? currentCvsPrice;
        } else if (ev.event_subtype === "correction") {
          const pct = (ev.parameters.portfolio_pct_change ?? 0) / 100;
          nw = nw * (1 + pct);
        } else if (ev.parameters.cash_impact != null) {
          oneTimeCash += ev.parameters.cash_impact;
        } else if (ev.parameters.annual_income_change != null) {
          annualIncomeDelta += ev.parameters.annual_income_change;
        }
      }
      // End recurring income changes
      if (ev.parameters.annual_income_change != null && endYear === yr - 1) {
        annualIncomeDelta -= ev.parameters.annual_income_change;
      }
    }

    const baseGrowth = nw * ANNUAL_RETURN;
    nw = nw + baseGrowth + vestIncome + annualIncomeDelta + oneTimeCash;
    return { year: yr, netWorth: Math.round(nw) };
  });
}

function EventCard({ ev, onDelete }: { ev: ScenarioEvent; onDelete: () => void }) {
  const color = EVENT_TYPE_COLOR[ev.event_type] ?? C.muted;
  const param = Object.entries(ev.parameters)[0];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid " + C.dark }}>
      <div style={{ width: 3, alignSelf: "stretch", background: color, borderRadius: 2, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{ev.label}</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
          {shortDate(ev.event_date)}
          {ev.end_date && " - " + shortDate(ev.end_date)}
          <span style={{ marginLeft: 8, background: color + "22", color, padding: "1px 6px", borderRadius: 3, fontSize: 10 }}>
            {EVENT_TYPE_LABEL[ev.event_type]}
          </span>
        </div>
        {param && (
          <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>
            {param[0].replace(/_/g, " ")}: {typeof param[1] === "number" && param[0] !== "portfolio_pct_change"
              ? fmtFull(param[1])
              : param[1] + (param[0] === "portfolio_pct_change" ? "%" : "")}
          </div>
        )}
      </div>
      <button
        onClick={onDelete}
        style={{ background: "transparent", border: "none", color: C.dim, cursor: "pointer", fontSize: 16, padding: "2px 6px", lineHeight: 1 }}
      >
        x
      </button>
    </div>
  );
}

function AddEventForm({ onAdd, onCancel }: { onAdd: (ev: Omit<ScenarioEvent, "id" | "sort_order">) => void; onCancel: () => void }) {
  const [subtype, setSubtype] = useState(EVENT_SUBTYPES[0].subtype);
  const [label, setLabel] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [paramVal, setParamVal] = useState("");

  const def = EVENT_SUBTYPES.find((s) => s.subtype === subtype) ?? EVENT_SUBTYPES[0];

  function submit() {
    const n = parseFloat(paramVal);
    if (!label.trim() || !date || isNaN(n)) return;
    onAdd({
      event_type: def.type,
      event_subtype: def.subtype,
      label: label.trim(),
      event_date: date,
      end_date: endDate || null,
      parameters: { [def.paramKey]: n },
    });
  }

  return (
    <div style={{ background: C.dark, border: "1px solid " + C.border, borderRadius: 8, padding: 20, marginTop: 16 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.accent, marginBottom: 14 }}>Add Event</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 10, color: C.muted, display: "block", marginBottom: 4 }}>Event Type</label>
          <select
            value={subtype}
            onChange={(e) => { setSubtype(e.target.value); setLabel(EVENT_SUBTYPES.find((s) => s.subtype === e.target.value)?.label ?? ""); }}
            style={{ width: "100%", background: C.panel, border: "1px solid " + C.border, borderRadius: 4, color: C.text, padding: "7px 10px", fontSize: 13, fontFamily: "Georgia, serif" }}
          >
            {EVENT_SUBTYPES.map((s) => (
              <option key={s.subtype} value={s.subtype}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10, color: C.muted, display: "block", marginBottom: 4 }}>Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Accept new role at BILH"
            style={{ width: "100%", background: C.panel, border: "1px solid " + C.border, borderRadius: 4, color: C.text, padding: "7px 10px", fontSize: 13, fontFamily: "Georgia, serif", boxSizing: "border-box" as const }}
          />
        </div>
        <div>
          <label style={{ fontSize: 10, color: C.muted, display: "block", marginBottom: 4 }}>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: "100%", background: C.panel, border: "1px solid " + C.border, borderRadius: 4, color: C.text, padding: "7px 10px", fontSize: 13 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 10, color: C.muted, display: "block", marginBottom: 4 }}>End Date (optional, for recurring)</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ width: "100%", background: C.panel, border: "1px solid " + C.border, borderRadius: 4, color: C.text, padding: "7px 10px", fontSize: 13 }}
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontSize: 10, color: C.muted, display: "block", marginBottom: 4 }}>{def.paramLabel}</label>
          <input
            type="number"
            value={paramVal}
            onChange={(e) => setParamVal(e.target.value)}
            placeholder={def.isPercent ? "e.g. -20" : "e.g. 50000"}
            style={{ width: "100%", background: C.panel, border: "1px solid " + C.border, borderRadius: 4, color: C.text, padding: "7px 10px", fontSize: 13, fontFamily: "Georgia, serif", boxSizing: "border-box" as const }}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={submit}
          style={{ background: C.accent, border: "none", borderRadius: 6, color: "#fff", padding: "9px 20px", cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif", fontWeight: 600 }}
        >
          Add Event
        </button>
        <button
          onClick={onCancel}
          style={{ background: "transparent", border: "1px solid " + C.border, borderRadius: 6, color: C.muted, padding: "9px 16px", cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [events, setEvents] = useState<ScenarioEvent[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [startNW, setStartNW] = useState(0);
  const [cvsPrice, setCvsPrice] = useState(87.37);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load scenarios list + net worth baseline
  useEffect(() => {
    Promise.all([
      fetch("/api/scenarios").then((r) => r.json()),
      fetch("/api/networth").then((r) => r.json()),
      fetch("/api/equity/price?ticker=CVS").then((r) => r.json()),
    ]).then(([sc, nw, pr]) => {
      setScenarios(sc.scenarios ?? []);
      if (sc.scenarios?.length) setActiveId(sc.scenarios[0].id);
      // Compute start net worth from accounts
      const accts: Array<{ type: string; current_balance: number | null }> = nw.accounts ?? [];
      const manual: Array<{ type: string; balance: number }> = nw.manualAccounts ?? [];
      const assets = accts.filter((a) => a.type !== "credit" && a.type !== "loan").reduce((s, a) => s + (a.current_balance ?? 0), 0)
        + manual.filter((a) => a.type !== "credit" && a.type !== "loan").reduce((s, a) => s + a.balance, 0);
      const liabs = accts.filter((a) => a.type === "credit" || a.type === "loan").reduce((s, a) => s + Math.abs(a.current_balance ?? 0), 0)
        + manual.filter((a) => a.type === "credit" || a.type === "loan").reduce((s, a) => s + Math.abs(a.balance), 0);
      setStartNW(assets - liabs);
      setGrants(nw.grants ?? []);
      setCvsPrice(pr.price ?? 87.37);
      setLoading(false);
    });
  }, []);

  // Load events for active scenario
  useEffect(() => {
    if (!activeId) { setEvents([]); return; }
    fetch(`/api/scenarios/${activeId}`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []));
  }, [activeId]);

  const activeScenario = scenarios.find((s) => s.id === activeId) ?? null;

  async function createScenario() {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    }).then((r) => r.json());
    if (res.scenario) {
      setScenarios((prev) => [...prev, res.scenario]);
      setActiveId(res.scenario.id);
      setNewName("");
      setShowNewForm(false);
    }
    setSaving(false);
  }

  async function deleteScenario(id: string) {
    await fetch(`/api/scenarios/${id}`, { method: "DELETE" });
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) setActiveId(scenarios.find((s) => s.id !== id)?.id ?? null);
  }

  async function addEvent(ev: Omit<ScenarioEvent, "id" | "sort_order">) {
    if (!activeId) return;
    setSaving(true);
    const res = await fetch(`/api/scenarios/${activeId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ev),
    }).then((r) => r.json());
    if (res.event) {
      setEvents((prev) => [...prev, res.event].sort((a, b) => a.event_date < b.event_date ? -1 : 1));
      setShowAddEvent(false);
    }
    setSaving(false);
  }

  async function deleteEvent(eventId: string) {
    if (!activeId) return;
    await fetch(`/api/scenarios/${activeId}/events?eventId=${eventId}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  const projData = projectNetWorth(startNW, grants, cvsPrice, events);
  const maxNW = Math.max(...projData.map((d) => d.netWorth));

  return (
    <div style={{ fontFamily: "Georgia, serif", background: C.bg, minHeight: "100vh", color: C.text }}>
      <div style={{ background: "linear-gradient(135deg, #0b0f1c 0%, #132040 100%)", borderBottom: "1px solid " + C.accent, padding: "20px 24px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.3em", color: C.accent, textTransform: "uppercase" as const, marginBottom: 4 }}>Life Planning</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.text }}>Scenario Planner</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Model life events and see their impact on your net worth trajectory</div>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: C.muted, fontSize: 14 }}>
          Loading...
        </div>
      ) : (
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>

            {/* Scenario list */}
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 12 }}>Scenarios</div>
              {scenarios.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  style={{
                    background: activeId === s.id ? "#1a2640" : C.panel,
                    border: "1px solid " + (activeId === s.id ? C.blue : C.border),
                    borderLeft: "3px solid " + (activeId === s.id ? C.blue : "transparent"),
                    borderRadius: 6, padding: "10px 12px", marginBottom: 8, cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, color: activeId === s.id ? C.text : C.muted, fontWeight: activeId === s.id ? 600 : 400 }}>
                      {s.name}
                    </div>
                    {s.is_baseline && <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>baseline</div>}
                  </div>
                  {!s.is_baseline && scenarios.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteScenario(s.id); }}
                      style={{ background: "transparent", border: "none", color: C.dim, cursor: "pointer", fontSize: 14, padding: "0 2px" }}
                    >
                      x
                    </button>
                  )}
                </div>
              ))}

              {showNewForm ? (
                <div style={{ marginTop: 8 }}>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createScenario()}
                    placeholder="Scenario name"
                    autoFocus
                    style={{ width: "100%", background: C.dark, border: "1px solid " + C.border, borderRadius: 4, color: C.text, padding: "7px 10px", fontSize: 12, fontFamily: "Georgia, serif", boxSizing: "border-box" as const, marginBottom: 6 }}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={createScenario} disabled={saving} style={{ flex: 1, background: C.accent, border: "none", borderRadius: 4, color: "#fff", padding: "7px", cursor: "pointer", fontSize: 12, fontFamily: "Georgia, serif" }}>
                      Create
                    </button>
                    <button onClick={() => { setShowNewForm(false); setNewName(""); }} style={{ background: "transparent", border: "1px solid " + C.border, borderRadius: 4, color: C.muted, padding: "7px 10px", cursor: "pointer", fontSize: 12 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewForm(true)}
                  style={{ width: "100%", background: "transparent", border: "1px dashed " + C.border, borderRadius: 6, color: C.dim, padding: "9px", cursor: "pointer", fontSize: 12, fontFamily: "Georgia, serif", marginTop: 4 }}
                >
                  + New Scenario
                </button>
              )}
            </div>

            {/* Main content */}
            <div>
              {!activeScenario ? (
                <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 32, textAlign: "center" as const }}>
                  <div style={{ fontSize: 14, color: C.muted }}>Create a scenario to start modeling</div>
                </div>
              ) : (
                <>
                  {/* Projection chart */}
                  <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20, marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.accent }}>Net Worth Trajectory</div>
                        <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                          {activeScenario.name} &mdash; 2025-2035
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: C.muted }}>2035 projection</div>
                        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "Georgia, serif", color: C.green }}>
                          {fmtUSD(projData[projData.length - 1]?.netWorth ?? 0)}
                        </div>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={projData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <XAxis dataKey="year" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip
                          formatter={(v) => [fmtFull(v as number), "Net Worth"]}
                          contentStyle={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 6, fontSize: 12 }}
                          labelStyle={{ color: C.text }}
                          itemStyle={{ color: C.green }}
                          labelFormatter={(l) => String(l)}
                        />
                        {events.map((ev) => {
                          const yr = new Date(ev.event_date + "T12:00:00").getFullYear();
                          if (yr < 2025 || yr > 2035) return null;
                          return (
                            <ReferenceLine
                              key={ev.id}
                              x={yr}
                              stroke={EVENT_TYPE_COLOR[ev.event_type] ?? C.dim}
                              strokeDasharray="3 3"
                              strokeOpacity={0.6}
                            />
                          );
                        })}
                        <Line type="monotone" dataKey="netWorth" stroke={C.green} strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" as const }}>
                      {projData.filter((_, i) => i % 2 === 1 || i === projData.length - 1).map((d) => (
                        <div key={d.year} style={{ textAlign: "center", minWidth: 60 }}>
                          <div style={{ fontSize: 10, color: C.dim }}>{d.year}</div>
                          <div style={{ fontSize: 12, color: C.green, fontFamily: "Georgia, serif" }}>{fmtUSD(d.netWorth)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assumptions */}
                  <div style={{ background: C.dark, border: "1px solid " + C.border, borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 11, color: C.dim }}>
                    Assumptions: {ANNUAL_RETURN * 100}% annual base return on portfolio &bull; CVS price ${cvsPrice.toFixed(2)} &bull; {(TAX_RATE * 100).toFixed(2)}% tax on equity vests &bull; RSU+PSU vest schedule from active grants &bull; NQO spreads not projected
                  </div>

                  {/* Events timeline */}
                  <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: C.accent }}>
                        Events ({events.length})
                      </div>
                      <button
                        onClick={() => setShowAddEvent((v) => !v)}
                        style={{ background: showAddEvent ? C.dark : C.accent, border: "none", borderRadius: 6, color: showAddEvent ? C.muted : "#fff", padding: "7px 14px", cursor: "pointer", fontSize: 12, fontFamily: "Georgia, serif" }}
                      >
                        {showAddEvent ? "Cancel" : "+ Add Event"}
                      </button>
                    </div>

                    {showAddEvent && (
                      <AddEventForm
                        onAdd={addEvent}
                        onCancel={() => setShowAddEvent(false)}
                      />
                    )}

                    {events.length === 0 && !showAddEvent ? (
                      <div style={{ fontSize: 13, color: C.dim, padding: "20px 0", textAlign: "center" as const }}>
                        No events yet. Add career changes, equity exercises, life events, or market assumptions.
                      </div>
                    ) : (
                      events.map((ev) => (
                        <EventCard key={ev.id} ev={ev} onDelete={() => deleteEvent(ev.id)} />
                      ))
                    )}
                  </div>

                  <div style={{ fontSize: 11, color: C.dim, marginTop: 12, textAlign: "center" as const }}>
                    Projection is illustrative. Income, spending, and taxes are not fully modeled.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
