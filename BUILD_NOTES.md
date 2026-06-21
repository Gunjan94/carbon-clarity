# CarbonClarity — Build Notes

What was actually built, how to run it, what is real vs mocked, and the
verification evidence captured during the build.

## What runs

A full, locally-runnable prototype — not a skeleton.

- **Backend** (`backend/`): Python 3.12, FastAPI/uvicorn, four endpoints
  (`/calculate`, `/portfolio`, `/scenario`, `/summary`) each delegating to a
  plain handler function (`backend/handlers/`) so they drop into Lambda later.
  Pure engines in `backend/engine/` (`emissions.py`, `scenario_engine.py`,
  `factors.py`, `data_loader.py`).
- **Frontend** (`frontend/`): React 18 + TypeScript + Vite 5 + Tailwind 3 +
  Recharts. Three views — Baseline Dashboard, Scenario Planner (HERO),
  Compliance & Reporting — plus the AI Board Summary panel on the planner.
  Presentation layer framing the cockpit as *Meridian Industries* (Singapore,
  SGD): `frontend/src/theme.ts` (light/dark palettes → CSS variables + a live
  `chart` Proxy for Recharts; sun/moon header toggle, light default),
  `frontend/src/domain.ts` (reporting entity, SGD display conversion ×1.35,
  disclosure-register data, reporting periods for the header period switcher),
  and `frontend/src/components/DisclosureRegister.tsx` (the disclosure &
  assurance register at the foot of Compliance & Reporting).
- **Data** (`data/`): deterministic generator (seed=42) producing 200 buildings
  / 15 countries; `buildings.json`, `factors.json`, `hero_portfolio.json`,
  `summary_cache.json` are committed.
- **Scripts** (`scripts/`): `dev.sh` (one-command local run), `check_bedrock.sh`,
  `deploy.sh` (deferred-deploy guidance).
- **Infra** (`infra/cdk/`): documented stub only — cloud deploy deferred per
  the brief; the handlers are Lambda-ready.

## How to run

```bash
bash scripts/dev.sh
# backend  -> http://localhost:8077
# frontend -> http://localhost:5173   (open this)
```

First run builds the venv, installs deps, generates data, starts both servers.
Ports are overridable: `BACKEND_PORT=… FRONTEND_PORT=… bash scripts/dev.sh`
(8000 and 5173 are commonly taken; the chosen backend default is **8077**).

Real Bedrock streaming: `USE_BEDROCK=1 bash scripts/dev.sh` (needs AWS creds +
Bedrock Claude access; otherwise the app uses the offline grounded narrative).

## Real vs mocked

**Real (genuinely computed, never hardcoded):**
- All emissions math — fuel × factor, unit conversion, Scope 1 combustion,
  Scope 2 location-based vs market-based with REC allocation, estimated
  spend-based Scope 3. Verified input-sensitive: doubling a site's `grid_kwh`
  doubles its Scope 2.
- Portfolio aggregation over all 200 buildings — reconciles to **12,000.0
  tCO2e Scope 1+2** and **108,000.0 tCO2e Scope 3** from raw rows.
- The scenario engine — levers → annual abatement + cost → linear-ramp
  trajectory to 2030 vs the 40% target line + $10M budget depletion. Pure
  deterministic function; recomputed every call. Hero combo → **41.0%
  reduction, $8.68M committed, $1.32M remaining, hits_target true**.
- The AI board summary text is grounded strictly in the real `/scenario`
  numbers (offline templated narrative) and streams token-by-token over SSE.

**Mocked / simplified (and labeled as such on screen):**
- **SGD presentation + disclosure register are presentation-layer.** The
  *Meridian Industries* / SGD chrome (budget S$13.5M, revenue S$4.1B) is a
  frontend display conversion (×1.35 in `domain.ts`) over the USD-computing
  backend — *derived*, not a separate calculation. The disclosure & assurance
  register (GHG Protocol / SGX / GRI 305 / ESRS E1 / IFRS S2 with status +
  legacy effort) is *hand-authored* static narrative context — the
  system-of-record beat, no backend call. The emissions + scenario math behind
  them is real and unchanged.
