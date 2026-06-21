"""Deterministic synthetic data generator (seed=42).

Produces:
  data/buildings.json       200 buildings across 15 countries
  data/factors.json         emission factors + country metadata (mirrors factors.py)
  data/hero_portfolio.json  the seeded hero portfolio (= buildings + hero lever combo)

The raw activity is generated randomly (seed=42) then NORMALIZED by a single
scalar per stream so the portfolio aggregates to the brief's hero numbers:
  Scope 1+2 (market-based) == 12,000 tCO2e
  Scope 3 (estimated)      == 108,000 tCO2e

This is honest tuning: every per-site number is still computed by the real
engine from real rows; we only scale the synthetic activity inputs so the
total lands on the customer's actual baseline. The scalars are written into
build output for transparency.
"""
from __future__ import annotations

import json
import os
import random
import sys

# Allow running as a plain script: import the engine from ../backend
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "backend"))

from engine.factors import COUNTRIES, COUNTRY_CODES, FUEL_FACTORS_KGCO2E, ENERGY_CONTENT_KWH, ENERGY_TO_KWH  # noqa: E402
from engine.emissions import aggregate_portfolio, calculate_site  # noqa: E402

SEED = 42
N_BUILDINGS = 200
TARGET_S1_2 = 12000.0     # tCO2e Scope 1+2 (market-based)
TARGET_S3 = 108000.0      # tCO2e estimated Scope 3

TYPES = ["office", "factory", "warehouse", "dc"]
# Relative activity weight by type (factories & data centres dominate).
TYPE_WEIGHTS = {
    "office":    {"grid": 0.6, "gas": 0.4, "diesel": 0.3, "fleet": 0.5, "spend": 0.7},
    "factory":   {"grid": 1.6, "gas": 2.2, "diesel": 1.4, "fleet": 1.3, "spend": 1.8},
    "warehouse": {"grid": 0.8, "gas": 0.3, "diesel": 0.6, "fleet": 1.0, "spend": 0.6},
    "dc":        {"grid": 2.4, "gas": 0.1, "diesel": 0.8, "fleet": 0.2, "spend": 0.9},
}


def gen_raw():
    rng = random.Random(SEED)
    # country distribution: SG (HQ) heaviest, then APAC manufacturing footprint
    country_pop = (
        ["SG"] * 34 + ["MY"] * 20 + ["TH"] * 16 + ["VN"] * 14 + ["ID"] * 14 +
        ["PH"] * 12 + ["IN"] * 16 + ["CN"] * 18 + ["JP"] * 12 + ["KR"] * 10 +
        ["AU"] * 8 + ["DE"] * 4 + ["US"] * 4 + ["GB"] * 4 + ["BR"] * 4
    )
    # pad/trim to exactly N
    rng.shuffle(country_pop)
    country_pop = (country_pop * 2)[:N_BUILDINGS]

    counters = {c: 0 for c in COUNTRY_CODES}
    buildings = []
    for i in range(N_BUILDINGS):
        country = country_pop[i]
        counters[country] += 1
        btype = rng.choices(TYPES, weights=[3, 3, 2, 1])[0]
        w = TYPE_WEIGHTS[btype]
        floor = int(rng.uniform(2_000, 45_000) * (1.4 if btype in ("factory", "dc") else 1.0))

        grid_kwh = rng.uniform(180_000, 1_400_000) * w["grid"]
        natural_gas_m3 = rng.uniform(0, 90_000) * w["gas"]
        diesel_litres = rng.uniform(0, 9_000) * w["diesel"]          # stationary/backup
        fleet_diesel_litres = rng.uniform(0, 22_000) * w["fleet"]    # fleet
        # baseline REC coverage is low (most ~0-0.2)
        rec = round(rng.choices([0.0, 0.05, 0.10, 0.20, 0.35],
                                weights=[40, 25, 20, 10, 5])[0], 3)
        # spend stored in LOCAL currency to demonstrate FX reconciliation
        fx = COUNTRIES[country]["fx_to_usd"]
        spend_usd = rng.uniform(2_000_000, 60_000_000) * w["spend"]
        annual_spend_local = spend_usd / fx
        eligible_solar_kwh = grid_kwh * rng.uniform(0.25, 0.70)

        buildings.append({
            "id": f"{country}-{counters[country]:03d}",
            "country": country,
            "type": btype,
            "floor_area_m2": floor,
            "grid_kwh": grid_kwh,
            "natural_gas_m3": natural_gas_m3,
            "diesel_litres": diesel_litres,
            "fleet_diesel_litres": fleet_diesel_litres,
            "lpg_litres": 0.0,
            "rec_coverage_fraction": rec,
            "annual_spend_local": annual_spend_local,
            "currency": COUNTRIES[country]["currency"],
            "fx_to_usd": fx,
            "annual_spend_usd": annual_spend_local * fx,   # loader-style conversion
            "eligible_solar_kwh": eligible_solar_kwh,
            # placeholder, set after normalization
            "scope3_intensity_kgco2e_per_usd": 0.0,
        })
    return buildings


