"""/summary handler -- board-ready narrative of the chosen scenario.

Two modes:
  * USE_BEDROCK=1 and AWS creds present -> stream from Amazon Bedrock (Claude),
    grounded strictly in the supplied /scenario result.
  * Otherwise (default, zero-AWS) -> a high-quality TEMPLATED narrative built
    from the SAME real scenario numbers. The app is fully functional offline.

The streaming generator yields text chunks; the FastAPI layer relays them as
Server-Sent Events so the panel fills in progressively in both modes.
"""
from __future__ import annotations

import json
import os
import time
from typing import Dict, Generator

# Bedrock config (only used when USE_BEDROCK=1). In ap-southeast-1 claude-sonnet-4-6
# is invoked via its (global) inference profile, not the bare on-demand id.
BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "global.anthropic.claude-sonnet-4-6")
BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "ap-southeast-1")

SYSTEM_PROMPT = (
    "You are a sustainability advisor briefing the board of a $4B Singapore-HQ "
    "manufacturer. Be concise, factual, board-level. Use ONLY the numbers provided. "
    "Report all monetary figures in Singapore dollars using the 'S$' prefix. "
    "Write in plain prose only — never output variable names, code, key=value pairs, "
    "or the '=' sign. No preamble."
)

# Display currency: the engine computes in USD; the board reads SGD (same rate the UI uses).
SGD_RATE = 1.35


def _fmt_sgd(usd: float) -> str:
    return f"S${usd * SGD_RATE / 1_000_000:.1f}M"


def build_user_prompt(s: Dict) -> str:
    levers = "; ".join(
        f"{l['label']} at {round(l['value']*100)}% "
        f"(-{l['annual_abatement_tco2e']:,.0f} tCO2e/yr, {_fmt_sgd(l['cost_usd'])})"
        for l in s["lever_detail"] if l["value"] > 0
    ) or "no levers selected"
    meets = "meets" if s["hits_target"] else "does not meet"
    return (
        f"Baseline Scope 1+2 = {s['baseline_tco2e']:,.0f} tCO2e. "
        f"Board target = {round(s['target_pct']*100)}% reduction by {s['target_year']}. "
        f"Budget = {_fmt_sgd(s['budget_usd'])}. "
        f"Chosen plan: {levers}. "
        f"Modeled outcome: {s['final_tco2e']:,.0f} tCO2e in {s['target_year']} "
        f"({round(s['final_reduction_pct']*100,1)}% reduction), which {meets} the target; "
        f"{_fmt_sgd(s['budget_committed_usd'])} committed, "
        f"{_fmt_sgd(s['budget_remaining_usd'])} remaining. "
        f"Write a 4-5 sentence board summary: what the plan funds, whether it {meets} the "
        f"{round(s['target_pct']*100)}%-by-{s['target_year']} target, the residual gap, "
        f"and the single highest-leverage next move. Plain prose, S$ for money."
    )


def _templated_narrative(s: Dict) -> str:
    """Grounded, board-quality narrative from the real scenario numbers."""
    funded = [l for l in s["lever_detail"] if l["value"] > 0]
    if funded:
        funded.sort(key=lambda l: l["annual_abatement_tco2e"], reverse=True)
        plan = ", ".join(
            f"{l['label'].lower()} at {round(l['value']*100)}%" for l in funded
        )
        top = funded[0]
    else:
        plan = "no investments yet selected"
        top = None

    red = round(s["final_reduction_pct"] * 100, 1)
    target = round(s["target_pct"] * 100)
    base = s["baseline_tco2e"]
    final = s["final_tco2e"]

    s1 = (
        f"The proposed decarbonization plan funds {plan}, committing "
        f"{_fmt_sgd(s['budget_committed_usd'])} of the {_fmt_sgd(s['budget_usd'])} "
        f"three-year budget and leaving {_fmt_sgd(s['budget_remaining_usd'])} unallocated."
    )

    if s["hits_target"]:
        s2 = (
            f"Modeled against the {base:,.0f} tCO2e Scope 1+2 baseline, this sequence reaches a "
            f"{red}% reduction by {s['target_year']} — clearing the board's "
            f"{target}%-by-{s['target_year']} commitment with headroom."
        )
    else:
        gap_pct = target - red
        s2 = (
            f"Modeled against the {base:,.0f} tCO2e baseline, this reaches only a {red}% reduction "
            f"by {s['target_year']}, short of the {target}% target by {gap_pct:.1f} percentage points."
        )

    s3 = (
        f"That leaves a residual footprint of {final:,.0f} tCO2e in {s['target_year']}, "
        f"concentrated in Scope 1 process heat and the un-electrified balance of the fleet."
    )

    if top is not None and s["budget_remaining_usd"] > 250_000 and not _all_maxed(funded):
        s4 = (
            f"The single highest-leverage next move is to extend {top['label'].lower()} — "
            f"the cheapest abatement per tonne in this portfolio — using the remaining "
            f"{_fmt_sgd(s['budget_remaining_usd'])} before adding new capital."
        )
    elif s["over_budget"]:
        s4 = (
            f"The plan is currently over budget by {_fmt_sgd(abs(s['budget_remaining_usd']))}; "
            f"re-sequencing toward the lowest-cost-per-tonne lever first would restore headroom."
        )
    else:
        s4 = (
            "With the budget largely committed, the next move is to convert the modeled abatement "
            "into a sequenced delivery plan and begin Scope 3 supplier engagement."
        )

    return " ".join([s1, s2, s3, s4])


