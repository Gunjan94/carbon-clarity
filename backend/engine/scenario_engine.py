"""Decarbonization scenario engine.

Pure, deterministic, network-free function: investment levers -> annual
abatement (tCO2e) + capital cost (USD) -> a year-by-year trajectory to 2030
against the 40%-by-2030 target line, with running budget depletion.

Recomputed on every /scenario call so the chart + budget meter respond live.
"""
from __future__ import annotations

from typing import Dict

# Per-lever economics. Each lever's intensity (0..1) scales linearly to a max
# annual abatement (tCO2e at full deployment) and a max capital cost (USD).
LEVERS = {
    "solar_pct": {
        "label": "Rooftop Solar PV",
        "max_abatement_tco2e": 2200,
        "max_cost_usd": 6_800_000,
        "note": "On-site generation offsets purchased grid electricity (Scope 2).",
    },
    "fleet_ev_pct": {
        "label": "Fleet Electrification",
        "max_abatement_tco2e": 1080,
        "max_cost_usd": 4_600_000,
        "note": "Electrifies fleet vehicles, removing Scope 1 mobile combustion.",
    },
    "supplier_switch_pct": {
        "label": "Green Power Switch",
        "max_abatement_tco2e": 7650,
        "max_cost_usd": 5_750_000,
        "note": "Raises REC coverage; largest, cheapest Scope 2 market-based mover.",
    },
}


def run_scenario(
    baseline_tco2e: float = 12000.0,
    levers: Dict[str, float] | None = None,
    budget_usd: float = 10_000_000.0,
    start_year: int = 2025,
    target_year: int = 2030,
    target_pct: float = 0.40,
) -> Dict:
    levers = levers or {}

    lever_detail = []
    total_annual_abatement = 0.0
    budget_committed = 0.0

    for key, cfg in LEVERS.items():
        v = max(0.0, min(1.0, float(levers.get(key, 0.0))))
        abatement = cfg["max_abatement_tco2e"] * v
        cost = cfg["max_cost_usd"] * v
        total_annual_abatement += abatement
        budget_committed += cost
        lever_detail.append({
            "lever": key,
            "label": cfg["label"],
            "value": round(v, 3),
            "annual_abatement_tco2e": round(abatement, 1),
            "cost_usd": round(cost, 0),
            "note": cfg["note"],
        })

    # Abatement cannot exceed the baseline (can't go below zero emissions).
    total_annual_abatement = min(total_annual_abatement, baseline_tco2e)

    # --- Trajectory: linear deployment ramp from start_year to target_year --
    span = target_year - start_year
    trajectory = []
    for year in range(start_year, target_year + 1):
        progress = (year - start_year) / span if span else 1.0
        tco2e = baseline_tco2e - total_annual_abatement * progress
        trajectory.append({"year": year, "tco2e": round(tco2e, 1)})

    final_tco2e = trajectory[-1]["tco2e"]
    final_reduction_pct = (baseline_tco2e - final_tco2e) / baseline_tco2e if baseline_tco2e else 0.0
    hits_target = final_reduction_pct >= target_pct

    # --- Target line: baseline -> baseline*(1-target_pct) -------------------
    target_endpoint = baseline_tco2e * (1 - target_pct)
    target_line = [
        {"year": start_year, "tco2e": round(baseline_tco2e, 1)},
        {"year": target_year, "tco2e": round(target_endpoint, 1)},
    ]

    budget_remaining = budget_usd - budget_committed

    return {
        "baseline_tco2e": round(baseline_tco2e, 1),
        "target_pct": target_pct,
        "target_year": target_year,
        "start_year": start_year,
        "trajectory": trajectory,
        "target_line": target_line,
        "target_endpoint_tco2e": round(target_endpoint, 1),
        "final_tco2e": round(final_tco2e, 1),
        "final_reduction_pct": round(final_reduction_pct, 4),
        "total_annual_abatement_tco2e": round(total_annual_abatement, 1),
        "hits_target": bool(hits_target),
        "residual_gap_tco2e": round(max(0.0, target_endpoint - final_tco2e) * -1
                                    if final_tco2e <= target_endpoint
                                    else final_tco2e - target_endpoint, 1),
        "budget_usd": budget_usd,
        "budget_committed_usd": round(budget_committed, 0),
        "budget_remaining_usd": round(budget_remaining, 0),
        "over_budget": budget_committed > budget_usd,
        "lever_detail": lever_detail,
    }
