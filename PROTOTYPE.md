# CarbonClarity — Prototype Spec (Scenario D)

## One-line pitch
Replace spreadsheet carbon accounting with a live decarbonization scenario planner: ingest fragmented energy data, auto-calculate real Scope 1+2 (and estimated Scope 3) emissions across 200 buildings in 15 countries, then drag investment levers and watch the emissions trajectory bend toward — or miss — the board's 40%-by-2030 target as the capital budget depletes in real time.

## The customer problem (from the brief)
Sustainability reporting is now a board-level compliance and financial-risk issue, but it is still handled with manual spreadsheets, fragmented data (utility providers, ERP systems, regional offices, manual records), and reactive reporting. Each quarterly cycle takes **weeks** of data collection, unit conversion, and reconciliation across countries and currencies. Computing one building's footprint for one quarter means multiplying fuel types by emission factors, converting units, allocating renewable energy certificates (RECs), and producing both location-based and market-based numbers.

The customer is **Meridian Industries**, an **SGX-listed manufacturer headquartered in Singapore** (revenue **S$4.1B ≈ US$3B**):
- **Scope 1+2 emissions: 12,000 tCO2e**
- **Estimated Scope 3: 108,000 tCO2e**
- **Board target: 40% reduction by 2030**
- **Decarbonization budget: S$13.5M (≈ US$10M) over three years**
- **200 buildings across 15 countries, quarterly reporting**

The team has **no way to model which investments move the needle, or in what sequence.** That is the gap CarbonClarity fills.

> **Money framing.** The cockpit presents to a Singapore board, so all currency is shown in **SGD** (budget **S$13.5M**, revenue **S$4.1B**). The backend still computes in USD/native units; SGD is a frontend display conversion (×1.35) in `frontend/src/domain.ts`. Emissions stay in tCO2e throughout.

## Concept + views
"CarbonClarity" — *Meridian Industries'* enterprise sustainability intelligence cockpit. Four views, all served by a real backend. The header carries the entity name, a light/dark **theme toggle** (sun/moon, default light) and a reporting-**period switcher** (FY2025 Q1 is the live cycle; prior periods come from the disclosure register):

1. **Baseline Dashboard** — portfolio footprint today: 12,000 tCO2e Scope 1+2 + 108,000 tCO2e estimated Scope 3, broken down by country, fuel type, and location- vs market-based accounting. Numbers are *computed*, not typed.
2. **Decarbonization Scenario Planner (HERO)** — investment levers (solar PV rollout, fleet electrification, supplier switch / green power purchase) as sliders. As the panel drags them, the 2030 emissions trajectory line re-bends live against the 40%-target line, and a **S$13.5M** budget meter depletes. The reduction math is real.
3. **Compliance & Reporting** — multi-framework report (GHG Protocol location-based + market-based; GRI/ESRS-style line items) generated instantly from the same engine. Before/after: "weeks of spreadsheets → one click." A **Disclosure & assurance register** (see below) sits at the bottom as the system-of-record / audit-trail beat.
4. **AI Board Summary Panel** — Amazon Bedrock (Claude) streams a board-ready narrative of the *chosen* scenario path on the spot: what was funded, what it abates, whether it hits 40% by 2030, and the residual gap.

### Disclosure register — the reporting-risk beat
At the foot of **Compliance & Reporting** is a **Disclosure & assurance register** (`frontend/src/components/DisclosureRegister.tsx`, data in `domain.ts`) — the corporate system-of-record / audit-trail equivalent. It lists every framework Meridian reports against — **GHG Protocol**, **SGX Sustainability Report**, **GRI 305**, **ESRS E1**, **IFRS S2** — each with a board/auditor-recognised status (**Assured / Filed / In review / Draft**) and the legacy manual effort it took (weeks of reconciliation, re-keyed across frameworks). The pitch hook: today these are five separate manual efforts off the same source, so fragmented multi-framework reporting *is* reporting **risk** (restatements, missed filings, qualified assurance) — and one reconciled engine collapses it. Hand-authored static narrative context; emissions math stays the real backend's.

## Hero moment (the scenario planner)
The executive panel drags solar from 0 → 60% of eligible rooftops, flips fleet EV to 50%, and switches two high-emitting countries to market-based green power. The trajectory line, previously *missing* the target, bends down and crosses below the 40%-by-2030 line. The budget meter slides from S$13.5M to ~S$11.7M committed (≈US$8.68M of US$10M). The AI panel streams: *"This sequence reaches a 41% reduction by 2030 against the 12,000 tCO2e baseline, with budget unallocated and the largest residual in Scope 1 process heat…"* — all in seconds, with no spreadsheet in sight.

