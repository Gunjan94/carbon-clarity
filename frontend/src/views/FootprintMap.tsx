import { useEffect, useMemo, useState } from "react";
import { getSites, calculate, type SiteRow, type SitesResult, type SiteResult } from "../api";
import SiteMap, { SiteMapLegend } from "../components/SiteMap";
import { fmtTonnes } from "../format";
import { chart } from "../theme";

// Footprint Map — where Meridian's emissions actually are, across 200 buildings
// in 15 countries. The operational/shared view: see the portfolio geographically,
// find the biggest emitters, and drill into any one site's real breakdown.
export default function FootprintMap() {
  const [data, setData] = useState<SitesResult | null>(null);
  const [selected, setSelected] = useState<SiteRow | null>(null);
  const [detail, setDetail] = useState<SiteResult | null>(null);
  const [countryFilter, setCountryFilter] = useState<string>("ALL");

  useEffect(() => {
    getSites().then(setData);
  }, []);

  useEffect(() => {
    if (!selected) {
      setDetail(null);
      return;
    }
    let alive = true;
    setDetail(null);
    calculate(selected.id).then((d) => {
      if (alive) setDetail(d);
    });
    return () => {
      alive = false;
    };
  }, [selected]);

  const countries = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, string>();
    data.sites.forEach((s) => map.set(s.country, s.country_name));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [data]);

  const list = useMemo(() => {
    if (!data) return [];
    return countryFilter === "ALL"
      ? data.sites
      : data.sites.filter((s) => s.country === countryFilter);
  }, [data, countryFilter]);

  const concentration = useMemo(() => {
    if (!data) return null;
    const total = data.sites.reduce((s, x) => s + x.scope1_2_tco2e, 0);
    const top10 = data.sites.slice(0, 10).reduce((s, x) => s + x.scope1_2_tco2e, 0);
    return { total, top10pct: total ? (100 * top10) / total : 0 };
  }, [data]);

  if (!data || !concentration) {
    return <div className="py-16 text-center text-text2">Loading sites…</div>;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-panel p-5">
        <h2 className="text-2xl font-extrabold text-text1">Footprint map</h2>
        <p className="text-sm text-text2">
          Where your emissions are — {data.count} buildings across {countries.length} countries. Click a
          building to see exactly what it emits and why.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi label="Buildings" value={data.count.toLocaleString()} sub="across the portfolio" />
        <Kpi label="Countries" value={`${countries.length}`} sub="reporting regions" />
        <Kpi
          label="Biggest single site"
          value={`${fmtTonnes(data.max_site_tco2e)}`}
          sub={`tCO2e · ${data.sites[0].country_name}`}
          color={chart.danger}
        />
        <Kpi
          label="Top 10 sites"
          value={`${concentration.top10pct.toFixed(0)}%`}
          sub="of total Scope 1+2 — focus here first"
          color={chart.warn}
        />
      </div>

      {/* Map + selected site */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5 lg:col-span-2">
          <SiteMap
            sites={data.sites}
            center={data.center}
            zoom={data.zoom}
            maxSite={data.max_site_tco2e}
            onSelect={setSelected}
            selectedId={selected?.id}
          />
          <div className="mt-3">
            <SiteMapLegend />
          </div>
        </div>

        <div>
          <div className="mb-2 text-[11px] uppercase tracking-wide text-text2">Selected building</div>
          {selected ? (
            <SiteDetail site={selected} detail={detail} />
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-line bg-panel p-5 text-center text-sm text-text2">
              Click a building on the map (or in the list below) to see its full emissions breakdown.
            </div>
          )}
        </div>
      </div>

      {/* Ranked site list */}
      <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-text1">Buildings, highest emitters first</h3>
          <label className="flex items-center gap-2 text-xs text-text2">
            Country
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="rounded-lg border border-line bg-panel px-2.5 py-1.5 text-sm font-semibold text-text1"
            >
              <option value="ALL">All ({data.count})</option>
              {countries.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex max-h-96 flex-col gap-2 overflow-auto pr-1">
          {list.map((s) => {
            const isSel = selected?.id === s.id;
            const f = data.max_site_tco2e ? s.scope1_2_tco2e / data.max_site_tco2e : 0;
            const color = f >= 0.6 ? chart.danger : f >= 0.3 ? chart.warn : chart.brand;
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="flex w-full items-center gap-3 rounded-xl border border-line bg-panel2 p-3 text-left transition"
                style={isSel ? { borderColor: chart.brand, background: chart.brand + "14" } : undefined}
              >
                <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-text1">{s.id}</div>
                  <div className="truncate text-xs capitalize text-text2">
                    {s.type} · {s.country_name}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="tabular text-sm font-semibold text-text1">{fmtTonnes(s.scope1_2_tco2e)}</div>
                  <div className="text-[11px] text-text2">tCO2e</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
      <div className="text-[11px] uppercase tracking-wide text-text2">{label}</div>
      <div className="tabular mt-1" style={{ fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 800, lineHeight: 1, color }}>
        {value}
      </div>
      <div className="mt-1 text-[11px] text-text2">{sub}</div>
    </div>
  );
}

function SiteDetail({ site, detail }: { site: SiteRow; detail: SiteResult | null }) {
  // Plain-language "biggest opportunity" hint from the site's own profile.
  const recPct = Math.round((site.rec_coverage_fraction || 0) * 100);
  const hint =
    site.scope2_market_tco2e > site.scope1_tco2e
      ? recPct < 80
        ? "Most of this site's emissions come from purchased electricity — green-power contracts (RECs) and rooftop solar would cut it most."
        : "Mostly grid electricity, already well covered by green power — rooftop solar is the next lever."
      : "A large share is on-site fuel burning — fleet electrification and process-heat upgrades matter most here.";

  return (
    <div className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-baseline justify-between">
        <div className="font-semibold text-lg text-text1">{site.id}</div>
        <div className="tabular text-2xl font-extrabold text-text1">{fmtTonnes(site.scope1_2_tco2e)}</div>
      </div>
      <div className="text-sm capitalize text-text2">
        {site.type} · {site.country_name} · {fmtTonnes(site.scope1_2_tco2e)} tCO2e Scope 1+2
      </div>

      <div className="mt-4 space-y-1.5 text-sm">
        <Row label="On-site fuel (Scope 1)" value={`${fmtTonnes(site.scope1_tco2e)} t`} />
        <Row label="Purchased electricity (Scope 2)" value={`${fmtTonnes(site.scope2_market_tco2e)} t`} />
        <Row label="Supply chain (Scope 3, est.)" value={`${fmtTonnes(site.scope3_tco2e)} t`} muted />
        <Row label="Grid carbon intensity" value={`${site.grid_factor.toFixed(3)} kg/kWh`} muted />
        <Row label="Green-power coverage" value={`${recPct}%`} muted />
      </div>

      {detail && detail.breakdown.length > 0 && (
        <div className="mt-4">
          <div className="mb-1 text-[11px] uppercase tracking-wide text-text2">Emission sources (computed)</div>
          <div className="space-y-1">
            {detail.breakdown
              .filter((b) => !(b.scope === 2 && b.basis === "location"))
              .map((b, i) => (
                <div key={i} className="flex justify-between text-xs text-text2">
                  <span className="capitalize">
                    {b.source.replace(/_/g, " ")} <span className="opacity-60">· Scope {b.scope}</span>
                  </span>
                  <span className="tabular">{fmtTonnes(b.tco2e)} t</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div
        className="mt-4 rounded-xl p-3 text-sm"
        style={{ background: chart.brand + "12", border: `1px solid ${chart.brand}33` }}
      >
        <div className="mb-0.5 font-semibold" style={{ color: chart.brand }}>
          Biggest opportunity here
        </div>
        <div className="text-text1 opacity-90">{hint}</div>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={muted ? "text-text2" : "text-text1"}>{label}</span>
      <span className="tabular font-semibold text-text1">{value}</span>
    </div>
  );
}
