# CarbonClarity — Executive Pitch & Walkthrough (read-through)

> **⚠️ The recording is a human task** (screen + voice-over) — this is the read-through for it.

**The pitch, not a feature tour — two audiences.** You are an AWS Innovation Hub engineer presenting
*CarbonClarity* to two leaders of a Singapore-listed manufacturer ("Meridian Industries"):

- **The Chief Sustainability Officer (CSO)** — owns the 40%-by-2030 commitment; needs a credible,
  modellable path and a board-ready story.
- **The CFO / board** — owns the **S$13.5M** capital budget and the financial risk; cares about cost per
  tonne, capital sequencing, and the carbon-tax exposure of *not* acting.

The product makes both win: the CSO gets a live path to target; the CFO gets the cheapest route there and
the tax/penalty it avoids. The live demo is the **proof**. All figures **SGD**; emissions **tCO2e**.

**Length:** ~9:00, inside the 10-min cap. **Arc:** shared problem → CSO (the path, live) → CFO/board (the
money) → "is it real?" → business case → why now / ask.

> **Pre-flight:** backend `:8077`, frontend `:5173`, full-screen, **light theme**, open on **Footprint
> Map**. Clean desktop, notifications off, 1080p. Dry-run the three lever drags on the Scenario Planner.

---

## 0:00 – 0:50 — The shared problem (both leaders are losing)
**[On screen: Footprint Map, idle — the world map of 200 building markers.]**

> "Thanks for the time. Two of you are here on purpose — the sustainability lead and the CFO — because
> you're each carrying half of the same problem."

> "You" — *to the CSO* — "made a public commitment: forty percent down by 2030, and the board holds you
> to it. But just *producing* this quarter's number is a project — emissions sit in spreadsheets pulled
> from utilities, ERP, and regional offices across fifteen countries, reconciled by hand. And nobody can
> tell the board *which* investments hit forty percent, in what order."

> "And you" — *to the CFO* — "are being asked to sign off thirteen-and-a-half million dollars of
> decarbonization capital on instinct, while a rising carbon price quietly turns every unabated tonne
> into a real liability. Let me make both of those live — on your own portfolio."

---

## 0:50 – 4:00 — For the CSO: the path, live

### Where your emissions actually are  (~0:50 – 1:50)
**[Footprint Map. Gesture across the markers; click the biggest (an Indonesia site).]**
> "This is your whole footprint — two hundred buildings across fifteen countries — sized and coloured by
> emissions. You've never seen it on a map before; it lived in a workbook. Straight away the eye goes to
> the red: your top ten sites carry a huge share of the total. Click the biggest —" **[site detail opens]**
> "— and you get its real breakdown: on-site fuel, purchased electricity, the grid factor, green-power
> coverage, and the single biggest lever for *that* site. This is where to act first."

### The board's real question — the Scenario Planner  (~1:50 – 3:10)
**[Switch to Scenario Planner. Trajectory starts ABOVE the dashed 40%-by-2030 line; budget meter full. Pause 2s.]**
> "Now the question the board actually asks. Here's your trajectory to 2030, and here's the target line.
> Today, you miss it. Watch as we spend the budget."

**[Drag Solar PV → 60%. Curve bends; budget commits.]** > "Rooftop solar across the portfolio — the curve bends."
**[Drag Fleet EV → 50%.]** > "Electrify half the fleet — that removes Scope 1 combustion."
**[Drag Green Power → 40%. Trajectory crosses BELOW target; badge flips ✓.]**
> "And switch grid load to contracted green power — the biggest, cheapest mover. There — we cross below
> the line. **Forty-one percent by 2030**, about **S$11.7M** of the budget committed, room to spare."

**[Nudge a lever back so it misses, then restore.]**
> "And it's a real engine, not a slideshow — pull a lever back and you miss again; it recomputes the whole
> trajectory *and* the budget every time. This is the model you don't have today."

### From plan to board narrative — instantly  (~3:10 – 4:00)
**[Click "Generate board summary." The grounded AI narrative streams.]**
> "Because this ends as a board conversation, we hand the chosen plan to a live model — grounded strictly
> in these computed numbers, so it can't drift from the chart. In seconds: a board-ready narrative —
> what's funded, that it meets the target, the residual gap, the next move — in the language your board
> minutes are written in. No analyst week."

---

