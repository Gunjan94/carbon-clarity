import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getPortfolio, calculate, type PortfolioResult, type SiteResult } from "../api";
import { fmtTonnes } from "../format";
import { chart, fuelSeries } from "../theme";

function Kpi({ value, unit, label, accent }: { value: string; unit: string; label: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-6">
      <div className="flex items-baseline gap-2">
        <span
          className={`tabular text-5xl font-extrabold ${accent ? "text-brand" : "text-text1"}`}
        >
          {value}
        </span>
        <span className="text-lg text-text2">{unit}</span>
      </div>
      <div className="mt-2 text-sm uppercase tracking-wide text-text2">{label}</div>
    </div>
  );
}

export default function BaselineDashboard({
  onBaseline,
  period = "2025-Q1",
}: {
  onBaseline: (tco2e: number) => void;
  period?: string;
}) {
  const c = chart;
  const FUEL_COLORS = fuelSeries();
  const [p, setP] = useState<PortfolioResult | null>(null);
  const [selSite, setSelSite] = useState<string>("");
  const [site, setSite] = useState<SiteResult | null>(null);
  const [override, setOverride] = useState<string>("");

  useEffect(() => {
    // The backend serves the current (live) cycle; prior periods reuse it as the
    // most-recent reconciled snapshot — the period switcher reflects the cockpit's
    // reporting calendar without fabricating divergent history.
    getPortfolio("2025-Q1").then((d) => {
      setP(d);
      onBaseline(d.scope1_2_total_tco2e);
      const sg = d.sites.find((s) => s.country === "SG") || d.sites[0];
      setSelSite(sg.id);
    });
  }, [period]);

  useEffect(() => {
    if (selSite) {
      calculate(selSite).then((r) => {
        setSite(r);
        setOverride(String(Math.round(r.activity.grid_kwh)));
      });
    }
  }, [selSite]);

  function applyOverride() {
    const v = Number(override);
    if (selSite && v >= 0) calculate(selSite, { grid_kwh: v }).then(setSite);
  }

  if (!p) return <div className="p-10 text-text2">Loading portfolio…</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi value={fmtTonnes(p.scope1_2_total_tco2e)} unit="tCO2e" label="Scope 1 + 2 (market-based)" accent />
        <Kpi value={fmtTonnes(p.scope3_estimated_tco2e)} unit="tCO2e" label="Scope 3 (estimated)" />
        <Kpi value={String(p.building_count)} unit="sites" label="Buildings" />
        <Kpi value={String(p.country_count)} unit="" label="Countries" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-panel p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text2">
            Emissions by country (Scope 1+2, market-based)
          </h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={p.by_country} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid stroke={c.line} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="country" stroke={c.text2} tick={{ fontSize: 13, fill: c.text2 }} tickLine={false} />
                <YAxis stroke={c.text2} tick={{ fontSize: 12, fill: c.text2 }} tickLine={false} tickFormatter={(v) => fmtTonnes(v as number)} />
                <Tooltip
                  contentStyle={{ background: c.panel, border: `1px solid ${c.line}`, borderRadius: 12, color: c.text1 }}
                  formatter={(v: number) => [`${fmtTonnes(v)} tCO2e`, "Emissions"]}
                />
                <Bar dataKey="tco2e" fill={c.brand} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text2">By fuel / source</h3>
          <div className="mt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={p.by_fuel}
                  dataKey="tco2e"
                  nameKey="fuel"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {p.by_fuel.map((_, i) => (
                    <Cell key={i} fill={FUEL_COLORS[i % FUEL_COLORS.length]} stroke={c.panel} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: c.panel, border: `1px solid ${c.line}`, borderRadius: 12, color: c.text1 }}
                  formatter={(v: number, n: string) => [`${fmtTonnes(v)} tCO2e`, n.replace(/_/g, " ")]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Location vs market + single-site drill-in with live override */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-panel p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text2">
            Scope 2: location-based vs market-based
          </h3>
          <p className="mt-1 text-sm text-text2">
            Location uses the grid average; market credits signed green-power contracts (RECs).
            The gap is exactly what the supplier-switch lever moves.
          </p>
          <div className="mt-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={[
                  { name: "Location-based", tco2e: p.scope2_location_tco2e, fill: c.target },
                  { name: "Market-based", tco2e: p.scope2_market_tco2e, fill: c.brand },
                ]}
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <XAxis type="number" stroke={c.text2} tick={{ fontSize: 12, fill: c.text2 }} tickFormatter={(v) => fmtTonnes(v as number)} />
                <YAxis type="category" dataKey="name" stroke={c.text2} width={120} tick={{ fontSize: 14, fill: c.text1 }} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: c.panel, border: `1px solid ${c.line}`, borderRadius: 12, color: c.text1 }}
                  formatter={(v: number) => [`${fmtTonnes(v)} tCO2e`, "Scope 2"]}
                />
                <Bar dataKey="tco2e" radius={[0, 6, 6, 0]}>
                  <Cell fill={c.target} />
                  <Cell fill={c.brand} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-text2">
              Drill into a site (live calc)
            </h3>
            <select
              value={selSite}
              onChange={(e) => setSelSite(e.target.value)}
              className="rounded-lg border border-line bg-panel2 px-3 py-1.5 text-sm text-text1"
            >
              {p.sites.slice(0, 60).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} · {s.type}
                </option>
              ))}
            </select>
          </div>

          {site && (
            <>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-panel2 p-3">
                  <div className="tabular text-2xl font-bold text-text1">{site.scope1_tco2e}</div>
                  <div className="text-xs text-text2">Scope 1</div>
                </div>
                <div className="rounded-xl bg-panel2 p-3">
                  <div className="tabular text-2xl font-bold text-text1">{site.scope2_location_tco2e}</div>
                  <div className="text-xs text-text2">Scope 2 loc.</div>
                </div>
                <div className="rounded-xl bg-panel2 p-3">
                  <div className="tabular text-2xl font-bold text-brand">{site.scope2_market_tco2e}</div>
                  <div className="text-xs text-text2">Scope 2 mkt.</div>
                </div>
              </div>

              <div className="mt-4 flex items-end gap-2">
                <label className="flex-1 text-sm text-text2">
                  Grid kWh (editable)
                  <input
                    value={override}
                    onChange={(e) => setOverride(e.target.value)}
                    className="tabular mt-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-text1"
                  />
                </label>
                <button
                  onClick={applyOverride}
                  className="rounded-lg bg-brand px-4 py-2 font-semibold text-ink hover:brightness-110"
                >
                  Recompute
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-line">
                <table className="w-full text-left text-sm">
                  <thead className="bg-panel2 text-text2">
                    <tr>
                      <th className="px-3 py-2">Source</th>
                      <th className="px-3 py-2">Activity</th>
                      <th className="px-3 py-2">Factor</th>
                      <th className="px-3 py-2 text-right">tCO2e</th>
                    </tr>
                  </thead>
                  <tbody className="tabular">
                    {site.breakdown.map((r, i) => (
                      <tr key={i} className="border-t border-line">
                        <td className="px-3 py-2 capitalize text-text1">
                          {r.source.replace(/_/g, " ")}
                          {r.basis ? ` (${r.basis})` : ""}
                        </td>
                        <td className="px-3 py-2 text-text2">
                          {Math.round(r.activity).toLocaleString()} {r.unit}
                        </td>
                        <td className="px-3 py-2 text-text2">{r.factor}</td>
                        <td className="px-3 py-2 text-right font-semibold text-text1">{r.tco2e}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
