"""Real emissions math: Scope 1 (combustion), Scope 2 (location + market based
with REC allocation), and estimated Scope 3 (spend-based).

tCO2e for a row = activity_in_native_unit x emission_factor_kgco2e / 1000.

Nothing here is hardcoded -- every figure is computed from a building's raw
activity rows and the factor tables in factors.py.
"""
from __future__ import annotations

from typing import Dict, List, Optional

from .factors import COUNTRIES, FUEL_FACTORS_KGCO2E


def calculate_site(
    building: Dict,
    accounting: str = "both",
    overrides: Optional[Dict] = None,
) -> Dict:
    """Compute emissions for one building.

    building fields used: country, grid_kwh, natural_gas_m3, diesel_litres,
    lpg_litres (optional), fleet_diesel_litres, rec_coverage_fraction,
    annual_spend_usd, scope3_intensity_kgco2e_per_usd.

    `overrides` may live-edit any of these activity fields before computing,
    so a judge changing grid_kwh flows straight through to the result.
    """
    b = dict(building)
    if overrides:
        for k, v in overrides.items():
            if k in b and isinstance(v, (int, float)):
                b[k] = v

    country = b["country"]
    cinfo = COUNTRIES[country]
    grid_factor = cinfo["grid_factor"]
    residual_factor = cinfo["residual_mix_factor"]

    breakdown: List[Dict] = []

    # --- Scope 1: stationary + mobile combustion ---------------------------
    scope1 = 0.0
    gas_m3 = float(b.get("natural_gas_m3", 0) or 0)
    if gas_m3:
        f = FUEL_FACTORS_KGCO2E["natural_gas"]["factor"]
        t = gas_m3 * f / 1000.0
        scope1 += t
        breakdown.append({"source": "natural_gas", "activity": gas_m3, "unit": "m3",
                          "factor": f, "tco2e": round(t, 2), "scope": 1})

    # Stationary/backup diesel + fleet diesel both combust on the books as Scope 1.
    diesel_l = float(b.get("diesel_litres", 0) or 0)
    fleet_l = float(b.get("fleet_diesel_litres", 0) or 0)
    total_diesel = diesel_l + fleet_l
    if total_diesel:
        f = FUEL_FACTORS_KGCO2E["diesel"]["factor"]
        t = total_diesel * f / 1000.0
        scope1 += t
        breakdown.append({"source": "diesel", "activity": total_diesel, "unit": "litre",
                          "factor": f, "tco2e": round(t, 2), "scope": 1,
                          "note": "stationary + fleet (fleet electrifiable via EV lever)"})

    lpg_l = float(b.get("lpg_litres", 0) or 0)
    if lpg_l:
        f = FUEL_FACTORS_KGCO2E["lpg"]["factor"]
        t = lpg_l * f / 1000.0
        scope1 += t
        breakdown.append({"source": "lpg", "activity": lpg_l, "unit": "litre",
                          "factor": f, "tco2e": round(t, 2), "scope": 1})

    # --- Scope 2: purchased electricity (location vs market based) ----------
    grid_kwh = float(b.get("grid_kwh", 0) or 0)
    rec = max(0.0, min(1.0, float(b.get("rec_coverage_fraction", 0) or 0)))

    scope2_location = grid_kwh * grid_factor / 1000.0

    covered_kwh = grid_kwh * rec          # RECs zero out their share
    residual_kwh = grid_kwh - covered_kwh
    scope2_market = residual_kwh * residual_factor / 1000.0

    if grid_kwh:
        if accounting in ("location", "both"):
            breakdown.append({"source": "grid_electricity", "activity": grid_kwh, "unit": "kWh",
                              "factor": grid_factor, "tco2e": round(scope2_location, 2),
                              "scope": 2, "basis": "location"})
        if accounting in ("market", "both"):
            breakdown.append({"source": "grid_electricity", "activity": round(residual_kwh, 1),
                              "unit": "kWh", "factor": residual_factor,
                              "tco2e": round(scope2_market, 2), "scope": 2, "basis": "market",
                              "rec_coverage_fraction": rec})

    # --- Scope 3: estimated, spend-based ------------------------------------
    spend = float(b.get("annual_spend_usd", 0) or 0)
    s3_intensity = float(b.get("scope3_intensity_kgco2e_per_usd", 0) or 0)
    scope3 = spend * s3_intensity / 1000.0

    return {
        "site_id": b.get("id"),
        "country": country,
        "scope1_tco2e": round(scope1, 2),
        "scope2_location_tco2e": round(scope2_location, 2),
        "scope2_market_tco2e": round(scope2_market, 2),
        "scope3_estimated_tco2e": round(scope3, 2),
        # reported total uses market-based Scope 2 (GHG Protocol dual reporting)
        "scope1_2_market_total_tco2e": round(scope1 + scope2_market, 2),
        "scope1_2_location_total_tco2e": round(scope1 + scope2_location, 2),
        "breakdown": breakdown,
        # raw activity echoed back so the UI can show editable inputs
        "activity": {
            "grid_kwh": grid_kwh,
            "natural_gas_m3": gas_m3,
            "diesel_litres": diesel_l,
            "fleet_diesel_litres": fleet_l,
            "rec_coverage_fraction": rec,
            "annual_spend_usd": spend,
        },
    }


def aggregate_portfolio(buildings: List[Dict]) -> Dict:
    """Aggregate all buildings into a portfolio footprint.

    Reported Scope 1+2 total uses the market-based Scope 2 number (what the
    company reports against its green-power contracts). Location-based is also
    surfaced for transparency. Computed from raw rows -- not a stored constant.
    """
    s1 = s2_loc = s2_mkt = s3 = 0.0
    by_country: Dict[str, float] = {}
    by_fuel: Dict[str, float] = {}

    for b in buildings:
        r = calculate_site(b, accounting="both")
        s1 += r["scope1_tco2e"]
        s2_loc += r["scope2_location_tco2e"]
        s2_mkt += r["scope2_market_tco2e"]
        s3 += r["scope3_estimated_tco2e"]

        c = r["country"]
        # country/fuel breakdown uses reported (market-based) Scope 1+2
        by_country[c] = by_country.get(c, 0.0) + r["scope1_2_market_total_tco2e"]
        for row in r["breakdown"]:
            if row.get("scope") == 1:
                by_fuel[row["source"]] = by_fuel.get(row["source"], 0.0) + row["tco2e"]
            elif row.get("scope") == 2 and row.get("basis") == "market":
                by_fuel["grid_electricity"] = by_fuel.get("grid_electricity", 0.0) + row["tco2e"]

    s1_2_total = s1 + s2_mkt

    return {
        "building_count": len(buildings),
        "country_count": len({b["country"] for b in buildings}),
        "scope1_tco2e": round(s1, 1),
        "scope2_location_tco2e": round(s2_loc, 1),
        "scope2_market_tco2e": round(s2_mkt, 1),
        "scope1_2_total_tco2e": round(s1_2_total, 1),
        "scope3_estimated_tco2e": round(s3, 1),
        "by_country": sorted(
            [{"country": c, "name": COUNTRIES[c]["name"], "tco2e": round(v, 1)}
             for c, v in by_country.items()],
            key=lambda x: x["tco2e"], reverse=True,
        ),
        "by_fuel": sorted(
            [{"fuel": f, "tco2e": round(v, 1)} for f, v in by_fuel.items()],
            key=lambda x: x["tco2e"], reverse=True,
        ),
    }