- **Emission factors** are illustrative sample values (plausible public-style
  grid/fuel factors), not an authoritative factor library. The *math* is real.
- **Scope 3** is a single spend-based intensity estimate, labeled "estimated"
  per the brief — not category-level supply-chain modeling.
- **AI summary default is offline.** With no AWS creds the `/summary` endpoint
  returns a high-quality canned/templated narrative built from the real
  scenario results. `USE_BEDROCK=1` switches to real Bedrock `invoke_model_with_response_stream`
  (Claude `anthropic.claude-sonnet-4-6`, region `ap-southeast-1`); any Bedrock
  error degrades gracefully back to the offline narrative. In this environment
  AWS creds are **expired**, so the grounded offline narrative is what served —
  live Bedrock was not exercised and remains unverified end-to-end.
- **Synthetic data is normalized.** The generator scales random (seed=42)
  activity by one scalar per stream so the portfolio lands exactly on the
  brief's hero numbers. Every per-site figure is still computed by the real
  engine; only the input activity is scaled. Scalars are recorded in
  `hero_portfolio.json` and printed by the generator for transparency.
- **Cloud deploy is deferred** — `infra/cdk/` is a documented stub.

## Verification evidence (what I executed and saw)

- `python3.12 data/generate_data.py` →
  `Scope 1+2 (market): 12,000.0 tCO2e (target 12,000)` and
  `Scope 3 estimated: 108,000.0 tCO2e (target 108,000)`.
- Backend up on :8077, `GET /portfolio` →
  `building_count 200, country_count 15, scope1_2_total 12000.0, scope3 108000.0`.
- `POST /calculate` on a site → real per-scope numbers; with
  `overrides:{grid_kwh: 2×}` the Scope 2 location/market values doubled.
- `POST /scenario` hero combo → `reduction 41.0%, hits True, committed
  $8,680,000, remaining $1,320,000`; trajectory
  `12000 → 11016 → 10032 → 9048 → 8064 → 7080`. A low combo (0.1/0.1/0.1) →
  `9.1%, hits False` (proves the curve genuinely bends).
- `POST /summary` (offline) streamed ~97 SSE word-deltas with
  `source: offline-template`; verified both direct (:8077) and through the
  Vite `/api` proxy.
- `npm run build` → TS typecheck + Vite production build pass
  (`dist/assets/index-*.js 600.81 kB`).
- `bash scripts/dev.sh` (fresh-venv path) → both servers up; proxied
  `/api/portfolio` reconciled to 12,000.0 tCO2e.
- Latency: `/scenario` ~1.7 ms p50, `/portfolio` ~11 ms (server-side).

## Known rough edges

- **Ports.** Defaults 8000/5173 were occupied by other apps on the build
  machine, so the backend default is **8077** and `dev.sh` lets you override
  the frontend port. Vite auto-increments if 5173 is taken — open the URL it
  prints.
- **Python version.** The brief targets 3.12; the build machine's default
  `python3` was 3.9, so `dev.sh` prefers `python3.12` explicitly. The code is
  written to run on 3.9+ too (uses `from __future__ import annotations`).
- **`frontend/.npmrc`** forces the public npm registry so a fresh clone isn't
  blocked by a private/expired CodeArtifact token.
- **Real Bedrock path unverified.** AWS creds are expired in this environment
  (no Bedrock model access), so only the offline streaming path was exercised
  end-to-end and the grounded offline narrative serves. The boto3 streaming
  call is implemented to the documented Messages-format spec (no
  temperature/top_p/thinking-budget) but not run live.
- **Vite bundle >500 kB** (Recharts). Cosmetic warning; no code-splitting added.
- Compliance Report "Export" button and the "~1.2 s" banner are cosmetic, as
  scoped.