## 4:00 – 5:30 — For the CFO & board: the money
**[Scroll to the Scenario Planner's "For the CFO & board" section.]**

> "Now to you" — *to the CFO*. "Same plan, your lens: is this the *cheapest* way to forty percent, and
> what does inaction cost?"

**[Point to the "Cheapest tonnes first" (MACC) panel.]**
> "This ranks every lever by **cost per tonne** — green power first at about US$750 a tonne, then solar,
> then fleet EV. It tells you the order to buy reductions in, so the budget goes to the cheapest tonnes
> before the expensive ones. That's capital allocation, not guesswork."

**[Point to the Carbon-tax exposure panel.]**
> "And here's the risk side. At a 2030 carbon price around US$60 a tonne, doing nothing carries a real
> annual liability. This plan **avoids about S$X a year**, and roughly **S$Y cumulatively to 2030** —
> that's the tax and penalty you *don't* pay by hitting the target. The decarbonization budget isn't a
> cost line; it's hedging a financial exposure that's only going up."

**[Click "show how this plan reaches 41%".]**
> "And it's fully transparent — every lever's tonnes and dollars, summed to the total. Nothing hidden."

---

## 5:30 – 7:00 — The business case (time + risk + capital)
**[Switch to Compliance & Reporting — GHG table, GRI/ESRS line items, "~3 weeks → ~1.2s" banner, Disclosure register.]**

> "So what's it worth, in the two currencies your board understands — time and risk?"

> "Time: this quarterly report, location- and market-based, across five frameworks, used to take weeks of
> reconciliation across fifteen countries. One engine, one click, every number tracing to the same
> calculation — audit-ready."

**[Point to the Disclosure & assurance register.]**
> "Risk: today GHG Protocol, your SGX report, GRI, ESRS, IFRS S2 are five separate manual efforts off the
> same source, assured line by line. That fragmentation *is* reporting risk — restatements, missed
> filings, qualified assurance. One reconciled engine collapses it. You're buying a single source of truth
> for a board-level, financially-material disclosure — and a model that tells the CFO the cheapest route
> to a target the CSO has already promised."

---

## 7:00 – 8:10 — Why it's low-risk to build (architecture, for execs)
**[ARCHITECTURE.md diagram, or stay on the app.]**

> "What does it take, and how risky? Less than you'd expect — which is why I'm showing a working system.
> A clean AWS stack: a web front end your sustainability and finance teams share, a Python serverless
> back end on Lambda in Singapore, near-zero idle cost, one-command deploy — in fact it's **already live**
> on a public URL. Endpoints run the real emissions math, aggregate all 200 buildings, drive the scenario
> engine and the cost-per-tonne / carbon-tax model, and call a live model for the board narrative —
> grounded so it can never contradict your filing. Synthetic data here; no privacy exposure. Built in
> days; a pilot on your real data is weeks, not quarters."

---

## 8:10 – 9:00 — Close + the ask
**[Return to the Scenario Planner, trajectory below target, ✓ badge visible.]**

> "So here's what we've done. For the sustainability lead: a fifteen-country reporting project became one
> reconciled engine, and 'which investments hit forty percent' became a live conversation. For the CFO:
> the cheapest path to that target, and the carbon-tax exposure it hedges — on screen, defensible."

> "The ask is simple: let us run CarbonClarity against one region of your *real* operations — your actual
> footprint reconciled, your actual options modelled against the 2030 target and your real budget, with a
> board-ready disclosure pack out the other end. If it does on your data what it does here, you've got the
> case to roll it across the group. The target is public; the only question is whether you steer the spend
> with a model — or find out in 2030 whether you guessed right."

**[Hold on the ✓ badge, then stop recording.]**

---

## Click-cue cheat sheet
1. **Open** on Footprint Map, light theme — don't interact during 0:00.
2. **Footprint Map (CSO hero):** gesture across markers → click biggest site → site breakdown panel.
3. **Scenario Planner (CSO hero):** Solar 60 → Fleet EV 50 → Green Power 40 → crosses below target (41%, ✓) → nudge a lever to miss → restore → **Generate board summary**.
4. **"For the CFO & board" section (CFO money):** MACC "cheapest tonnes first" → carbon-tax exposure (avoided/yr + cumulative) → "show how this plan reaches 41%".
5. **Compliance & Reporting:** GHG table → GRI/ESRS → "~3 weeks → ~1.2s" → Disclosure & assurance register.
6. **Architecture** → **Close:** Scenario Planner ✓ badge, pilot ask, hold, stop.
7. **Theme:** sun/moon toggles light/dark — record in **light**.

## Numbers cheat sheet (verified live — should match screen)
- **Baseline:** Scope 1+2 **12,000 tCO2e**, Scope 3 **108,000**, **200** buildings, **15** countries.
- **Footprint map:** top emitter ≈ **202 tCO2e** (Indonesia site); top-10 sites carry a large share.
- **Hero combo (Solar 60 / Fleet EV 50 / Green Power 40):** **41.0%** by 2030 ✓, committed **~S$11.7M** of **S$13.5M** (≈US$8.68M of US$10M).
- **MACC (cheapest first):** Green Power ≈ **US$752/t** → Solar ≈ **US$3,091/t** → Fleet EV ≈ **US$4,259/t**.
- **Carbon tax:** 2030 price ≈ **US$62/t**; the hero plan avoids a recurring annual exposure (read the live SGD figure off the panel; ≈US$305k/yr at the hero combo) plus a cumulative-to-2030 figure.
- **Reporting:** multi-framework report in **~1.2s** vs **~3 weeks**; register lists GHG / SGX / GRI / ESRS / IFRS S2.
- **Note:** budget/money shown SGD (≈1.35× engine USD); emissions math real, factors illustrative.

## Delivery notes
- **Address both leaders out loud** ("to the CSO…" / "to the CFO…") so the two-audience structure is unmistakable. The **Footprint Map** is the opener — let it land before narrating.
- **Stakes early, ask late.** The curve-bend + the ✓ is the hero; the "pull a lever back and miss" sells that it's real; the carbon-tax panel is the CFO's money-on-screen.
- The board summary runs as a **grounded live model**; Bedrock when credentialed (`USE_BEDROCK=1`). Don't claim "live Bedrock" unless configured.
- Hard cap **10:00**; aim **~9:00**. Rehearse the first and last 30 seconds.
