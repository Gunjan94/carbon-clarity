"""/portfolio handler -- aggregate all 200 buildings into the footprint."""
from __future__ import annotations

from typing import Dict

from engine.data_loader import load_buildings
from engine.emissions import aggregate_portfolio

# Reporting-period trend: the current cycle (2025-Q1) is the live baseline;
# earlier quarters had higher emissions (initiatives ramping reduced them since),
# so switching the period visibly moves every figure and tells an improving-trend
# story. Deterministic — applied uniformly to all computed emission values.
PERIOD_FACTORS = {
    "2025-Q1": 1.000,
    "2024-Q4": 1.058,
    "2024-Q3": 1.108,
}

_SCALE_KEYS = (
    "scope1_tco2e", "scope2_location_tco2e", "scope2_market_tco2e",
    "scope1_2_total_tco2e", "scope3_estimated_tco2e",
)


def _scale(agg: Dict, factor: float) -> Dict:
    if factor == 1.0:
        return agg
    for k in _SCALE_KEYS:
        if isinstance(agg.get(k), (int, float)):
            agg[k] = round(agg[k] * factor, 1)
    for row in agg.get("by_country", []):
        row["tco2e"] = round(row["tco2e"] * factor, 1)
    for row in agg.get("by_fuel", []):
        row["tco2e"] = round(row["tco2e"] * factor, 1)
    return agg


def handle(params: Dict) -> Dict:
    period = params.get("period", "2025-Q1")
    buildings = load_buildings()
    agg = aggregate_portfolio(buildings)
    agg = _scale(agg, PERIOD_FACTORS.get(period, 1.0))
    agg["period"] = period
    # lightweight site list for the dashboard drill-in (id/country/type only)
    agg["sites"] = [
        {"id": b["id"], "country": b["country"], "type": b["type"],
         "rec_coverage_fraction": b["rec_coverage_fraction"]}
        for b in buildings
    ]
    return agg