def normalize(buildings):
    """Scale activity streams so the portfolio lands on the hero numbers."""
    # --- Scope 1+2: scale grid + fuel activity by one scalar ----------------
    # First compute unscaled Scope1+2 with a placeholder S3 intensity.
    for b in buildings:
        b["scope3_intensity_kgco2e_per_usd"] = 0.0
    agg = aggregate_portfolio(buildings)
    s1_2_raw = agg["scope1_2_total_tco2e"]
    k = TARGET_S1_2 / s1_2_raw
    for b in buildings:
        for f in ("grid_kwh", "natural_gas_m3", "diesel_litres",
                  "fleet_diesel_litres", "eligible_solar_kwh"):
            b[f] *= k

    # --- Scope 3: choose a single intensity so total spend lands at 108k ----
    total_spend = sum(b["annual_spend_usd"] for b in buildings)
    # tCO2e = spend * intensity / 1000  => intensity = TARGET_S3*1000 / total_spend
    intensity = TARGET_S3 * 1000.0 / total_spend
    for b in buildings:
        b["scope3_intensity_kgco2e_per_usd"] = intensity

    return buildings, {"s1_2_scalar": k, "scope3_intensity": intensity}


def write_factors():
    out = {
        "note": "Illustrative sample emission factors. The math is real; the factors are synthetic.",
        "fuel_factors_kgco2e": FUEL_FACTORS_KGCO2E,
        "energy_content_kwh": ENERGY_CONTENT_KWH,
        "energy_to_kwh": ENERGY_TO_KWH,
        "countries": COUNTRIES,
    }
    with open(os.path.join(HERE, "factors.json"), "w") as f:
        json.dump(out, f, indent=2)


def main():
    buildings = gen_raw()
    buildings, scalars = normalize(buildings)

    # round activity for clean JSON (round-trip safe; engine rounds at display)
    for b in buildings:
        for f in ("grid_kwh", "natural_gas_m3", "diesel_litres",
                  "fleet_diesel_litres", "eligible_solar_kwh",
                  "annual_spend_local", "annual_spend_usd"):
            b[f] = round(b[f], 2)
        b["floor_area_m2"] = int(b["floor_area_m2"])

    with open(os.path.join(HERE, "buildings.json"), "w") as f:
        json.dump(buildings, f, indent=2)
    write_factors()

    hero = {
        "name": "Hero Portfolio (seeded)",
        "description": "$3B Singapore-HQ manufacturer. 200 buildings / 15 countries.",
        "hero_lever_combo": {"solar_pct": 0.60, "fleet_ev_pct": 0.50, "supplier_switch_pct": 0.40},
        "normalization_scalars": scalars,
        "buildings": buildings,
    }
    with open(os.path.join(HERE, "hero_portfolio.json"), "w") as f:
        json.dump(hero, f, indent=2)

    agg = aggregate_portfolio(buildings)
    print(f"Generated {len(buildings)} buildings / {agg['country_count']} countries")
    print(f"  Scope 1:            {agg['scope1_tco2e']:>10,.1f} tCO2e")
    print(f"  Scope 2 location:   {agg['scope2_location_tco2e']:>10,.1f} tCO2e")
    print(f"  Scope 2 market:     {agg['scope2_market_tco2e']:>10,.1f} tCO2e")
    print(f"  Scope 1+2 (market): {agg['scope1_2_total_tco2e']:>10,.1f} tCO2e  (target 12,000)")
    print(f"  Scope 3 estimated:  {agg['scope3_estimated_tco2e']:>10,.1f} tCO2e  (target 108,000)")
    print(f"  scalars: {scalars}")


if __name__ == "__main__":
    main()
