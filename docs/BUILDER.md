# CarbonClarity — Builder Playbook (Scenario D)

This is the mechanical build guide. If a step is ambiguous, default to "make the demo path a 5" and cut off-path scope. The hero is the scenario planner — protect its quality above all else.

---

## 1. Repo layout

```
scenario-d-carbon-clarity/        (these docs live here; code goes in a sibling app dir or here)
  frontend/                       React + TS + Vite
    src/
      App.tsx
      api.ts                      typed fetch wrappers for the 4 endpoints
      views/
        BaselineDashboard.tsx
        ScenarioPlanner.tsx       HERO
        ComplianceReport.tsx
      components/
        TrajectoryChart.tsx       Recharts line: actual + target line
        BudgetMeter.tsx
        LeverSlider.tsx
        BoardSummaryPanel.tsx     streaming AI text
      theme.ts                    Tailwind tokens, big-touchscreen sizing
    index.html
    package.json
    vite.config.ts
  backend/                        Python Lambda handlers
    handlers/
      calculate.py                /calculate
      portfolio.py                /portfolio
      scenario.py                 /scenario
      summary.py                  /summary (Bedrock)
    engine/
      emissions.py                fuel × factor, unit conversion, location/market, REC
      scenario_engine.py          levers → abatement + cost → trajectory
      factors.py                  emission-factor + unit-conversion tables
      data_loader.py              load synthetic JSON from bundled file or S3
    requirements.txt
  data/
    buildings.json                200 buildings / 15 countries (generated)
    factors.json                  emission factors by country + fuel
    hero_portfolio.json           seeded clean hero subset + lever combo
    generate_data.py              deterministic generator (seed=42)
    summary_cache.json            cached Bedrock fallback responses
  infra/
    cdk/
      app.py                      CDK app
      carbon_clarity_stack.py     Lambda + API Gateway (HTTP API) + S3 (optional)
    cdk.json
  scripts/
    deploy.sh                     one-command deploy wrapper
    dev.sh                        one-command local run (backend + frontend)
    check_bedrock.sh              Day-1 Bedrock access verification
  README.md
```

---

## 2. Tech stack + versions

| Layer | Choice | Version |
|---|---|---|
| Frontend framework | React + TypeScript | React 18.3, TS 5.4 |
| Build tool | Vite | 5.x |
| Charts | Recharts | 2.12+ |
| Styling | Tailwind CSS | 3.4 (+ optional Cloudscape if time) |
| Backend runtime | Python | 3.12 |
| Compute | AWS Lambda | (CDK-provisioned) |
| API | API Gateway HTTP API | (CDK) |
| AI | Amazon Bedrock — Claude | model id below |
| Bedrock SDK | boto3 `bedrock-runtime` | `invoke_model_with_response_stream` |
| IaC | AWS CDK (Python) | v2 |
| Region | ap-southeast-1 (Singapore); fallback us-east-1 | — |

**Bedrock model id (verify Day 1):** Bedrock model IDs carry the `anthropic.` provider prefix. Use the current Claude model for the board narrative. Recommended: `anthropic.claude-sonnet-4-6` (fast, cheap, plenty capable for a grounded narrative summary; the brief suggests current Claude e.g. claude-sonnet-4-6). If you want the strongest prose, `anthropic.claude-opus-4-8` is the current top-tier Opus. On Bedrock you may need a region-qualified inference profile (e.g. `apac.anthropic.claude-sonnet-4-6` in ap-southeast-1) — confirm in the Bedrock console Day 1.

**Bedrock API note (current models):** adaptive thinking only — do NOT send `temperature`, `top_p`, `top_k`, or `thinking: {budget_tokens}` (all 400 on Opus 4.7/4.8; Sonnet 4.6 accepts adaptive thinking). No assistant prefill. Stream with `invoke_model_with_response_stream` so the board summary renders progressively. See AI Integration Spec below.

---

## 3. Day-by-day task list with gates

