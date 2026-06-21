import { useEffect, useRef, useState } from "react";
import { runScenario, type Levers, type ScenarioResult } from "../api";
import { fmtTonnes, fmtPct } from "../format";
import TrajectoryChart from "../components/TrajectoryChart";
import BudgetMeter from "../components/BudgetMeter";
import LeverSlider from "../components/LeverSlider";
import BoardSummaryPanel from "../components/BoardSummaryPanel";
import { chart } from "../theme";

const HERO: Levers = { solar_pct: 0.6, fleet_ev_pct: 0.5, supplier_switch_pct: 0.4 };
const ZERO: Levers = { solar_pct: 0, fleet_ev_pct: 0, supplier_switch_pct: 0 };

const LEVER_META: { key: keyof Levers; label: string; note: string }[] = [
  { key: "solar_pct", label: "Rooftop Solar PV", note: "On-site generation offsets purchased grid electricity (Scope 2)." },
  { key: "fleet_ev_pct", label: "Fleet Electrification", note: "Electrifies fleet vehicles, removing Scope 1 mobile combustion." },
  { key: "supplier_switch_pct", label: "Green Power Switch", note: "Raises REC coverage — biggest, cheapest Scope 2 market-based mover." },
];

export default function ScenarioPlanner({ baseline }: { baseline: number }) {
  const [levers, setLevers] = useState<Levers>(ZERO);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const debRef = useRef<number | null>(null);

  // debounced recompute on lever change
  useEffect(() => {
    if (debRef.current) window.clearTimeout(debRef.current);
    debRef.current = window.setTimeout(() => {
      runScenario(baseline, levers).then(setResult);
    }, 130);
    return () => {
      if (debRef.current) window.clearTimeout(debRef.current);
    };
  }, [levers, baseline]);

  // initial load
  useEffect(() => {
    runScenario(baseline, levers).then(setResult);
  }, [baseline]);

  const detailFor = (key: string) =>
    result?.lever_detail.find((l) => l.lever === key);

  return (
    <div className="space-y-5">
      {/* status banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-panel p-5">
        <div>
          <h2 className="text-2xl font-extrabold text-text1">Decarbonization Scenario Planner</h2>
          <p className="text-sm text-text2">
            Baseline {fmtTonnes(baseline)} tCO2e · target 40% reduction by 2030 · S$13.5M / 3 yrs
          </p>
        </div>
        {result && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="tabular text-3xl font-extrabold text-text1">
                {fmtPct(result.final_reduction_pct)}
              </div>
              <div className="text-xs uppercase tracking-wide text-text2">reduction by 2030</div>
            </div>
            <span
              className="rounded-full px-4 py-2 text-base font-bold"
              style={{
                background: (result.hits_target ? chart.brand : chart.danger) + "26",
                color: result.hits_target ? chart.brand : chart.danger,
              }}
            >
              {result.hits_target ? "Hits 40% by 2030 ✓" : "Misses target ✗"}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* levers */}
        <div className="space-y-4 lg:col-span-4">
          <div className="flex gap-2">
            <button
              onClick={() => setLevers(HERO)}
              className="flex-1 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-ink hover:brightness-110"
            >
              Load hero combo
            </button>
            <button
              onClick={() => setLevers(ZERO)}
              className="rounded-xl border border-line bg-panel px-3 py-2.5 text-sm font-semibold text-text2 hover:text-text1"
            >
              Reset
            </button>
          </div>
          {LEVER_META.map((m) => {
            const d = detailFor(m.key);
            return (
              <LeverSlider
                key={m.key}
                label={m.label}
                note={m.note}
                value={levers[m.key]}
                abatement={d?.annual_abatement_tco2e}
                cost={d?.cost_usd}
                onChange={(v) => setLevers((prev) => ({ ...prev, [m.key]: v }))}
              />
            );
          })}
        </div>

        {/* trajectory chart (hero) */}
        <div className="rounded-2xl border border-line bg-panel p-5 lg:col-span-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-text2">
              Emissions trajectory to 2030
            </h3>
            {result && (
              <span className="tabular text-sm text-text2">
                {fmtTonnes(result.final_tco2e)} tCO2e in 2030 · target {fmtTonnes(result.target_endpoint_tco2e)}
              </span>
            )}
          </div>
          <div className="mt-2 h-[360px]">{result && <TrajectoryChart s={result} />}</div>
        </div>

        {/* budget + summary */}
        <div className="space-y-5 lg:col-span-3">
          {result && (
            <BudgetMeter
              budget={result.budget_usd}
              committed={result.budget_committed_usd}
              remaining={result.budget_remaining_usd}
              over={result.over_budget}
            />
          )}
          {result && <BoardSummaryPanel scenario={result} />}
        </div>
      </div>
    </div>
  );
}
