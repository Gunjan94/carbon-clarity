import { useEffect, useRef, useState } from "react";
import { runScenario, getAbatementOptions, type Levers, type ScenarioResult, type AbatementOptionsResult } from "../api";
import { fmtTonnes, fmtPct } from "../format";
import { sgdM } from "../domain";
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
  const [macc, setMacc] = useState<AbatementOptionsResult | null>(null);
  const [showCalc, setShowCalc] = useState(false);
  const debRef = useRef<number | null>(null);

  useEffect(() => {
    getAbatementOptions(baseline).then(setMacc);
  }, [baseline]);

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

      <div className="text-[11px] uppercase tracking-wide text-text2">For the sustainability lead · the path to 2030</div>
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

      {/* ───── Cost & ROI — the CFO & board money view ───── */}
      {result && macc && (
        <div className="space-y-4">
          <div className="text-[11px] uppercase tracking-wide text-text2">For the CFO &amp; board · the money</div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Carbon-tax exposure */}
            <div className="rounded-2xl border border-line bg-panel p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text2">Carbon-tax exposure</h3>
              <p className="mt-1 text-xs text-text2">
                At a 2030 carbon price of about US${result.carbon.price_2030_usd}/tonne.
              </p>
              <div className="mt-3 space-y-1.5 text-sm">
                <Row label="If you do nothing" value={`${sgdM(result.carbon.annual_exposure_no_action_usd)}/yr`} />
                <Row label="After this plan" value={`${sgdM(result.carbon.annual_exposure_after_usd)}/yr`} />
              </div>
              <div className="mt-3 border-t border-line pt-3">
                <div className="text-xs text-text2">Carbon cost avoided</div>
                <div className="tabular text-3xl font-extrabold" style={{ color: chart.brand }}>
                  {sgdM(result.carbon.annual_avoided_usd)}
                  <span className="text-base font-semibold text-text2">/yr</span>
                </div>
                <div className="text-xs text-text2">
                  ≈ {sgdM(result.carbon.cumulative_avoided_usd)} cumulative to 2030
                </div>
              </div>
            </div>

            {/* MACC — cheapest tonnes first */}
            <div className="rounded-2xl border border-line bg-panel p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text2">Cheapest tonnes first</h3>
              <p className="mt-1 text-xs text-text2">
                What it costs to remove one tonne of CO2e — lowest-cost levers to buy in order.
              </p>
              <div className="mt-3 space-y-2.5">
                {macc.options.map((o) => {
                  const maxCost = macc.options[macc.options.length - 1].cost_per_tonne_usd || 1;
                  const w = Math.max(8, (o.cost_per_tonne_usd / maxCost) * 100);
                  return (
                    <div key={o.lever}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-medium text-text1">{o.label}</span>
                        <span className="tabular text-text1">US${o.cost_per_tonne_usd.toLocaleString()}/t</span>
                      </div>
                      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-panel2">
                        <div className="h-full rounded-full" style={{ width: `${w}%`, background: chart.brand }} />
                      </div>
                      <div className="mt-0.5 text-[11px] text-text2">
                        removes {fmtTonnes(o.abatement_tco2e)} t · gets you to {fmtPct(o.cumulative_reduction_pct, 0)} cumulative
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Transparency drill-down */}
          <div className="rounded-2xl border border-line bg-panel p-5">
            <button
              onClick={() => setShowCalc((v) => !v)}
              className="text-sm font-semibold underline"
              style={{ color: chart.brand }}
            >
              {showCalc ? "Hide" : "Show"} how this plan reaches {fmtPct(result.final_reduction_pct, 0)}
            </button>
            {showCalc && (
              <div className="mt-3 space-y-1.5 text-sm">
                <p className="text-xs text-text2">
                  Each active lever removes a slice of the {fmtTonnes(result.baseline_tco2e)} tCO2e baseline at a
                  capital cost; added up:
                </p>
                {result.lever_detail.filter((l) => l.value > 0).length === 0 ? (
                  <p className="text-text2">No levers active yet — drag a lever or load the hero combo.</p>
                ) : (
                  <>
                    {result.lever_detail
                      .filter((l) => l.value > 0)
                      .map((l) => (
                        <div key={l.lever} className="flex justify-between">
                          <span className="text-text1">
                            {l.label} <span className="text-text2">({Math.round(l.value * 100)}%)</span>
                          </span>
                          <span className="tabular text-text2">
                            −{fmtTonnes(l.annual_abatement_tco2e)} t · {sgdM(l.cost_usd)}
                          </span>
                        </div>
                      ))}
                    <div className="flex justify-between border-t border-line pt-2 font-semibold">
                      <span className="text-text1">Total</span>
                      <span className="tabular" style={{ color: chart.brand }}>
                        −{fmtTonnes(result.total_annual_abatement_tco2e)} t · {sgdM(result.budget_committed_usd)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-text2">{label}</span>
      <span className="tabular font-semibold text-text1">{value}</span>
    </div>
  );
}
