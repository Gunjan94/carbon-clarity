# CarbonClarity — Architecture Overview

**Decarbonization planner for a Singapore-listed manufacturer ("Meridian Industries").** The emissions +
scenario engine is the source of truth; the SGD chrome, the footprint map, the cost-per-tonne / carbon-tax
money view, and the board summary are presentation over its real numbers. Two audiences: the **CSO** (the
path to 40% by 2030) and the **CFO/board** (the money).

## Diagram
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  BROWSER  (React 18 + TypeScript + Vite, Tailwind, Recharts, react-leaflet)     │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────────────────┐ ┌──────────────┐  │
│  │ Baseline    │ │ Footprint    │ │ Scenario Planner (HERO)│ │ Compliance & │  │
│  │ Dashboard   │ │ Map          │ │  • levers → trajectory │ │ Reporting    │  │
│  │ (country/   │ │ (200 bldgs / │ │    vs 40%-by-2030 line │ │ (GHG/GRI/    │  │
│  │  fuel, loc  │ │  15 ctries,  │ │  • budget meter        │ │  ESRS +      │  │
│  │  vs market) │ │  click→site) │ │  • CFO money: MACC +   │ │  disclosure  │  │
│  │             │ │              │ │    carbon-tax + drill  │ │  register)   │  │
│  └──────┬──────┘ └──────┬───────┘ └───────────┬────────────┘ └──────┬───────┘  │
│   SiteMap (Leaflet + keyless CartoDB/OSM tiles)   theme.ts (light/dark, chart    │
│   domain.ts (SGD, entity, disclosure register, periods)            Proxy)        │
└──────┬───────────────┬────────────────┬───────────────────────┬─────────────────┘
   /portfolio      /sites            /scenario               /summary (SSE)
   /calculate      /abatement-options                        (board narrative)
       │               │                  │                       │
       ▼               ▼                  ▼                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  AWS Lambda  (Python 3.12, FastAPI via Mangum, Function URL)  — app.py          │
│   ┌──────────────────┐  ┌───────────────┐  ┌────────────────────┐               │
│   │ engine/emissions │  │ engine/geo    │  │ handlers/summary +  │               │
│   │  • Scope 1+2 math│  │  • country    │  │  llm.py             │               │
│   │    (fuel×factor, │  │    centroids  │  │  • board narrative  │               │
│   │    unit conv,    │  │  • per-bldg   │  │    grounded in the  │               │
│   │    loc vs market,│  │    coords +   │  │    scenario numbers │               │
│   │    RECs)         │  │    emissions  │  │  • keyless LLM (def) │               │
│   │ engine/scenario  │  └───────┬───────┘  │    → Bedrock (opt)   │               │
│   │  • levers→abate  │          │          └─────────┬──────────┘               │
│   │  • MACC (cost/t) │          │ reads              │                           │
│   │  • carbon-tax    │          ▼                    ▼                           │
│   └───────┬──────────┘   data/buildings.json   text.pollinations.ai (keyless)    │
│           ▼                (200 synthetic)      OR Amazon Bedrock Claude (opt)    │
│   data/factors.json (grid + fuel factors)       data/summary_cache.json (fallback)│
└──────────────────────────────────────────────────────────────────────────────┘
   Region ap-southeast-1.  Frontend → private S3 + CloudFront (OAC, HTTPS).
   AWS CDK (infra/cdk/, Python), one-command deploy. LIVE. Serverless, ~$0 idle.
```

## The four views, by audience
- **CSO:** **Baseline Dashboard** (footprint by country/fuel, location vs market-based) · **Footprint Map**
  (200 buildings across 15 countries, sized/coloured by emissions, click → per-site breakdown) · **Scenario
  Planner** (levers → live trajectory vs the 40%-by-2030 line + budget meter + grounded board summary).
- **CFO/board:** inside the Scenario Planner, the **"For the CFO & board"** section — **MACC** (cheapest
  tonnes first, cost/tonne) + **carbon-tax exposure** (avoided/yr + cumulative) + a **"show how this plan
  reaches X%"** transparency drill-down.
- **Compliance & Reporting:** multi-framework report (GHG location+market, GRI/ESRS) + the disclosure register.

## Data flow
1. **Baseline Dashboard** → `GET /portfolio` aggregates all 200 buildings from raw activity rows →
   **12,000 tCO2e** Scope 1+2 (+108,000 estimated Scope 3), by country/fuel, location vs market-based.
   A reporting-period switcher re-scales every figure.
2. **Footprint Map** → `GET /sites` (`engine/geo.py`): each building placed near its country hub
   (deterministic jitter) with its **computed** Scope 1+2; markers sized/coloured by emissions; click →
   `POST /calculate` for that site's breakdown (fuel × factor, unit conversion, location vs market, RECs).
   Editing a site's activity (e.g. grid kWh) flows straight through — nothing hard-coded.
3. **Scenario Planner** → `POST /scenario` (`engine/scenario_engine.py`): levers (solar / fleet-EV / green
   power) → annual abatement + cost → a recomputed year-by-year trajectory vs the target line, a depleting
   budget, **and** a `carbon` block (carbon-tax exposure no-action vs after-plan, annual + cumulative).
   `GET /abatement-options` returns the **MACC** (each lever's cost/tonne, sorted cheapest-first, cumulative
   %). Hero combo (Solar 60 / Fleet-EV 50 / Green-Power 40) = **41.0%** by 2030, ~S$11.7M committed.
4. **Board summary** → `POST /summary` (SSE) streams a narrative **grounded strictly in the scenario
   numbers** — keyless LLM by default, Amazon Bedrock Claude when `USE_BEDROCK=1`, template fallback.
5. **Degradation:** AI falls back to the grounded template/cache; keyless map tiles; vector markers.

## Why these choices
- **Real emissions + scenario engine over a static chart** — every figure (12,000 tCO2e, 41%, the MACC,
  the carbon-tax exposure) is computed and live, so a skeptic changing inputs can't break it.
- **Keyless map (Leaflet + CartoDB tiles)** — the footprint map ("where are my emissions") needs no API
  token, keeping the whole app runnable with zero credentials.
- **Keyless LLM by default, Bedrock optional** — board narrative grounded in real numbers so it can't
  drift; `USE_BEDROCK=1` swaps to Amazon Bedrock Claude once model access is enabled.
- **Two-audience information architecture** — CSO path vs CFO money, clearly labelled.
- **Serverless Lambda + Mangum, CDK one-command deploy** — already live; ~$0 idle. Synthetic data only.
