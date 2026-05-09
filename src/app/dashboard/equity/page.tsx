"use client";

import { useEffect, useState, useCallback } from "react";
import type { EquityData, PsuSliders } from "@/types/equity";
import SummaryTab from "@/components/equity/SummaryTab";
import VestDetailTab from "@/components/equity/VestDetailTab";
import OptionsTab from "@/components/equity/OptionsTab";
import SensitivityTab from "@/components/equity/SensitivityTab";
import ExerciseTimingTab from "@/components/equity/ExerciseTimingTab";
import TaxStackingTab from "@/components/equity/TaxStackingTab";
import EquityScenariosTab from "@/components/equity/EquityScenariosTab";
import ConcentrationTab from "@/components/equity/ConcentrationTab";

const C = {
  bg: "#0b0f1c",
  panel: "#111827",
  border: "#1e2d4a",
  accent: "#c94a00",
  green: "#3db87a",
  gold: "#e8b84b",
  text: "#e8dfc8",
  muted: "#7a8fa8",
  dim: "#3a4a60",
  dark: "#0d1525",
};

const TABS = [
  { id: "summary",       label: "Summary" },
  { id: "detail",        label: "Vest Detail" },
  { id: "options",       label: "Options" },
  { id: "sensitivity",   label: "Sensitivity" },
  { id: "exercise",      label: "Exercise Timing" },
  { id: "taxstack",      label: "Tax Stacking" },
  { id: "scenarios",     label: "Scenarios" },
  { id: "concentration", label: "Concentration" },
];

function NumInput({ prefix, value, onChange, step, min, max }: {
  prefix: string;
  value: string | number;
  onChange: (v: string) => void;
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", background: C.dark, border: "1px solid " + C.border, borderRadius: 6, overflow: "hidden" }}>
      <span style={{ padding: "0 10px", color: C.green, fontSize: 13 }}>{prefix}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step || "1"}
        min={min || "0"}
        max={max}
        style={{ background: "transparent", border: "none", color: C.text, fontSize: 14, fontFamily: "Georgia, serif", padding: "8px 8px 8px 0", width: "100%", outline: "none" }}
      />
    </div>
  );
}

