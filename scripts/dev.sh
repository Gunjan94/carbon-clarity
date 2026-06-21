#!/usr/bin/env bash
# One-command local run: backend (FastAPI/uvicorn) + frontend (Vite dev).
# Fully offline -- no AWS credentials required. Set USE_BEDROCK=1 to call real
# Amazon Bedrock for the board summary (otherwise a grounded offline narrative).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8077}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

echo "==> CarbonClarity local run"
echo "    backend  : http://localhost:${BACKEND_PORT}"
echo "    frontend : http://localhost:${FRONTEND_PORT}"
echo "    USE_BEDROCK=${USE_BEDROCK:-0} (set to 1 for real Bedrock streaming)"

# --- Backend -------------------------------------------------------------
cd "$ROOT/backend"
if [ ! -d .venv ]; then
  echo "==> creating Python venv"
  python3.12 -m venv .venv 2>/dev/null || python3 -m venv .venv
  .venv/bin/pip install -q --upgrade pip
  .venv/bin/pip install -q -r requirements.txt
fi

# regenerate data if missing
if [ ! -f "$ROOT/data/buildings.json" ]; then
  echo "==> generating synthetic data (seed=42)"
  (cd "$ROOT/data" && "$ROOT/backend/.venv/bin/python" generate_data.py)
fi

echo "==> starting backend"
.venv/bin/uvicorn app:app --port "${BACKEND_PORT}" &
BACKEND_PID=$!

cleanup() { kill "$BACKEND_PID" 2>/dev/null || true; }
trap cleanup EXIT

# --- Frontend ------------------------------------------------------------
cd "$ROOT/frontend"
if [ ! -d node_modules ]; then
  echo "==> installing frontend deps"
  npm install
fi

export VITE_BACKEND_URL="http://localhost:${BACKEND_PORT}"
echo "==> starting frontend (Vite)"
npm run dev -- --port "${FRONTEND_PORT}"
