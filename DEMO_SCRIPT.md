# CarbonClarity — Walkthrough Voice-Over Script (for the screen recording)

> **This is a voice-over script for a recorded screen walkthrough — not a live meeting.** Narrate to the
> viewer (the AWS panel) *about* the customer; don't address anyone in the room. Read the **quoted lines**
> aloud; **[bracketed bold]** = on-screen action. All figures **SGD**; emissions **tCO2e**.

**What it is:** *CarbonClarity* — a live decarbonization planner for a Singapore-listed manufacturer
("Meridian Industries"). It serves two leaders at once — the **Chief Sustainability Officer** (a credible
path to the 40%-by-2030 target) and the **CFO/board** (the cheapest route there and the carbon-tax it
avoids) — so the walkthrough shows both.

**Length:** ~9:00, inside the 10-min cap. **Arc:** the problem both leaders face → the sustainability path
(live) → the CFO money → "is it real?" → business case → close.

> **Pre-flight:** full-screen at the deployed URL (or `localhost:5173`), **light theme**, open on
> **Footprint Map**. Clean desktop, notifications off, 1080p. Dry-run the three Scenario-Planner lever drags.

---

## 0:00 – 0:50 — The problem both leaders face
**[On screen: Footprint Map, idle — the world map of 200 building markers.]**

> "This is CarbonClarity. It solves a problem two leaders at the same company each own half of — so let me
> set up both."

> "The first is the sustainability lead. The company has made a public commitment — forty percent down by
> 2030 — and the board holds them to it. But just producing this quarter's number is a project: emissions
> sit in spreadsheets pulled from utilities, ERP, and regional offices across fifteen countries, reconciled
> by hand. And nobody can tell the board which investments actually hit forty percent, in what order."

> "The second is the CFO, asked to sign off thirteen-and-a-half million dollars of decarbonization capital
> on instinct, while a rising carbon price quietly turns every unabated tonne into a real liability. Here's
> what it looks like when both of those become live — on the company's own portfolio."

---

## 0:50 – 4:00 — The sustainability path, live

### Where the emissions actually are  (~0:50 – 1:50)
**[The Footprint Map is on screen; click the biggest marker (an Indonesia site).]**
> "This is the whole footprint — two hundred buildings across fifteen countries — sized and coloured by
> emissions, a view that used to live in a workbook. The eye goes straight to the red: the top ten sites
> carry a huge share of the total. Clicking the biggest gives its real breakdown — on-site fuel, purchased
> electricity, the grid factor, green-power coverage, and the single biggest lever for that site. This is
> where to act first."

### The board's real question — the Scenario Planner  (~1:50 – 3:10)
**[Switch to Scenario Planner. Trajectory starts ABOVE the dashed 40%-by-2030 line; budget meter full. Pause 2s.]**
> "Now the question the board actually asks. Here's the emissions trajectory to 2030, and here's the target
> line — and today, it misses. Watch as the capital budget gets spent."

**[Drag Solar PV → 60%.]** > "Rooftop solar across the portfolio — the curve bends, the budget commits."
**[Drag Fleet EV → 50%.]** > "Electrify half the fleet — that removes Scope 1 combustion."
**[Drag Green Power → 40%. Trajectory crosses BELOW target; badge flips ✓.]**
> "And switch grid load to contracted green power — the biggest, cheapest mover. There — the line crosses
> below the target. Forty-one percent by 2030, about S$11.7 million of the budget committed, room to spare."

**[Nudge a lever back to miss, then restore.]**
> "And it's a real engine, not a slideshow — pull a lever back and it misses again, recomputing the whole
> trajectory and the budget every time."

### From plan to board narrative  (~3:10 – 4:00)
**[Click "Generate board summary"; the grounded narrative streams.]**
> "Because this ends as a board conversation, the chosen plan goes to a live model, grounded strictly in
> these computed numbers so it can't drift from the chart. In seconds it produces a board-ready narrative —
> what's funded, that it meets the target, the residual gap, the next move — in the language board minutes
> are written in. No analyst week."

---