export default function EquityPage() {
  const [data, setData] = useState<EquityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("summary");

  const [priceRaw, setPriceRaw] = useState("87.37");
  const [price, setPrice] = useState(87.37);
  const [priceStatus, setPriceStatus] = useState<"idle" | "loading" | "live" | "error">("loading");
  const [priceAsOf, setPriceAsOf] = useState<string | null>(null);

  const [fedRate, setFedRate] = useState("37");
  const [stateRate, setStateRate] = useState("5");
  const [mediRate, setMediRate] = useState("2.35");

  const [psuSliders, setPsuSliders] = useState<PsuSliders>({});
  const [asOfYear, setAsOfYear] = useState(2025);
  const [bilhYear, setBilhYear] = useState<string | null>(null);
  const [totalWealth, setTotalWealth] = useState("5000000");

  const taxRate = (Number(fedRate) + Number(stateRate) + Number(mediRate)) / 100;

  useEffect(() => {
    fetch("/api/equity")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setData(d);
        const fallback = d.employer?.price_fallback ?? 87.37;
        setPrice(fallback);
        setPriceRaw(fallback.toFixed(2));
        const initialSliders: PsuSliders = {};
        for (const g of d.grants ?? []) {
          if (g.grant_type === "PSU") initialSliders[g.grant_id] = g.psu_achievement_pct;
        }
        setPsuSliders(initialSliders);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load equity data."); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!data?.employer?.ticker_symbol) return;
    fetch(`/api/equity/price?ticker=${data.employer.ticker_symbol}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.source === "live") {
          setPrice(d.price);
          setPriceRaw(d.price.toFixed(2));
          setPriceAsOf(d.asOf || null);
          setPriceStatus("live");
        } else {
          setPriceStatus("error");
        }
      })
      .catch(() => setPriceStatus("error"));
  }, [data]);

  const handlePriceInput = useCallback((v: string) => {
    setPriceRaw(v);
    const n = parseFloat(v);
    if (!isNaN(n) && n > 0) {
      setPrice(n);
      setPriceStatus("idle");
    }
  }, []);

  const handleSliderChange = useCallback((grantId: string, val: number) => {
    setPsuSliders((prev) => ({ ...prev, [grantId]: val }));
  }, []);

  const grants = data?.grants ?? [];
  const psuGrants = grants.filter((g) => g.grant_type === "PSU");

  return (
    <div style={{ fontFamily: "Georgia, serif", background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{`
        @keyframes cvsLoadPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
      `}</style>

      <div style={{ background: "linear-gradient(135deg, #0b0f1c 0%, #132040 100%)", borderBottom: "1px solid " + C.accent, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: C.accent, textTransform: "uppercase", marginBottom: 4 }}>
              CVS Health - Equity Compensation
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: C.text }}>Equity Planning Dashboard</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>RSUs - Performance Shares - Stock Options</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase" }}>CVS Share Price</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              {priceStatus === "loading" && (
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold, animation: "cvsLoadPulse 1s ease-in-out infinite" }} />
              )}
              {priceStatus === "live" && (
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
              )}
              {(priceStatus === "error" || priceStatus === "idle") && (
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: priceStatus === "error" ? C.accent : C.dim }} />
              )}
              <div style={{ fontSize: 30, fontWeight: 700, color: priceStatus === "live" ? C.green : C.text }}>
                ${price.toFixed(2)}
              </div>
            </div>
            {priceStatus === "live" && <div style={{ fontSize: 10, color: C.green }}>Live - as of {priceAsOf}</div>}
            {priceStatus === "loading" && <div style={{ fontSize: 10, color: C.gold }}>Fetching live price...</div>}
            {priceStatus === "error" && <div style={{ fontSize: 10, color: C.accent }}>Manual - live fetch failed</div>}
          </div>
        </div>
      </div>

      {!loading && !error && (
        <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 4 }}>
          <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.accent, marginBottom: 16 }}>Price and Tax</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>CVS Price ($)</div>
                <NumInput prefix="$" value={priceRaw} onChange={handlePriceInput} step="0.01" min="1" />
              </div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>Federal Rate (%)</div>
                <NumInput prefix="%" value={fedRate} onChange={setFedRate} step="0.5" min="0" max="50" />
              </div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>MA State Rate (%)</div>
                <NumInput prefix="%" value={stateRate} onChange={setStateRate} step="0.1" min="0" max="15" />
              </div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>Medicare Rate (%)</div>
                <NumInput prefix="%" value={mediRate} onChange={setMediRate} step="0.05" min="0" max="5" />
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: C.dim }}>Combined rate: {(taxRate * 100).toFixed(1)}%</div>
          </div>

          <div style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.accent, marginBottom: 16 }}>PSU Achievement by Grant</div>
            {psuGrants.map((g) => {
              const pct = psuSliders[g.grant_id] ?? g.psu_achievement_pct;
              const col = pct > 100 ? C.gold : pct === 100 ? C.green : pct > 0 ? "#5b9bd5" : C.accent;
              return (
                <div key={g.grant_id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>{g.grant_id}</span>
                    <span style={{ fontSize: 12, color: col, fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={pct}
                    onChange={(e) => handleSliderChange(g.grant_id, Number(e.target.value))}
                    style={{ width: "100%", accentColor: col, cursor: "pointer" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.dim }}>
                    <span>0%</span><span>50%</span><span>100%</span><span>150%</span><span>200%</span>
                  </div>
                </div>
              );
            })}
            {psuGrants.length === 0 && (
              <div style={{ fontSize: 12, color: C.dim }}>No PSU grants</div>
            )}
          </div>
        </div>
      )}

      <div style={{ overflowX: "auto", borderBottom: "1px solid " + C.border, padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 0, minWidth: "max-content" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: activeTab === t.id ? "2px solid " + C.accent : "2px solid transparent",
                color: activeTab === t.id ? C.text : C.muted,
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: 12,
                letterSpacing: "0.08em",
                fontFamily: "Georgia, serif",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: C.muted, fontSize: "0.875rem" }}>
          Loading equity data...
        </div>
      )}
      {error && (
        <div style={{ padding: 20, color: C.accent, fontSize: "0.875rem" }}>{error}</div>
      )}

      {!loading && !error && (
        <div style={{ padding: "0 24px 24px" }}>
          {activeTab === "summary"       && <SummaryTab grants={grants} price={price} taxRate={taxRate} psuSliders={psuSliders} />}
          {activeTab === "detail"        && <VestDetailTab grants={grants} price={price} taxRate={taxRate} psuSliders={psuSliders} />}
          {activeTab === "options"       && <OptionsTab grants={grants} price={price} taxRate={taxRate} />}
          {activeTab === "sensitivity"   && <SensitivityTab grants={grants} price={price} taxRate={taxRate} asOfYear={asOfYear} setAsOfYear={setAsOfYear} />}
          {activeTab === "exercise"      && <ExerciseTimingTab grants={grants} price={price} taxRate={taxRate} />}
          {activeTab === "taxstack"      && <TaxStackingTab grants={grants} price={price} taxRate={taxRate} psuSliders={psuSliders} bilhYear={bilhYear} setBilhYear={setBilhYear} />}
          {activeTab === "scenarios"     && <EquityScenariosTab grants={grants} taxRate={taxRate} psuSliders={psuSliders} />}
          {activeTab === "concentration" && <ConcentrationTab grants={grants} price={price} taxRate={taxRate} psuSliders={psuSliders} totalWealth={totalWealth} setTotalWealth={setTotalWealth} />}
        </div>
      )}
    </div>
  );
}