### Day 1 — synthetic data + skeleton calc
- `data/generate_data.py`: deterministic generator (seed=42) → `buildings.json` (200 buildings, 15 countries), `factors.json`.
- `backend/engine/emissions.py`: minimal `calculate_site(activity_rows, factors)` returning a real tCO2e number.
- `backend/handlers/calculate.py`: wire `/calculate` to the engine.
- Frontend skeleton: one button that calls `/calculate` and prints the number.
- **`check_bedrock.sh`**: confirm Bedrock + chosen model access in ap-southeast-1; if denied, switch to us-east-1 and note it in README.
- **GATE:** A UI button calls the backend and returns a REAL computed emissions value (not a constant).

### Day 2 — emissions engine (Scope 1+2) + baseline dashboard
- Complete `emissions.py`: unit conversions, location-based vs market-based, REC allocation, Scope 1 + Scope 2; estimated Scope 3 via spend/intensity factor.
- `backend/handlers/portfolio.py`: `/portfolio` aggregates all 200 buildings → ~12,000 tCO2e Scope 1+2, ~108,000 tCO2e Scope 3. Tune the generator so the seeded total lands on the brief's hero numbers.
- `BaselineDashboard.tsx`: country / fuel / location-vs-market breakdown, KPI tiles.
- **GATE:** Changing an input (a fuel volume or a factor) changes the output live, end to end.

### Day 3 — scenario planner + AI summary + UI
- `backend/engine/scenario_engine.py`: levers → annual abatement + cost → recomputed trajectory to 2030 vs target, budget depletion (algorithm in §6).
- `backend/handlers/scenario.py`: `/scenario`.
- `backend/handlers/summary.py`: `/summary` → Bedrock streaming, grounded in scenario output; cached fallback.
- `ScenarioPlanner.tsx` + `TrajectoryChart.tsx` + `BudgetMeter.tsx` + `LeverSlider.tsx` + `BoardSummaryPanel.tsx`.
- **GATE:** All views navigable and coherent; dragging a lever re-bends the trajectory and depletes the budget; AI summary streams.

### Day 4 — compliance report + before/after + one-command deploy
- `ComplianceReport.tsx`: GHG Protocol location- + market-based table, GRI/ESRS-style line items, all from the engine.
- Before/after panel: "Manual: ~3 weeks per cycle, 200 buildings × 15 countries" vs "CarbonClarity: instant" — on screen.
- `infra/cdk/` complete; `scripts/deploy.sh` one command; seed `hero_portfolio.json`.
- **GATE:** Fresh clone → README → working demo.

### Day 5 — write-ups + record + buffer
- Fill BUILD_APPROACH.md results, finalize ARCHITECTURE.md, record per DEMO_SCRIPT.md.
- **GATE:** All 4 deliverables done; ≥ ½ day buffer.

---

## 4. Backend endpoint specs

All endpoints: JSON in/out, CORS enabled, behind API Gateway HTTP API. Times in tCO2e, costs in USD.

### `POST /calculate` — emissions for a site/period
**Request**
```json
{
  "site_id": "SG-014",
  "period": "2025-Q1",
  "accounting": "both",          // "location" | "market" | "both"
  "overrides": { "grid_kwh": 240000 }   // optional live-edit of activity data
}
```
**Response**
```json
{
  "site_id": "SG-014", "country": "SG", "period": "2025-Q1",
  "scope1_tco2e": 38.2,
  "scope2_location_tco2e": 95.6,
  "scope2_market_tco2e": 61.0,
  "scope3_estimated_tco2e": 410.0,
  "breakdown": [
    {"source":"natural_gas","activity":12000,"unit":"m3","factor":2.02,"tco2e":24.2,"scope":1},
    {"source":"grid_electricity","activity":240000,"unit":"kWh","factor":0.000398,"tco2e":95.6,"scope":2,"basis":"location"}
  ]
}
```
**Logic:** load site activity rows → for each row, convert to canonical unit → multiply by the country/fuel factor → assign scope → for Scope 2, compute both location-based (grid factor) and market-based (apply REC allocation, then residual-mix factor) → sum. Apply `overrides` before computing so live edits flow through.