def _all_maxed(funded) -> bool:
    return all(l["value"] >= 0.99 for l in funded) if funded else False


def _stream_bedrock(scenario: Dict) -> Generator[str, None, None]:
    import boto3  # imported lazily so offline mode needs no boto3

    client = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)
    # Use the modern Converse streaming API (works with the global inference profile).
    resp = client.converse_stream(
        modelId=BEDROCK_MODEL_ID,
        system=[{"text": SYSTEM_PROMPT}],
        messages=[{"role": "user", "content": [{"text": build_user_prompt(scenario)}]}],
        inferenceConfig={"maxTokens": 600, "temperature": 0.4},
    )
    for event in resp["stream"]:
        if "contentBlockDelta" in event:
            text = event["contentBlockDelta"]["delta"].get("text")
            if text:
                yield text


def stream_summary(scenario: Dict) -> Generator[Dict, None, None]:
    """Yield {'type','text'|'source'} events. Falls back to templated narrative.

    Event types:
      meta  -> {'source': 'bedrock'|'offline-template'|'cache'}
      delta -> {'text': '...'}
      done  -> {}
    """
    use_bedrock = os.environ.get("USE_BEDROCK", "0") == "1"

    if use_bedrock:
        try:
            yield {"type": "meta", "source": "bedrock", "model": BEDROCK_MODEL_ID,
                   "region": BEDROCK_REGION}
            got_any = False
            for piece in _stream_bedrock(scenario):
                got_any = True
                yield {"type": "delta", "text": piece}
            if got_any:
                yield {"type": "done"}
                return
            # empty response -> fall through to live LLM
        except Exception:  # noqa: BLE001 - graceful degradation is the point
            pass  # fall through to the live LLM

    # Live keyless LLM — the DEFAULT real-AI path (no AWS creds needed). The
    # board summary is genuinely model-generated, grounded in the scenario numbers.
    try:
        import llm

        text = llm.generate(SYSTEM_PROMPT, build_user_prompt(scenario))
        yield {"type": "meta", "source": "llm", "model": llm.MODEL}
        for word in text.split(" "):
            yield {"type": "delta", "text": word + " "}
            time.sleep(0.012)
        yield {"type": "done"}
        return
    except Exception:  # noqa: BLE001 — only now do we use the template
        pass

    # Template fallback (true offline / no network)
    yield {"type": "meta", "source": "offline-template"}
    yield from _stream_template(scenario)


def _stream_template(scenario: Dict) -> Generator[Dict, None, None]:
    text = _templated_narrative(scenario)
    # stream word-by-word so the panel fills progressively, like a real LLM
    for word in text.split(" "):
        yield {"type": "delta", "text": word + " "}
        time.sleep(0.012)
    yield {"type": "done"}


def handle_blocking(body: Dict) -> Dict:
    """Non-streaming convenience (returns the whole narrative)."""
    scenario = body.get("scenario_result") or body.get("scenario") or {}
    source = "offline-template"
    parts = []
    for ev in stream_summary(scenario):
        if ev["type"] == "meta":
            source = ev["source"]
        elif ev["type"] == "delta":
            parts.append(ev["text"])
    return {"summary": "".join(parts).strip(), "source": source}
