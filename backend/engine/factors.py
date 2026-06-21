"""Emission factors, unit conversions, and country metadata.

All factors are ILLUSTRATIVE / SAMPLE values chosen to be plausible and in the
right order of magnitude for a planning prototype. The *math* is real; the
*factors* are synthetic. Do not use for actual reporting.

Canonical energy unit: kWh.
"""
from __future__ import annotations

# --- Fuel combustion factors (Scope 1), kgCO2e per native unit -------------
# Natural gas billed in m3; diesel & LPG in litres.
FUEL_FACTORS_KGCO2E = {
    "natural_gas": {"factor": 2.02, "unit": "m3"},   # kgCO2e / m3
    "diesel": {"factor": 2.68, "unit": "litre"},      # kgCO2e / litre
    "lpg": {"factor": 1.51, "unit": "litre"},         # kgCO2e / litre
}

# Calorific / energy content for unit conversion to canonical kWh.
ENERGY_CONTENT_KWH = {
    "natural_gas_m3": 10.55,   # kWh per m3 of natural gas
    "diesel_litre": 10.0,      # kWh per litre diesel
    "lpg_litre": 7.08,         # kWh per litre LPG
}

# Generic energy unit conversions to kWh.
ENERGY_TO_KWH = {
    "kWh": 1.0,
    "MWh": 1000.0,
    "GWh": 1_000_000.0,
    "GJ": 277.78,
}


def convert_energy(value: float, from_unit: str, to_unit: str = "kWh") -> float:
    """Table-driven energy conversion. Rounds only at display time (not here)."""
    if from_unit not in ENERGY_TO_KWH:
        raise ValueError(f"Unknown energy unit: {from_unit}")
    if to_unit not in ENERGY_TO_KWH:
        raise ValueError(f"Unknown energy unit: {to_unit}")
    kwh = value * ENERGY_TO_KWH[from_unit]
    return kwh / ENERGY_TO_KWH[to_unit]


# --- Country grid factors (Scope 2) ----------------------------------------
# grid_factor: location-based grid average, kgCO2e/kWh
# residual_mix_factor: market-based residual mix (after contractual instruments
#   are stripped out of the grid), kgCO2e/kWh -- typically >= grid average.
# currency / fx_to_usd: 1 unit local currency = fx_to_usd USD.
COUNTRIES = {
    "SG": {"name": "Singapore",     "grid_factor": 0.408, "residual_mix_factor": 0.430, "currency": "SGD", "fx_to_usd": 0.74},
    "MY": {"name": "Malaysia",      "grid_factor": 0.585, "residual_mix_factor": 0.610, "currency": "MYR", "fx_to_usd": 0.21},
    "TH": {"name": "Thailand",      "grid_factor": 0.513, "residual_mix_factor": 0.540, "currency": "THB", "fx_to_usd": 0.028},
    "VN": {"name": "Vietnam",       "grid_factor": 0.620, "residual_mix_factor": 0.650, "currency": "VND", "fx_to_usd": 0.000041},
    "ID": {"name": "Indonesia",     "grid_factor": 0.760, "residual_mix_factor": 0.790, "currency": "IDR", "fx_to_usd": 0.000063},
    "PH": {"name": "Philippines",   "grid_factor": 0.650, "residual_mix_factor": 0.680, "currency": "PHP", "fx_to_usd": 0.017},
    "IN": {"name": "India",         "grid_factor": 0.710, "residual_mix_factor": 0.740, "currency": "INR", "fx_to_usd": 0.012},
    "CN": {"name": "China",         "grid_factor": 0.555, "residual_mix_factor": 0.580, "currency": "CNY", "fx_to_usd": 0.14},
    "JP": {"name": "Japan",         "grid_factor": 0.450, "residual_mix_factor": 0.475, "currency": "JPY", "fx_to_usd": 0.0064},
    "KR": {"name": "South Korea",   "grid_factor": 0.436, "residual_mix_factor": 0.460, "currency": "KRW", "fx_to_usd": 0.00073},
    "AU": {"name": "Australia",     "grid_factor": 0.660, "residual_mix_factor": 0.690, "currency": "AUD", "fx_to_usd": 0.66},
    "DE": {"name": "Germany",       "grid_factor": 0.350, "residual_mix_factor": 0.420, "currency": "EUR", "fx_to_usd": 1.08},
    "US": {"name": "United States", "grid_factor": 0.385, "residual_mix_factor": 0.410, "currency": "USD", "fx_to_usd": 1.00},
    "GB": {"name": "United Kingdom","grid_factor": 0.207, "residual_mix_factor": 0.280, "currency": "GBP", "fx_to_usd": 1.27},
    "BR": {"name": "Brazil",        "grid_factor": 0.120, "residual_mix_factor": 0.180, "currency": "BRL", "fx_to_usd": 0.18},
}

COUNTRY_CODES = list(COUNTRIES.keys())
