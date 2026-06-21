# CarbonClarity — Architecture Overview

## Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│  BROWSER (touchscreen)  —  React + TypeScript + Vite + Tailwind + Recharts │
│  Header: Meridian Industries · theme toggle (light/dark) · period switcher │
│                                                                            │
│  Baseline Dashboard │ Scenario Planner (HERO) │ Compliance & │ AI Summary  │
│        │                    │  levers/trajectory/budget  Reporting │ stream │
│  ── presentation layer (frontend/src) ───────────  + Disclosure register   │
│     theme.ts (palettes→CSS vars + chart Proxy) · domain.ts (entity, SGD ×,  │
│     disclosure register data, periods) · DisclosureRegister.tsx             │
└────────┼────────────────────┼───────────────────────────────────┼─────────┘
         │ HTTPS/JSON         │                                    │ stream
         ▼                    ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│            Amazon API Gateway (HTTP API)  —  ap-southeast-1 (Singapore)      │
│   /calculate        /portfolio        /scenario         /summary             │
└────────┼────────────────┼──────────────────┼──────────────────┼─────────────┘
         ▼                ▼                  ▼                  ▼
   Lambda calculate  Lambda portfolio  Lambda scenario   Lambda summary
         │                │                  │                  │
         ▼                ▼                  ▼                  │ invoke_model_
   ┌─────────────────────────────────────────────────┐         │ with_response_
   │  engine/  (pure Python, no I/O on the hot path)  │         │ stream
   │  emissions.py   scenario_engine.py   factors.py  │         ▼
   └───────────────┬─────────────────────────────────┘   ┌──────────────────┐
                   │ loads at cold start                  │  Amazon Bedrock  │
                   ▼                                       │  Claude          │
   ┌───────────────────────────────────┐                  │ (sonnet-4-6 /    │
   │  data/ (bundled JSON or S3)        │                  │  opus-4-8)       │
   │  buildings.json (200 / 15 ctry)    │                  └────────┬─────────┘
   │  factors.json   hero_portfolio.json│                           │ fallback
   └───────────────────────────────────┘                  summary_cache.json
                                                            (graceful degrade)
   Provisioned by AWS CDK (Python).  Serverless, ~$0 idle.
```

## Data flow narrative
1. **Synthetic data → engine.** 200 buildings across 15 countries (with country grid factors, fuel factors, REC coverage, currencies) load from bundled JSON (or S3) into the Lambda at cold start.
2. **Emissions engine (`/calculate`, `/portfolio`).** For each site, raw activity data (grid kWh, gas m3, diesel litres, spend) is converted to canonical units, multiplied by the correct emission factor, and split into Scope 1 (combustion), Scope 2 **location-based and market-based** (RECs applied first, then residual mix), and **estimated** Scope 3 (spend × intensity). Aggregated, the portfolio resolves to the customer's real numbers: **12,000 tCO2e Scope 1+2** and **108,000 tCO2e estimated Scope 3**. These are *computed from rows*, not stored constants.
3. **Scenario engine (`/scenario`).** Investment levers (solar PV, fleet EV, supplier/green-power switch) map to annual abatement (tCO2e) and capital cost (USD). The engine ramps deployment linearly to 2030, recomputes the emissions trajectory, draws it against the **40%-by-2030 target line** (baseline × 0.60 = 7,200 tCO2e), and depletes the **US$10M budget** (≈ S$13.5M as displayed). Every lever change re-runs this pure function — the chart and budget meter respond instantly.
4. **AI board summary (`/summary`).** The scenario result is passed to **Amazon Bedrock (Claude)**, which streams a board-ready narrative grounded strictly in those numbers — what the plan funds, whether it hits 40% by 2030, the residual gap, the next-best move. A cached fallback guarantees the panel never goes blank. (In this environment the grounded offline narrative serves by default; it streams from live Bedrock when `USE_BEDROCK=1` and AWS creds are configured.)
5. **UI.** React renders all four views; the Scenario Planner is the hero, with live trajectory bending and budget depletion on a touchscreen-sized canvas. A thin **presentation layer** (`frontend/src/`) frames the cockpit as *Meridian Industries* without touching the backend:
   - **`theme.ts`** — one source-of-truth `PALETTES` (light default, dark) written onto `<html>` as CSS variables (hex + `-rgb` channels) that `tailwind.config.js` and `index.css` consume. A live `chart` Proxy reads the *current* palette so Recharts components (which need raw colour strings) repaint on toggle. The header sun/moon button calls `toggleMode()`.
   - **`domain.ts`** — the reporting entity, the **SGD display conversion** (`sgd`/`sgdM`, ×1.35), the disclosure-register data, and the reporting-period list. SGD is purely a display-layer conversion over the USD-computing backend; the engine never sees SGD.
   - **`DisclosureRegister.tsx`** — renders the disclosure & assurance register at the foot of **Compliance & Reporting**. It is **static narrative context** (hand-authored framework rows + legacy-effort, no backend call) — the system-of-record / audit-trail beat, not computed output.

## Why these choices (sustainability-specific)
- **Serverless (Lambda + API Gateway + CDK):** one-command deploy, ~$0 idle, region-portable. A sustainability tool that itself costs almost nothing to run is on-message; CDK gives the judges a clean clone-to-run.
- **Real emissions math over synthetic data:** the scored bar explicitly rejects hardcoded responses. The fuel × factor / unit-conversion / location-vs-market / REC pipeline is exactly the weeks-of-spreadsheet work the customer does by hand — doing it for real, instantly, is the whole value proposition and survives live input changes.
- **Dedicated scenario engine as a pure function:** decarbonization planning is the customer's unmet need ("no way to model which investments move the needle, in what sequence"). Keeping it a deterministic, network-free function makes the hero interaction instant and unbreakable on camera.
- **Bedrock (Claude) for the board narrative:** the audience is a board. Claude turns the engine's numbers into the language a CEO presents, grounded so it can't drift from the computed result — AI + cloud + data thoughtfully combined, not bolted on.
- **Singapore region (ap-southeast-1):** matches the customer's HQ; falls back to us-east-1 only if Bedrock model access requires it (verified Day 1).
