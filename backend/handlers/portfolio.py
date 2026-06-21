"""/portfolio handler -- aggregate all 200 buildings into the footprint."""
from __future__ import annotations

from typing import Dict

from engine.data_loader import load_buildings
from engine.emissions import aggregate_portfolio


def handle(params: Dict) -> Dict:
    period = params.get("period", "2025-Q1")
    buildings = load_buildings()
    agg = aggregate_portfolio(buildings)
    agg["period"] = period
    # lightweight site list for the dashboard drill-in (id/country/type only)
    agg["sites"] = [
        {"id": b["id"], "country": b["country"], "type": b["type"],
         "rec_coverage_fraction": b["rec_coverage_fraction"]}
        for b in buildings
    ]
    return agg
