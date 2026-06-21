"""/calculate handler -- emissions for one site/period.

Structured as a plain function so it can become a Lambda later. The FastAPI
app and a future Lambda both call handle().
"""
from __future__ import annotations

from typing import Dict

from engine.data_loader import get_building
from engine.emissions import calculate_site


def handle(body: Dict) -> Dict:
    site_id = body.get("site_id")
    accounting = body.get("accounting", "both")
    overrides = body.get("overrides") or {}

    building = get_building(site_id)
    if building is None:
        return {"error": f"site_id not found: {site_id}", "status": 404}

    # clamp overrides to sane non-negative ranges so a wild input can't NaN the chart
    clean = {}
    for k, v in overrides.items():
        if isinstance(v, (int, float)) and v >= 0:
            clean[k] = float(v)

    result = calculate_site(building, accounting=accounting, overrides=clean)
    result["period"] = body.get("period", "2025-Q1")
    result["accounting"] = accounting
    return result