## 4:00 – 5:30 — The CFO's money
**[Scroll to the Scenario Planner's "For the CFO & board" section.]**

> "Now the CFO's lens: is this the cheapest route to forty percent, and what does inaction cost? This panel
> ranks every lever by cost per tonne — green power first, around US$750 a tonne, then solar, then fleet
> EV — so the budget buys the cheapest tonnes before the expensive ones. That's capital allocation, not
> guesswork."

**[Point to the Carbon-tax exposure panel.]**
> "And the risk side: at a 2030 carbon price around sixty dollars a tonne, doing nothing carries a real
> annual liability. This plan avoids a recurring carbon cost each year — and a larger amount cumulatively to
> 2030. The decarbonization budget isn't just a cost; it's hedging a financial exposure that only goes up."

**[Click "show how this plan reaches 41%".]**
> "And it's fully transparent — every lever's tonnes and dollars, summed to the total. Nothing hidden."

---

## 5:30 – 7:00 — The business case (time + risk)
**[Switch to Compliance & Reporting — GHG table, GRI/ESRS, "~3 weeks → ~1.2s" banner, Disclosure register.]**

> "The value comes in two currencies a board understands — time and risk. On time: this quarterly report,
> location- and market-based, across five frameworks, used to take weeks of reconciliation across fifteen
> countries. One engine, one click, every number tracing to the same calculation — audit-ready."

**[Point to the Disclosure & assurance register.]**
> "On risk: today GHG Protocol, the SGX report, GRI, ESRS, and IFRS S2 are five separate manual efforts off
> the same source, assured line by line. That fragmentation is the reporting risk — restatements, missed
> filings, qualified assurance — and one reconciled engine collapses it. This isn't a dashboard; it's a
> single source of truth for a board-level, financially-material disclosure, plus a model that tells the CFO
> the cheapest route to a target the sustainability lead has already promised."

---

## 7:00 – 8:10 — How it's built
**[Architecture diagram, or stay on the app.]**

> "Under the hood it's a clean AWS stack: a web front end the sustainability and finance teams share, a
> Python serverless back end on Lambda in Singapore, near-zero idle cost — and it's already deployed and
> live. The endpoints run the real emissions math, aggregate all two hundred buildings, drive the scenario
> engine and the cost-per-tonne and carbon-tax model, and call a live model for the board narrative,
> grounded so it can never contradict the filing. Synthetic data throughout. Built in days."

---

## 8:10 – 9:00 — Close
**[Return to the Scenario Planner, trajectory below target, ✓ badge visible.]**

> "So in this walkthrough, CarbonClarity turned a fifteen-country reporting project into one reconciled
> engine; turned 'which investments hit forty percent by 2030' into a live, on-screen answer; gave the CFO
> the cheapest path to that target and the carbon-tax it hedges; and produced a board-ready disclosure from
> the same numbers. The target is already public — the only question is whether the spend gets steered with
> a model, or guessed. That's CarbonClarity."

**[Hold on the ✓ badge, then stop recording.]**

---

## Click-cue cheat sheet
1. **Open** on Footprint Map, light theme.
2. **Footprint Map:** narrate the markers → click the biggest site → breakdown panel.
3. **Scenario Planner:** Solar 60 → Fleet EV 50 → Green Power 40 → crosses below target (41%, ✓) → nudge a lever to miss → restore → **Generate board summary**.
4. **"For the CFO & board":** MACC "cheapest tonnes first" → carbon-tax exposure → "show how this plan reaches 41%".
5. **Compliance & Reporting:** GHG table → GRI/ESRS → "~3 weeks → ~1.2s" → Disclosure register.
6. **Architecture + close** on the ✓ badge. Record in **light theme**.

## Numbers cheat sheet (verified live)
- **Baseline:** Scope 1+2 **12,000 tCO2e**, Scope 3 **108,000**, **200** buildings, **15** countries; top site ≈ **202 tCO2e** (Indonesia).
- **Hero combo (Solar 60 / Fleet EV 50 / Green Power 40):** **41.0%** by 2030 ✓, committed **~S$11.7M** of **S$13.5M**.
- **MACC:** Green Power ≈ **US$752/t** → Solar ≈ **US$3,091/t** → Fleet EV ≈ **US$4,259/t**. **Carbon price 2030 ≈ US$62/t** (≈US$305k/yr avoided at the hero combo — read the live SGD figure off the panel).
- **Reporting:** multi-framework report **~1.2s** vs **~3 weeks**.

## Delivery notes — it's a recorded voice-over, not a live pitch
- **Narrate to the viewer, third person about the two leaders** — never "you, the CSO/CFO." No one is in the room.
- **The curve-bend + the ✓ is the hero** — let it land; the "pull a lever back to miss" sells that it's real; the carbon-tax panel is the money-on-screen.
- The board summary runs grounded; Bedrock when `USE_BEDROCK=1`. Don't claim "live Bedrock" unless configured.
- Hard cap **10:00**; aim **~9:00**. Rehearse the first and last 30 seconds.
