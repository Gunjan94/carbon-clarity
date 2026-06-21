# CarbonClarity — Executive Pitch & Walkthrough (read-through)

**The pitch, not a feature tour.** You are an AWS Innovation Hub engineer presenting to the
**CEO / CFO of a Singapore-listed manufacturer** ("Meridian Industries"). The prototype —
*Meridian Industries · CarbonClarity* — is the **proof** inside the pitch. Every line is spoken
*to that executive*, about *their* board target, *their* reporting burden, *their* capital
budget. The live demo exists to prove the claim is real.

**Length:** ~8:30 spoken, inside the 10-min cap. **Arc:** their problem → the stakes → the idea →
live proof → the business case → why now / the ask. All figures **SGD**; emissions in **tCO2e**.

**How to use this:** read the quoted lines aloud, unhurried. **[Bracketed bold]** = what to click.
Numbers below are the live seeded values and will match the screen.

> **Pre-flight:** backend `:8077`, frontend `:5173`, full-screen at the dev URL, open on the
> **Baseline Dashboard** in **light theme**. Clean desktop, notifications off, 1080p. Dry-run the
> three lever drags on the Scenario Planner so the curve-bend is smooth.

---

## 0:00 – 0:50 — Open in *their* world (the cost of the status quo)
**[On screen: Baseline Dashboard, idle. KPI row: 12,000 tCO2e Scope 1+2 · 108,000 Scope 3 · 200 buildings · 15 countries.]**

> "Thanks for the time. You've made a public commitment — a forty percent cut in emissions by
> 2030 — and your board is holding you to it. So let me start with the two problems I think you
> live with every reporting cycle, because they're both expensive."

> "First: just *producing* the number is a project. Your carbon footprint sits in spreadsheets
> pulled from utilities, ERP systems, and regional offices across fifteen countries — reconciled
> by hand, across currencies and units, every quarter. Second, and worse: when the board asks
> *'which investments actually hit forty percent, and in what order?'* — nobody can answer with
> confidence, because there's no model. You're allocating a thirteen-and-a-half-million-dollar
> capital budget on instinct. Let me show you what it looks like when both of those become live."

---

## 0:50 – 4:30 — The proof: a live, working system

### Your footprint, computed — not a static chart  (~0:50 – 2:00)
**[Hover the by-country bar chart, then the location-vs-market Scope 2 comparison.]**
> "Everything here is computed live. Twelve thousand tonnes, broken down by country and by fuel.
> And here's the distinction most tools get wrong — and the one your auditors care about most:
> location-based versus market-based Scope 2. Location uses the grid average; market-based credits
> the green-power contracts your sites have already signed. The gap between those two bars is
> exactly what your team spends weeks reconciling by hand."

**[Click a single site (e.g. an SG building); show the breakdown rows — fuel, activity, factor, tCO2e.]**
> "Drill into one building and you see the math itself — fuel volume, emission factor, the
> conversion, the tonnes. Let me change an input —"

**[Edit the grid-kWh override on that site; the site total and the portfolio number both update.]**
> "— and it recomputes. Nothing here is hard-coded. This is your actual emissions calculation,
> running, at the level an auditor would test it."

### The board's real question — the Scenario Planner  (~2:00 – 3:40)
**[Switch to Scenario Planner. Trajectory starts ABOVE the dashed 40%-by-2030 target line; budget meter full. Pause 2s on the gap.]**
> "Now the question the board actually cares about. Here's your emissions trajectory to 2030, and
> here's the target line. Today, you miss it. Watch what happens as we spend the capital budget."

**[Drag Solar PV to 60%. Curve bends down; budget commits; lever detail shows abatement + cost.]**
> "Roll out rooftop solar across the portfolio — the curve bends, and part of the budget commits."

**[Drag Fleet EV to 50%.]**
> "Electrify half the fleet — that removes Scope 1 mobile combustion."

**[Drag Green Power Switch to 40%. Trajectory crosses BELOW the target line; badge flips to ✓.]**
> "And switch forty percent of grid load to contracted green power — the single biggest, cheapest
> mover on a market-based basis. There it is: we cross below the target. Forty-one percent by 2030,
> and we've committed about eight-point-seven million dollars, leaving room to spare in the budget."

**[Nudge a lever back down so it misses again, then restore it.]**
> "And this is real, not a slideshow — pull a lever back and you miss the target again. The engine
> recomputes the entire trajectory *and* the budget every time. This is the model you don't have today."

### From plan to board narrative — instantly  (~3:40 – 4:30)
**[Click "Generate board summary." The grounded AI narrative streams into the panel.]**
> "And because this ends as a board conversation, we hand the chosen plan to Amazon Bedrock —
> Claude — grounded strictly in these computed numbers, so it can't drift from the chart."

**[Let it finish; paraphrase the key line.]**
> "In seconds: a board-ready narrative — what the plan funds, that it meets the target, the residual
> gap, and the highest-leverage next move. The same numbers you just saw, in the language your
> board minutes are written in. No analyst week."

---

## 4:30 – 6:00 — The business case (speak to the P&L and the risk)
**[Switch to Compliance & Reporting. Show the GHG Protocol table, GRI/ESRS line items, the "~3 weeks → ~1.2s" banner, then scroll to the Disclosure & assurance register.]**

> "So let's talk about what this is worth, in two currencies your board understands: time and risk."