### `GET /portfolio` — aggregate
**Request:** `?period=2025-Q1` (optional `?portfolio=hero`)
**Response**
```json
{
  "period":"2025-Q1","building_count":200,"country_count":15,
  "scope1_tco2e":4200, "scope2_location_tco2e":7800, "scope2_market_tco2e":7100,
  "scope1_2_total_tco2e":12000, "scope3_estimated_tco2e":108000,
  "by_country":[{"country":"SG","tco2e":2100}, ...],
  "by_fuel":[{"fuel":"grid_electricity","tco2e":7800}, ...]
}
```
**Logic:** call the emissions engine for all 200 buildings and sum. Scope 1+2 total seeded to land at 12,000 tCO2e; Scope 3 estimated total at 108,000 tCO2e. Cache the aggregate in-memory per Lambda warm container for snappy demo.

### `POST /scenario` — investment levers → trajectory to 2030
**Request**
```json
{
  "baseline_tco2e": 12000,
  "target_pct": 0.40, "target_year": 2030, "start_year": 2025,
  "budget_usd": 10000000,
  "levers": {
    "solar_pct": 0.60,        // share of eligible rooftop demand met by solar PV
    "fleet_ev_pct": 0.50,     // share of fleet electrified
    "supplier_switch_pct": 0.40  // share of grid load moved to market-based green power
  }
}
```
**Response**
```json
{
  "trajectory": [
    {"year":2025,"tco2e":12000},
    {"year":2026,"tco2e":11100},
    {"year":2030,"tco2e":7080}
  ],
  "target_line": [{"year":2025,"tco2e":12000}, {"year":2030,"tco2e":7200}],
  "final_tco2e": 7080, "final_reduction_pct": 0.41,
  "hits_target": true,
  "budget_committed_usd": 8700000, "budget_remaining_usd": 1300000,
  "lever_detail": [
    {"lever":"solar_pct","annual_abatement_tco2e":1320,"cost_usd":4100000},
    {"lever":"fleet_ev_pct","annual_abatement_tco2e":540,"cost_usd":2300000},
    {"lever":"supplier_switch_pct","annual_abatement_tco2e":3060,"cost_usd":2300000}
  ]
}
```
**Logic:** algorithm in §6. Pure function over the baseline + levers; recomputed every call so the chart and budget meter respond live.

### `POST /summary` — Bedrock board narrative (streaming)
**Request**
```json
{ "scenario_result": { ...the /scenario response... } }
```
**Response:** streamed text (SSE or chunked) — a board-ready paragraph. On Bedrock failure, return `data/summary_cache.json` matched to the nearest lever combo. See AI Integration Spec.

---

## 5. The emissions math (written out — implement mechanically)

Per site, per period, sum over activity rows. **tCO2e for a row = activity_in_canonical_unit × emission_factor.**

### 5.1 Unit conversions (to canonical units)
Canonical: energy in **kWh**, gas in **kWh of fuel energy**, fuel volume → energy.
- 1 MWh = 1,000 kWh; 1 GJ = 277.78 kWh.
- Natural gas: keep m3 *or* convert via calorific value ~10.55 kWh/m3 (configurable in `factors.json`).
- Diesel: 1 litre ≈ 10.0 kWh energy; for direct combustion factor use kgCO2e/litre directly (simpler — see below).

Implementation: `convert(value, from_unit, to_unit)` table-driven in `factors.py`. Round only at display.

### 5.2 Scope 1 — direct combustion (stationary + mobile)
For each fuel burned on site (natural gas, diesel, LPG):
```
scope1_tco2e_row = activity[unit] × factor_kgco2e_per_unit / 1000
```
Example: 12,000 m3 natural gas × 2.02 kgCO2e/m3 / 1000 = 24.24 tCO2e.
Sum across all Scope 1 rows.

