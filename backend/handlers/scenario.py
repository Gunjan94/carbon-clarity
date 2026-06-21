"""/scenario handler -- investment levers -> trajectory to 2030."""
from __future__ import annotations

from typing import Dict

from engine.scenario_engine import run_scenario


def handle(body: Dict) -> Dict:
    return run_scenario(
        baseline_tco2e=float(body.get("baseline_tco2e", 12000.0)),
        levers=body.get("levers", {}) or {},
        budget_usd=float(body.get("budget_usd", 10_000_000.0)),
        start_year=int(body.get("start_year", 2025)),
        target_year=int(body.get("target_year", 2030)),
        target_pct=float(body.get("target_pct", 0.40)),
    )
