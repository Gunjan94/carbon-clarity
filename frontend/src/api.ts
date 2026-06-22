// Typed fetch wrappers for the four backend endpoints.
// In dev, Vite proxies /api -> backend (see vite.config.ts). Override with
// VITE_API_BASE for a deployed API Gateway URL.

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || "/api";

export interface BreakdownRow {
  source: string;
  activity: number;
  unit: string;
  factor: number;
  tco2e: number;
  scope: number;
  basis?: string;
  rec_coverage_fraction?: number;
  note?: string;
}

export interface SiteResult {
  site_id: string;
  country: string;
  period: string;
  scope1_tco2e: number;
  scope2_location_tco2e: number;
  scope2_market_tco2e: number;
  scope3_estimated_tco2e: number;
  scope1_2_market_total_tco2e: number;
  scope1_2_location_total_tco2e: number;
  breakdown: BreakdownRow[];
  activity: Record<string, number>;
}

export interface PortfolioResult {
  period: string;
  building_count: number;
  country_count: number;
  scope1_tco2e: number;
  scope2_location_tco2e: number;
  scope2_market_tco2e: number;
  scope1_2_total_tco2e: number;
  scope3_estimated_tco2e: number;
  by_country: { country: string; name: string; tco2e: number }[];
  by_fuel: { fuel: string; tco2e: number }[];
  sites: { id: string; country: string; type: string; rec_coverage_fraction: number }[];
}

export interface LeverDetail {
  lever: string;
  label: string;
  value: number;
  annual_abatement_tco2e: number;
  cost_usd: number;
  note: string;
}

export interface ScenarioResult {
  baseline_tco2e: number;
  target_pct: number;
  target_year: number;
  start_year: number;
  trajectory: { year: number; tco2e: number }[];
  target_line: { year: number; tco2e: number }[];
  target_endpoint_tco2e: number;
  final_tco2e: number;
  final_reduction_pct: number;
  total_annual_abatement_tco2e: number;
  hits_target: boolean;
  budget_usd: number;
  budget_committed_usd: number;
  budget_remaining_usd: number;
  over_budget: boolean;
  lever_detail: LeverDetail[];
  carbon: CarbonExposure;
}

export interface CarbonExposure {
  price_2030_usd: number;
  annual_exposure_no_action_usd: number;
  annual_exposure_after_usd: number;
  annual_avoided_usd: number;
  cumulative_avoided_usd: number;
}

export interface SiteRow {
  id: string;
  country: string;
  country_name: string;
  type: string;
  lat: number;
  lng: number;
  scope1_tco2e: number;
  scope2_market_tco2e: number;
  scope1_2_tco2e: number;
  scope3_tco2e: number;
  grid_factor: number;
  rec_coverage_fraction: number;
  eligible_solar_kwh: number;
}

export interface SitesResult {
  sites: SiteRow[];
  center: [number, number];
  zoom: number;
  count: number;
  max_site_tco2e: number;
}

export interface AbatementOption {
  lever: string;
  label: string;
  abatement_tco2e: number;
  cost_usd: number;
  cost_per_tonne_usd: number;
  note: string;
  cumulative_abatement_tco2e: number;
  cumulative_cost_usd: number;
  cumulative_reduction_pct: number;
}

export interface AbatementOptionsResult {
  baseline_tco2e: number;
  options: AbatementOption[];
  total_abatement_tco2e: number;
  total_cost_usd: number;
  carbon_price_2030_usd: number;
}

export interface Levers {
  solar_pct: number;
  fleet_ev_pct: number;
  supplier_switch_pct: number;
}

export async function getPortfolio(period = "2025-Q1"): Promise<PortfolioResult> {
  const r = await fetch(`${BASE}/portfolio?period=${encodeURIComponent(period)}`);
  if (!r.ok) throw new Error(`portfolio ${r.status}`);
  return r.json();
}

export async function getSites(): Promise<SitesResult> {
  const r = await fetch(`${BASE}/sites`);
  if (!r.ok) throw new Error(`sites ${r.status}`);
  return r.json();
}

export async function getAbatementOptions(baseline = 12000): Promise<AbatementOptionsResult> {
  const r = await fetch(`${BASE}/abatement-options?baseline_tco2e=${baseline}`);
  if (!r.ok) throw new Error(`abatement-options ${r.status}`);
  return r.json();
}

export async function calculate(
  site_id: string,
  overrides?: Record<string, number>
): Promise<SiteResult> {
  const r = await fetch(`${BASE}/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site_id, accounting: "both", overrides }),
  });
  if (!r.ok) throw new Error(`calculate ${r.status}`);
  return r.json();
}

export async function runScenario(
  baseline_tco2e: number,
  levers: Levers
): Promise<ScenarioResult> {
  const r = await fetch(`${BASE}/scenario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      baseline_tco2e,
      target_pct: 0.4,
      target_year: 2030,
      start_year: 2025,
      budget_usd: 10_000_000,
      levers,
    }),
  });
  if (!r.ok) throw new Error(`scenario ${r.status}`);
  return r.json();
}

// Stream the board summary (SSE). onChunk gets text deltas; onMeta gets source.
export async function streamSummary(
  scenario: ScenarioResult,
  onChunk: (text: string) => void,
  onMeta: (source: string) => void
): Promise<void> {
  const r = await fetch(`${BASE}/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario_result: scenario }),
  });
  if (!r.ok || !r.body) throw new Error(`summary ${r.status}`);

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() || "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      try {
        const ev = JSON.parse(line.slice(5).trim());
        if (ev.type === "meta") onMeta(ev.source);
        else if (ev.type === "delta") onChunk(ev.text);
      } catch {
        // ignore partial
      }
    }
  }
}
