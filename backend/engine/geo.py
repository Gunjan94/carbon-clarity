"""Geographic placement for the building map.

The 200 synthetic buildings carry a country code but no coordinates. This module
places each building at a deterministic point near its country's main commercial
hub (a small, stable jitter so multiple buildings in one country spread out
rather than stacking on a single pixel), and produces per-site map rows with the
*computed* Scope 1+2 footprint so the map can size/colour markers by real
emissions and drill into a site.

Deterministic: same building id always lands on the same coordinate.
"""
from __future__ import annotations

from typing import Dict, List

from .emissions import calculate_site
from .factors import COUNTRIES

# Approximate lat/lng of each country's main commercial hub (where a regional
# building portfolio would cluster). Synthetic placement for visualisation only.
COUNTRY_CENTROIDS: Dict[str, tuple[float, float]] = {
    "SG": (1.3521, 103.8198),    # Singapore
    "MY": (3.1390, 101.6869),    # Kuala Lumpur
    "TH": (13.7563, 100.5018),   # Bangkok
    "VN": (10.8231, 106.6297),   # Ho Chi Minh City
    "ID": (-6.2088, 106.8456),   # Jakarta
    "PH": (14.5995, 120.9842),   # Manila
    "IN": (19.0760, 72.8777),    # Mumbai
    "CN": (31.2304, 121.4737),   # Shanghai
    "JP": (35.6762, 139.6503),   # Tokyo
    "KR": (37.5665, 126.9780),   # Seoul
    "AU": (-33.8688, 151.2093),  # Sydney
    "DE": (52.5200, 13.4050),    # Berlin
    "US": (40.7128, -74.0060),   # New York
    "GB": (51.5074, -0.1278),    # London
    "BR": (-23.5505, -46.6333),  # Sao Paulo
}

# A roomy default view that fits both Asia-Pacific and the few EU/US/BR sites.
MAP_CENTER = (18.0, 95.0)
MAP_ZOOM = 3


def _hash(s: str) -> int:
    """FNV-1a 32-bit — stable across runs/machines."""
    h = 2166136261
    for ch in s:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    return h


def site_coord(site_id: str, country: str) -> tuple[float, float]:
    """Deterministic point near the country hub (jitter ±~0.8°)."""
    lat0, lng0 = COUNTRY_CENTROIDS.get(country, MAP_CENTER)
    h = _hash(site_id + "geo")
    jlat = (((h >> 4) % 1000) / 1000 - 0.5) * 1.6
    jlng = (((h >> 14) % 1000) / 1000 - 0.5) * 1.6
    return round(lat0 + jlat, 4), round(lng0 + jlng, 4)


def build_site_map(buildings: List[Dict]) -> Dict:
    """Per-site rows for the map + list: computed Scope 1+2, coords, type, country."""
    rows: List[Dict] = []
    for b in buildings:
        r = calculate_site(b, accounting="both")
        lat, lng = site_coord(b["id"], b["country"])
        rows.append(
            {
                "id": b["id"],
                "country": b["country"],
                "country_name": COUNTRIES[b["country"]]["name"],
                "type": b.get("type", "site"),
                "lat": lat,
                "lng": lng,
                "scope1_tco2e": r["scope1_tco2e"],
                "scope2_market_tco2e": r["scope2_market_tco2e"],
                "scope1_2_tco2e": r["scope1_2_market_total_tco2e"],
                "scope3_tco2e": r["scope3_estimated_tco2e"],
                "grid_factor": COUNTRIES[b["country"]]["grid_factor"],
                "rec_coverage_fraction": b.get("rec_coverage_fraction", 0),
                "eligible_solar_kwh": b.get("eligible_solar_kwh", 0),
            }
        )
    rows.sort(key=lambda x: x["scope1_2_tco2e"], reverse=True)
    max_site = rows[0]["scope1_2_tco2e"] if rows else 0
    return {
        "sites": rows,
        "center": list(MAP_CENTER),
        "zoom": MAP_ZOOM,
        "count": len(rows),
        "max_site_tco2e": max_site,
    }