## "Real backend" proof (this is scored — hardcoded responses don't count)
- `/calculate` runs the **actual emissions math** for a site/period: activity data × emission factor, unit conversion (kWh ↔ MWh ↔ GJ, litres → kWh), location-based vs market-based, REC allocation. Change a fuel volume or factor → output changes.
- `/portfolio` aggregates the 200-building synthetic dataset into the 12,000 tCO2e Scope 1+2 figure and the estimated 108,000 tCO2e Scope 3 — recomputed from raw activity rows, not stored as a constant.
- `/scenario` is a real engine: investment levers → annual abatement (tCO2e) + cost → a recomputed year-by-year trajectory to 2030 vs the target line, with running budget depletion (engine in USD; the meter displays SGD). Move a lever, the curve moves.
- `/summary` calls Bedrock (Claude) grounded in the *actual* scenario-engine output. The judges will change inputs live; every number on screen traces to a computed value.

## What a 5 looks like
"I'd put this in front of a customer CEO tomorrow, unedited." The first 10 seconds show the Meridian Industries / S$4.1B / 12,000 tCO2e / 40%-by-2030 framing on a clean, touchscreen-grade dashboard. The scenario planner is buttery: drag a lever, the trajectory and budget meter respond instantly, the target line is always visible, and the AI summary streams in board language. The before/after (weeks of reconciliation → instant multi-framework report) is **on screen**, not narrated. Every input the judges change produces a coherent, correctly-computed result; off-demo-path rough edges are acceptable.

## Demo narrative
The full read-through is a CEO/CFO pitch — see **DEMO_SCRIPT.md** (problem → stakes → live proof → business case → pilot ask), delivered to the CEO/CFO of *Meridian Industries*. In short:

"Meridian Industries, an SGX-listed manufacturer headquartered in Singapore. Scope 1+2 emissions: 12,000 tonnes of CO2-equivalent. The board has committed to a 40% reduction by 2030 — on a S$13.5 million budget over three years. Today, finding even *this quarter's* footprint takes weeks of spreadsheets across 15 countries, re-keyed into five different disclosure frameworks. And nobody can tell the board which investments actually move the needle. Watch us plan the decarbonization path — live."

## Features → scored criteria mapping

| Feature | Criterion served | Demo-path? | Bar |
|---|---|---|---|
| `/calculate` real emissions math (fuel × factor, unit conversion, location vs market-based, REC) | 1 Working backend, 2 Tech integration | Yes | **5** — must withstand live input changes |
| `/portfolio` aggregation → 12,000 tCO2e from raw rows | 1 Working backend, 4 Business impact | Yes | **5** |
| `/scenario` lever → abatement + cost → recomputed 2030 trajectory + budget depletion | 1 Working backend, 4 Business impact | Yes (HERO) | **5** — the wow |
| Scenario Planner UI: sliders, trajectory chart, target line, budget meter | 3 UI/UX polish, 4 Business impact | Yes (HERO) | **5** |
| Baseline Dashboard (country / fuel / location vs market) | 3 UI/UX, 4 Business impact | Yes | **5** |
| `/summary` Bedrock Claude streaming board narrative grounded in scenario results | 2 Tech integration, 5 Exec presence | Yes | **5** |
| Before/after on screen: weeks of spreadsheets → instant report | 4 Business impact, 5 Exec presence | Yes | **5** |
| Compliance & Reporting view (GHG Protocol + GRI/ESRS line items) | 2 Tech integration, 4 Business impact | Partial (shown briefly) | 4 — coherent, not exhaustive |
| Disclosure & assurance register (multi-framework status + reporting-risk hook) | 4 Business impact, 5 Exec presence | Yes (risk beat) | 4 — narrative system-of-record |
| SGD presentation, light/dark theme toggle, reporting-period switcher | 3 UI/UX polish, 5 Exec presence | Yes (chrome) | 4 — production-realism framing |
| Synthetic data realism (200 buildings, 15 countries, currencies) | 1, 2 | Off-path (underpins demo) | 4 — clean hero portfolio seeded |
| Cached AI fallback / graceful degradation | 1 Reliability of demo | Off-path safety net | 4 |
| One-command CDK deploy + README clone-to-run | (deliverable / clone-to-run bar) | Yes (judged via fresh clone) | **5** |

Demo-path items marked **5** must be flawless on camera and on a fresh clone. Everything else may have rough edges off the demo path — that is expected and acceptable.
