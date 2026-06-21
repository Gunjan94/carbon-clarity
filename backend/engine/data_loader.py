"""Load synthetic data from bundled JSON. Cached in-memory after first read."""
from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Dict, List

HERE = os.path.dirname(os.path.abspath(__file__))
# backend/engine -> backend -> scenario-d-carbon-clarity -> data
DATA_DIR = os.environ.get(
    "CARBON_DATA_DIR",
    os.path.join(os.path.dirname(os.path.dirname(HERE)), "data"),
)


@lru_cache(maxsize=1)
def load_buildings() -> List[Dict]:
    with open(os.path.join(DATA_DIR, "buildings.json")) as f:
        return json.load(f)


@lru_cache(maxsize=1)
def load_hero() -> Dict:
    with open(os.path.join(DATA_DIR, "hero_portfolio.json")) as f:
        return json.load(f)


def get_building(site_id: str) -> Dict | None:
    for b in load_buildings():
        if b["id"] == site_id:
            return b
    return None


@lru_cache(maxsize=1)
def load_summary_cache() -> Dict:
    path = os.path.join(DATA_DIR, "summary_cache.json")
    if not os.path.exists(path):
        return {}
    with open(path) as f:
        return json.load(f)