### 5.3 Scope 2 — purchased electricity (location-based vs market-based)
**Location-based** uses the country grid average factor:
```
scope2_location_tco2e = grid_kwh × grid_factor_kgco2e_per_kwh[country] / 1000
```
**Market-based** applies contractual instruments (RECs) first, then a residual-mix factor:
```
covered_kwh = grid_kwh × rec_coverage_fraction        # RECs zero out their share
residual_kwh = grid_kwh − covered_kwh
scope2_market_tco2e = residual_kwh × residual_mix_factor[country] / 1000
```
A site with a green-power contract (RECs) has lower market-based than location-based emissions — this difference is shown on the dashboard and is exactly what the supplier-switch lever moves.

### 5.4 REC allocation
Each building carries `rec_coverage_fraction` (0–1). RECs apply only to the market-based number. The `supplier_switch` scenario lever *increases* effective coverage portfolio-wide.

### 5.5 Scope 3 — estimated (spend-based)
Scope 3 is **estimated**, clearly labeled as such (the brief says "estimated 108,000 tCO2e"):
```
scope3_estimated_tco2e = annual_spend_usd × scope3_intensity_kgco2e_per_usd / 1000
```
Seed `scope3_intensity` so the portfolio sums to ~108,000 tCO2e. Show as a single estimated band; do not over-engineer category-level Scope 3.

### 5.6 Site total
```
site_total = scope1 + scope2_market (reported)  ; also surface scope2_location for transparency
portfolio Scope 1+2 = Σ sites  → tuned to 12,000 tCO2e
```

---

## 6. The scenario engine (written out — implement mechanically)

Pure function: `run_scenario(baseline_tco2e, levers, budget, start=2025, target_year=2030, target_pct=0.40)`.

### 6.1 Per-lever abatement + cost (config in `scenario_engine.py`)
Each lever maps an intensity (0–1) to **annual abatement (tCO2e at full deployment)** and **capital cost (USD)**, scaled linearly by the lever value:

| Lever | Max annual abatement @100% | Max cost @100% | Notes |
|---|---|---|---|
| `solar_pct` | 2,200 tCO2e | $6.8M | offsets Scope 2 location/market via on-site generation |
| `fleet_ev_pct` | 1,080 tCO2e | $4.6M | offsets Scope 1 mobile combustion |
| `supplier_switch_pct` | 7,650 tCO2e | $5.75M | raises REC coverage; biggest Scope 2 market-based mover, cheap per tonne |

```
abatement[lever]   = max_abatement[lever] × lever_value
cost[lever]        = max_cost[lever]       × lever_value
total_annual_abatement = Σ abatement[lever]   (cap at baseline_tco2e)
budget_committed       = Σ cost[lever]
budget_remaining       = budget − budget_committed   (may go negative → flag "over budget")
```

