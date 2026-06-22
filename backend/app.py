"""Local FastAPI server wrapping the four handlers.

Run: uvicorn app:app --reload --port 8000  (from backend/)

Each route delegates to a plain handler function so the same logic drops into
AWS Lambda later. Fully functional with ZERO AWS credentials (offline summary).
"""
from __future__ import annotations

import json

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from handlers import calculate, portfolio, scenario, summary

app = FastAPI(title="CarbonClarity API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "carbonclarity"}


@app.post("/calculate")
async def calculate_route(request: Request):
    body = await request.json()
    return calculate.handle(body)


@app.get("/portfolio")
def portfolio_route(period: str = "2025-Q1", portfolio_name: str = "hero"):
    return portfolio.handle({"period": period, "portfolio": portfolio_name})


@app.get("/sites")
def sites_route():
    from engine.data_loader import load_buildings
    from engine.geo import build_site_map
    return build_site_map(load_buildings())


@app.get("/abatement-options")
def abatement_options_route(baseline_tco2e: float = 12000.0):
    from engine.scenario_engine import abatement_options
    return abatement_options(baseline_tco2e)


@app.post("/scenario")
async def scenario_route(request: Request):
    body = await request.json()
    return scenario.handle(body)


@app.post("/summary")
async def summary_route(request: Request):
    body = await request.json()
    scenario_result = body.get("scenario_result") or body.get("scenario") or {}

    def event_stream():
        for ev in summary.stream_summary(scenario_result):
            yield f"data: {json.dumps(ev)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