> "On time — this quarterly report, location- and market-based, across multiple frameworks, used to
> take weeks of reconciliation across fifteen countries. One engine, one click, and every number
> traces back to the same calculation, so it's audit-ready."

**[Point to the Disclosure & assurance register — the framework rows with statuses and legacy effort.]**
> "And on risk — here's your disclosure register: GHG Protocol, your SGX sustainability report,
> GRI, ESRS, IFRS S2. Today each of these is a separate manual effort, re-keyed from the same
> source, weeks apart, and assured by auditors line by line. That fragmentation *is* your reporting
> risk — restatements, missed filings, qualified assurance. CarbonClarity produces all of them from
> one reconciled calculation. You're not buying a dashboard; you're buying a single source of truth
> for a board-level, financially-material disclosure."

> "And the capital case writes itself: you have a thirteen-and-a-half-million-dollar decarbonization
> budget and a hard 2030 target. The difference between guessing and modelling that spend is
> whether you hit the target on budget — or explain to the board why you missed."

---

## 6:00 – 7:15 — Why it's low-risk to do (architecture, framed for a CEO)
**[Show the ARCHITECTURE.md diagram, or stay on the app.]**

> "Your fair question is what it takes to build, and how risky it is. The honest answer is far less
> than you'd expect — which is the point of showing you a working system instead of slides."

> "It's a clean, modern AWS stack. A web front end your sustainability and finance teams use, and a
> Python serverless back end — Lambda behind API Gateway, deployed with one command, in Singapore,
> your home region, at essentially zero cost when idle. Four endpoints: one runs the real emissions
> math, one aggregates all two hundred buildings, one is the scenario engine you just watched, and
> one calls Bedrock for the board narrative — grounded in the numbers so it can never contradict
> your filing. It runs entirely on synthetic data here — no real data, no privacy exposure in the
> prototype. We built this proof in days. On your real data, a focused pilot is weeks, not quarters."

---

## 7:15 – 8:15 — Close + the ask
**[Return to the Scenario Planner, trajectory below target, hits-target ✓ badge visible.]**

> "So here's what we've done in this short time. We turned a fifteen-country reporting project into
> one reconciled, audit-ready engine. We turned 'which investments hit forty percent by 2030' from a
> six-week analysis into a conversation you can have live, in the room. And we turned the board
> narrative into a thirty-second generation grounded in the real numbers."

> "What I'd propose is simple: let us run CarbonClarity against one region of your *real* operations
> in a focused pilot. You'll see your actual footprint reconciled, your actual investment options
> modelled against the 2030 target and your real budget, and a board-ready disclosure pack out the
> other end. If the pilot does on your data what this prototype does, you'll have the business case
> to roll it across the group."

> "The target is already public. The only open question is whether you'll steer the spend with a
> model — or find out in 2030 whether you guessed right. That's CarbonClarity. I'd love to scope the
> pilot with your team."

**[Hold on the hits-target ✓ badge for a beat, then stop recording.]**

---

## Click-cue cheat sheet
1. **Open** on Baseline Dashboard, light theme — don't interact during the 0:00 framing.
2. **Baseline:** by-country chart → location-vs-market bars → click a site → edit grid-kWh → totals recompute.
3. **Scenario Planner (hero):** Solar 60% → Fleet EV 50% → Green Power 40% → crosses below target (41%, ✓) → nudge a lever back to miss → restore.
4. **AI board summary:** click Generate → let it stream.
5. **Compliance & Reporting:** GHG table → GRI/ESRS → "~3 weeks → ~1.2s" banner → **Disclosure & assurance register** (the risk beat).
6. **Architecture:** diagram or stay on app while narrating.
7. **Close:** Scenario Planner with ✓ badge — deliver the pilot ask, hold, stop.
8. **Theme:** sun/moon button (top-right) toggles light/dark — record in **light**.

## Numbers cheat sheet (verified live — should match screen)
- **Baseline:** Scope 1+2 **12,000 tCO2e**, Scope 3 **108,000 tCO2e**, **200** buildings, **15** countries.
- **Hero combo (Solar 60 / Fleet EV 50 / Green Power 40):** **41.0%** reduction by 2030 ✓, committed **~S$11.7M** of the **S$13.5M** budget (≈US$8.68M of US$10M), target hit.
- **Reporting:** multi-framework report generated in **~1.2s** vs **~3 weeks** manual; disclosure register lists GHG Protocol / SGX / GRI / ESRS / IFRS S2.
- **Note:** budget shown in SGD (≈1.35× the engine's USD figures); emissions math is real, factors illustrative.

## Delivery notes — this is a pitch, perform it like one
- **Talk to the CEO/CFO, not the screen.** Tie every number to *their* board target, reporting risk, and capital budget.
- **Stakes early, ask late.** Open on the cost of the status quo; close on a concrete regional pilot.
- **The curve-bend is the hero beat** — let it land; pause on the ✓. The "pull a lever back and miss" move sells that it's real.
- Architecture is reassurance ("low-risk, fast, audit-ready"), not a tech lecture.
- The AI runs as a **grounded narrative**; if asked, it streams live on Bedrock when AWS creds + model access are configured (`USE_BEDROCK=1`) — today it serves the grounded offline narrative. **Don't claim "live Bedrock" unless it's actually configured.**
- Hard cap **10:00**; aim for **~8:15**. Rehearse the **first and last 30 seconds**.