### 6.2 Trajectory to 2030 (linear ramp-in)
Investments ramp in linearly from start_year to target_year (deployment isn't instant):
```
for year in [start_year .. target_year]:
    progress = (year − start_year) / (target_year − start_year)   # 0 → 1
    tco2e[year] = baseline_tco2e − total_annual_abatement × progress
final_tco2e = tco2e[target_year]
final_reduction_pct = (baseline_tco2e − final_tco2e) / baseline_tco2e
hits_target = final_reduction_pct >= target_pct
```

### 6.3 Target line
```
target_endpoint = baseline_tco2e × (1 − target_pct)        # 12,000 × 0.6 = 7,200
target_line = straight line from (start_year, baseline) to (target_year, target_endpoint)
```
Render the target line as a dashed reference; the trajectory crossing below it = "hits target."

### 6.4 Budget depletion
The `BudgetMeter` reads `budget_committed` / `budget`. Over-budget (>$10M) flags red — a realistic constraint the panel must navigate. The hero combo (§7) lands committed at ~$8.7M (under budget) while hitting ~41%.

---

## 7. Synthetic data spec

`data/generate_data.py` (seed=42, deterministic).

### 7.1 Buildings (200 rows)
Fields per building:
```
id            "SG-014"
country       one of 15 ISO codes
type          office | factory | warehouse | dc
floor_area_m2
grid_kwh                  annual purchased electricity
natural_gas_m3            Scope 1 stationary
diesel_litres             Scope 1 mobile/backup
rec_coverage_fraction     0–1 (most ~0.0–0.2 baseline)
annual_spend_usd          drives estimated Scope 3
eligible_solar_kwh        rooftop solar potential
fleet_diesel_litres       fleet fuel (for EV lever)
```

### 7.2 Countries (15) + factors (`factors.json`)
ISO codes (Singapore HQ + manufacturing footprint): SG, MY, TH, VN, ID, PH, IN, CN, JP, KR, AU, DE, US, GB, BR.
Per country: `grid_factor_kgco2e_per_kwh` (location), `residual_mix_factor_kgco2e_per_kwh` (market), local `currency` + `fx_to_usd`. Use plausible public-style grid factors (e.g. SG ~0.40, IN ~0.71, AU ~0.66, FR-like low, etc.) — these are illustrative, label as sample data. Fuel factors: natural_gas 2.02 kgCO2e/m3, diesel 2.68 kgCO2e/litre, LPG 1.51 kgCO2e/litre.

### 7.3 Currencies
Each non-USD country has a currency + FX rate; `annual_spend` stored in local currency, converted to USD in the loader (demonstrates the "currencies" reconciliation pain the brief calls out).

### 7.4 Seeded clean hero portfolio + lever combo
`data/hero_portfolio.json`: the full 200 buildings tuned so `/portfolio` returns **exactly 12,000 tCO2e Scope 1+2** and **108,000 tCO2e Scope 3**. The seeded **hero lever combo** for the demo:
```json
{ "solar_pct": 0.60, "fleet_ev_pct": 0.50, "supplier_switch_pct": 0.40 }
```
→ ~41% reduction by 2030, ~$8.7M committed, $1.3M remaining, `hits_target: true`. Verify the generator lands these before Day 5.

---

## 8. Frontend view breakdown

- **Baseline Dashboard:** hero KPI row (12,000 tCO2e Scope 1+2; 108,000 estimated Scope 3; 200 buildings; 15 countries). Country bar chart, fuel donut, location-vs-market comparison bars. Big-touchscreen type sizes (≥18px base, ≥32px KPIs).
- **Scenario Planner (HERO):** three `LeverSlider`s on the left; `TrajectoryChart` center (solid trajectory line + dashed target line + 2030 marker, y-axis tCO2e, x-axis 2025–2030); `BudgetMeter` right ($10M, committed fill, remaining label, red if over). On any slider change: debounce ~150ms → call `/scenario` → animate the line + meter. "Hits 40% by 2030 ✓ / ✗" badge.
- **Compliance Report View:** GHG Protocol table (Scope 1, Scope 2 location, Scope 2 market, Scope 3 estimated), GRI/ESRS-style line items, "Generated in 1.2s vs ~3 weeks manual" banner. Export button (can be cosmetic).
- **AI Board Summary Panel:** "Generate board summary" → streams Claude text token-by-token into the panel; shows a cached badge if fallback used. Lives on the Scenario Planner so the panel narrates the chosen path.

---

## 9. AI integration spec (Amazon Bedrock — Claude)

- **Model id:** `anthropic.claude-sonnet-4-6` (current Claude; fast/cheap for grounded narrative). Top-tier alt: `anthropic.claude-opus-4-8`. In ap-southeast-1 you may need a region inference profile prefix (e.g. `apac.`) — confirm Day 1.
- **Call:** boto3 `bedrock-runtime.invoke_model_with_response_stream` so the panel streams. Body uses the Anthropic Messages format: `anthropic_version`, `max_tokens` (~600), `messages`. **Do not** set `temperature`/`top_p`/`top_k` or `thinking.budget_tokens` (rejected on current models). For richer reasoning, optionally `thinking: {"type":"adaptive"}` (Sonnet 4.6 supports adaptive) — keep `max_tokens` ≥ the streamed length.
- **Grounding:** pass the *actual* `/scenario` result in the prompt; instruct the model to use only those numbers.

**Prompt sketch (system + user):**
```
System: You are a sustainability advisor briefing the board of a $3B Singapore-HQ
manufacturer. Be concise, factual, board-level. Use ONLY the numbers provided.
No preamble.

User: Baseline Scope 1+2 = {baseline} tCO2e. Board target = {target_pct}% reduction by
{target_year}. Budget = ${budget}. Chosen plan: {lever_detail}. Modeled outcome:
{final_tco2e} tCO2e in {target_year} ({final_reduction_pct}% reduction),
hits_target = {hits_target}, ${budget_committed} committed, ${budget_remaining} remaining.
Write a 4-5 sentence board summary: what the plan funds, whether it meets the 40%-by-2030
target, the residual gap, and the single highest-leverage next move.
```

**Streaming (Python sketch):**
```python
resp = client.invoke_model_with_response_stream(
    modelId="anthropic.claude-sonnet-4-6",
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 600,
        "system": SYSTEM,
        "messages": [{"role": "user", "content": USER}],
    }),
)
for event in resp["body"]:
    chunk = json.loads(event["chunk"]["bytes"])
    if chunk["type"] == "content_block_delta":
        yield chunk["delta"]["text"]
```

**Cached fallback:** `data/summary_cache.json` keyed by rounded lever combo; if Bedrock errors/times out, return the nearest cached narrative and mark it cached. The hero combo MUST have a cached entry so the demo never shows a blank panel.

---

## 10. Deploy steps (CDK)

1. `scripts/check_bedrock.sh` — Day 1: confirm model access in ap-southeast-1, else us-east-1 (set `CDK_REGION` accordingly, note in README).
2. `cd infra/cdk && cdk bootstrap` (first time per account/region).
3. `scripts/deploy.sh` → `cdk deploy` provisions: 4 Lambda functions (Python 3.12), one HTTP API with routes `/calculate /portfolio /scenario /summary`, IAM allowing `bedrock:InvokeModelWithResponseStream` on the chosen model, optional S3 bucket for `buildings.json` (or bundle it in the Lambda zip — simpler, ~$0 idle).
4. Output: API base URL → drop into `frontend/.env` (`VITE_API_BASE`).
5. Frontend: `npm run build`; host on S3+CloudFront via CDK *or* run `npm run dev` against the deployed API for the demo (simplest).

Serverless, ~$0 idle. Region for demo: **ap-southeast-1 (Singapore)** to match the customer; fall back to us-east-1 only if Bedrock access blocks Day 1.

---

## 11. Graceful degradation plan
- **Bedrock down/slow:** serve cached summary (`summary_cache.json`); panel still streams convincingly.
- **Scenario engine:** pure deterministic function — never network-dependent; always renders.
- **Hero data pinned:** `/portfolio?portfolio=hero` and the seeded lever combo always land on compelling numbers (12,000 → ~41%, under budget) regardless of judge input order.
- **Live edits bounded:** `/calculate overrides` clamp to sane ranges so a wild input can't NaN the chart; out-of-range shows a graceful note, not a crash.

---

## 12. Definition of Done (mirrors the §14 bar)
- [ ] `/calculate` returns real, input-sensitive emissions (fuel × factor, unit conversion, location vs market, REC) — judges can change a value and see it move.
- [ ] `/portfolio` aggregates 200 buildings → 12,000 tCO2e Scope 1+2 and 108,000 tCO2e Scope 3 from raw rows.
- [ ] `/scenario` recomputes the 2030 trajectory + budget depletion live as levers move; target line always visible; hits-target badge correct.
- [ ] `/summary` streams a Bedrock Claude board narrative grounded in the scenario result; cached fallback works.
- [ ] Scenario Planner is the visual hero: smooth sliders, bending trajectory, depleting $10M meter, target line — first 10 seconds are showroom-grade.
- [ ] Before/after (weeks → instant) is ON SCREEN.
- [ ] Fresh clone → README → one-command deploy → working demo.
- [ ] No secrets in repo; synthetic data only.
- [ ] Demo-path is a 5; deadline met with ≥ ½ day buffer. If behind: cut the Compliance Report polish before touching the scenario planner.
