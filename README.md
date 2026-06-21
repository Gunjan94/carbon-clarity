# CarbonClarity — Enterprise Sustainability Intelligence (Meridian Industries · Singapore)

CarbonClarity replaces spreadsheet-based carbon accounting with a live decarbonization planner. It ingests fragmented energy data, computes real Scope 1+2 emissions (and an estimated Scope 3) across **200 buildings in 15 countries**, and lets an executive drag investment levers to watch the emissions trajectory bend toward — or miss — the board's **40%-by-2030** target as the capital budget depletes in real time. An Amazon Bedrock (Claude) panel then streams a board-ready narrative of the chosen plan, and a **Disclosure & assurance register** shows the multi-framework reporting burden it replaces.

The prototype is framed as a real **Singapore-listed manufacturer — "Meridian Industries"** — so figures read in **SGD**, the budget is **S$13.5M** (≈US$10M), and the reporting context (SGX / GHG Protocol / GRI / ESRS / IFRS S2) reads like a production sustainability cockpit. It is **pitched to the CEO/CFO** (see `DEMO_SCRIPT.md`), not presented as a generic feature tour.

**Scenario:** a S$4.1B (~US$3B) SGX-listed manufacturer HQ'd in Singapore — 12,000 tCO2e Scope 1+2, estimated 108,000 tCO2e Scope 3, board target 40% reduction by 2030 on a S$13.5M / 3-year budget, no way to model which investments move the needle. CarbonClarity answers that on screen.

**A light/dark theme** (default light) and a **reporting-period switcher** sit in the header for the walkthrough.

> Prototype built for an AWS APJ Innovation Hub challenge. Synthetic/sample data only — no real customer data, no secrets in this repo.

## Prerequisites
- **Node.js** 18+ and npm (built/verified on Node 22, npm 10)
- **Python** 3.12 (`python3.12` on PATH)
- **No AWS credentials required.** The app runs fully offline: emissions math and the scenario engine are real local computation, and the AI board summary uses a high-quality narrative grounded in the real scenario numbers. Set `USE_BEDROCK=1` (with AWS creds + Bedrock access) to stream from Amazon Bedrock (Claude) instead.
- **Optional — Amazon Bedrock model access** for live AI streaming. Demo region **ap-southeast-1 (Singapore)**, fall back **us-east-1**. Model id: `anthropic.claude-sonnet-4-6` (default) or `anthropic.claude-opus-4-8`. In ap-southeast-1 a regional inference profile prefix may be required (e.g. `apac.anthropic.claude-sonnet-4-6`). Verify with `bash scripts/check_bedrock.sh`.

> **Note on `npm install`:** this repo ships `frontend/.npmrc` pointing at the public npm registry so a fresh clone installs without any private-registry auth.

## One-command local run (recommended)
```bash
bash scripts/dev.sh
# backend  -> http://localhost:8077   (FastAPI/uvicorn)
# frontend -> http://localhost:5173   (Vite; open this)
```
First run creates the Python venv, installs deps, generates the synthetic data, then starts both servers. Override ports with `BACKEND_PORT=` / `FRONTEND_PORT=` (port 8000 / 5173 may be taken on your machine).

To stream from real Bedrock instead of the offline narrative:
```bash
USE_BEDROCK=1 BEDROCK_REGION=ap-southeast-1 bash scripts/dev.sh
```

## Manual run (two terminals)
```bash
# Terminal 1 — backend
cd backend && python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app:app --port 8077

# Terminal 2 — frontend
cd frontend && npm install && npm run dev    # opens http://localhost:5173
```
Regenerate the dataset any time: `cd data && python3.12 generate_data.py`.

## Cloud deploy — DEFERRED (local run only)
Cloud deploy is intentionally deferred for this prototype. `infra/cdk/` contains a documented stub of the intended serverless topology (4 Lambdas + HTTP API + Bedrock IAM); the handlers in `backend/handlers/` are already plain Lambda-ready functions. `scripts/deploy.sh` prints guidance rather than deploying.

## What to open for the demo
1. Open the app (deployed URL or `localhost:5173`).
2. Land on the **Baseline Dashboard** — confirm the hero KPIs: **12,000 tCO2e Scope 1+2**, **108,000 tCO2e estimated Scope 3**, 200 buildings, 15 countries. (Loads the seeded **hero portfolio** by default.)
3. Go to the **Scenario Planner** (the hero view).
4. Set the seeded **hero lever combo**:
   - **Solar PV: 60%**
   - **Fleet EV: 50%**
   - **Supplier switch (green power): 40%**
   This bends the trajectory below the 40%-by-2030 target line (~41% reduction), committing ~$8.7M of the $10M budget.
5. Click **Generate board summary** → a board narrative grounded in those numbers streams in (live Bedrock when `USE_BEDROCK=1` + creds; otherwise the grounded offline narrative).
6. Open **Compliance & Reporting** for the before/after (weeks → ~1.2s), the GHG/GRI/ESRS tables, and the **Disclosure & assurance register** (the reporting-risk beat).

**Theme:** the sun/moon button (top-right) toggles light/dark; defaults to **light** for a clean exec look — recommended for recording.

## Project layout
```
frontend/   React + TS + Vite
  src/
    views/        BaselineDashboard, ScenarioPlanner (hero), ComplianceReport
    components/    TrajectoryChart, BudgetMeter, LeverSlider, BoardSummaryPanel, DisclosureRegister
    theme.ts      light/dark palette source (CSS vars + live `chart` Proxy for Recharts)
    domain.ts     SG reporting context (entity, SGD conversion, disclosure register, periods)
    api.ts, format.ts
backend/    Python Lambda handlers + emissions & scenario engines (source of truth)
data/       synthetic dataset (200 buildings / 15 countries), factors, hero portfolio, AI cache
infra/      AWS CDK app (serverless, ~$0 idle) — deferred stub
scripts/    deploy.sh, dev.sh, check_bedrock.sh
```

**Backend is the source of truth; SGD/entity/disclosure chrome is a frontend presentation layer**
(`domain.ts`) over the engine's real numbers — every displayed figure traces back to live compute.

See `ARCHITECTURE.md` for the diagram and data flow, `BUILDER.md` for the full build spec (endpoint contracts, emissions math, scenario algorithm), and `DEMO_SCRIPT.md` for the recording walkthrough.
