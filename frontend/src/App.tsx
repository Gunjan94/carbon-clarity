import { useState } from "react";
import BaselineDashboard from "./views/BaselineDashboard";
import FootprintMap from "./views/FootprintMap";
import ScenarioPlanner from "./views/ScenarioPlanner";
import ComplianceReport from "./views/ComplianceReport";
import { ENTITY, PERIODS } from "./domain";
import { getMode, toggleMode, type Mode } from "./theme";

type View = "baseline" | "footprint" | "scenario" | "compliance";

const TABS: { id: View; label: string }[] = [
  { id: "baseline", label: "Baseline Dashboard" },
  { id: "footprint", label: "Footprint Map" },
  { id: "scenario", label: "Scenario Planner" },
  { id: "compliance", label: "Compliance & Reporting" },
];

export default function App() {
  const [view, setView] = useState<View>("baseline");
  const [baseline, setBaseline] = useState<number>(12000);
  const [period, setPeriod] = useState<string>(PERIODS[0].id);
  const [mode, setMode] = useState<Mode>(getMode());

  return (
    <div className="min-h-screen text-text1">
      <header
        className="sticky top-0 z-10 border-b border-line backdrop-blur"
        style={{ background: "var(--header-bg)" }}
      >
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-xl font-extrabold text-ink">
              C
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight sm:text-xl">
                {ENTITY.name} <span className="font-medium text-text2">· CarbonClarity</span>
              </div>
              <div className="text-xs text-text2">Enterprise sustainability intelligence · {ENTITY.hq}</div>
            </div>
          </div>

          <nav className="no-scrollbar order-3 flex max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-panel p-1 lg:order-none">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                  view === t.id ? "bg-brand text-ink" : "text-text2 hover:text-text1"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Reporting period switcher */}
            <label className="flex items-center gap-2 text-xs text-text2">
              Period
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="rounded-lg border border-line bg-panel px-2.5 py-1.5 text-sm font-semibold text-text1"
              >
                {PERIODS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                    {p.live ? " · live" : ""}
                  </option>
                ))}
              </select>
            </label>

            {/* Theme toggle */}
            <button
              onClick={() => setMode(toggleMode())}
              aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} theme`}
              title={`Switch to ${mode === "dark" ? "light" : "dark"} theme`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-text2 transition hover:text-text1"
            >
              {mode === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>

            <div className="hidden text-right text-sm sm:block">
              <div className="font-semibold text-text1">{ENTITY.revenue} manufacturer · {ENTITY.listing}</div>
              <div className="text-text2">
                {ENTITY.sites} buildings · {ENTITY.countries} countries · {ENTITY.targetPct}% by {ENTITY.targetYear}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-6">
        {view === "baseline" && <BaselineDashboard onBaseline={setBaseline} period={period} />}
        {view === "footprint" && <FootprintMap />}
        {view === "scenario" && <ScenarioPlanner baseline={baseline} />}
        {view === "compliance" && <ComplianceReport period={period} />}
      </main>

      <footer className="mx-auto max-w-[1500px] px-6 py-6 text-xs text-text2">
        Prototype for an AWS APJ Innovation Hub challenge. Synthetic/sample data only — no real customer
        data, no secrets. Emission factors illustrative; calculation methodology real. Figures in SGD.
      </footer>
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
