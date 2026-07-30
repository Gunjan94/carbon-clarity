"""test_scenario_engine.py — unit tests for the decarbonization scenario engine.

scenario_engine.py is a pure, deterministic function: investment levers ->
year-by-year trajectory to 2030 against the target line, with budget tracking.
These tests lock the load-bearing behaviour:
  - lever intensity clamped to [0, 1]
  - abatement + cost scale linearly with intensity
  - budget over-commit detection
  - target-hit logic
  - MACC ordering (cheapest tonnes first)

Run:  pytest test_scenario_engine.py -v
"""
from engine.scenario_engine import run_scenario, abatement_options, LEVERS


def test_zero_levers_no_abatement():
    r = run_scenario(baseline_tco2e=12000.0, levers={})
    assert r["total_annual_abatement_tco2e"] == 0.0
    assert r["budget_committed_usd"] == 0.0
    assert r["final_tco2e"] == 12000.0


def test_full_lever_hits_max_abatement():
    r = run_scenario(baseline_tco2e=12000.0, levers={"supplier_switch_pct": 1.0})
    assert r["total_annual_abatement_tco2e"] == LEVERS["supplier_switch_pct"]["max_abatement_tco2e"]


def test_lever_intensity_clamped_above_one():
    # intensity 5.0 must clamp to 1.0 — no more than max abatement
    r = run_scenario(baseline_tco2e=12000.0, levers={"solar_pct": 5.0})
    assert r["total_annual_abatement_tco2e"] == LEVERS["solar_pct"]["max_abatement_tco2e"]


def test_lever_intensity_clamped_below_zero():
    r = run_scenario(baseline_tco2e=12000.0, levers={"solar_pct": -3.0})
    assert r["total_annual_abatement_tco2e"] == 0.0


def test_abatement_scales_linearly():
    half = run_scenario(baseline_tco2e=12000.0, levers={"solar_pct": 0.5})
    full = run_scenario(baseline_tco2e=12000.0, levers={"solar_pct": 1.0})
    assert half["total_annual_abatement_tco2e"] == full["total_annual_abatement_tco2e"] / 2


def test_over_budget_detected():
    # All levers full — cost far exceeds a tiny budget
    r = run_scenario(baseline_tco2e=12000.0,
                     levers={k: 1.0 for k in LEVERS},
                     budget_usd=1_000_000.0)
    assert r["over_budget"] is True
    assert r["budget_remaining_usd"] < 0


def test_within_budget():
    r = run_scenario(baseline_tco2e=12000.0, levers={"solar_pct": 0.1},
                     budget_usd=10_000_000.0)
    assert r["over_budget"] is False
    assert r["budget_remaining_usd"] > 0


def test_target_hit_with_aggressive_levers():
    r = run_scenario(baseline_tco2e=12000.0,
                     levers={k: 1.0 for k in LEVERS},
                     target_pct=0.40)
    assert r["hits_target"] is True
    assert r["final_reduction_pct"] >= 0.40


def test_target_missed_with_no_action():
    r = run_scenario(baseline_tco2e=12000.0, levers={}, target_pct=0.40)
    assert r["hits_target"] is False


def test_trajectory_spans_start_to_target_year():
    r = run_scenario(baseline_tco2e=12000.0, levers={"solar_pct": 0.5},
                     start_year=2025, target_year=2030)
    years = [pt["year"] for pt in r["trajectory"]]
    assert years == [2025, 2026, 2027, 2028, 2029, 2030]


def test_abatement_cannot_exceed_baseline():
    # tiny baseline, all levers full — abatement caps at baseline (no negative emissions)
    r = run_scenario(baseline_tco2e=100.0, levers={k: 1.0 for k in LEVERS})
    assert r["total_annual_abatement_tco2e"] <= 100.0
    assert r["final_tco2e"] >= 0.0


def test_macc_ordered_cheapest_first():
    macc = abatement_options(baseline_tco2e=12000.0)
    costs = [o["cost_per_tonne_usd"] for o in macc["options"]]
    assert costs == sorted(costs), "MACC must order options cheapest-per-tonne first"


def test_macc_cumulative_monotonic():
    macc = abatement_options(baseline_tco2e=12000.0)
    cum = [o["cumulative_abatement_tco2e"] for o in macc["options"]]
    assert cum == sorted(cum), "cumulative abatement must be non-decreasing"
