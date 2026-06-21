#!/bin/bash
# Lambda Web Adapter entrypoint: starts the FastAPI app under uvicorn.
# LWA proxies the Lambda Function URL (RESPONSE_STREAM for the /summary SSE)
# to this server.
cd "${LAMBDA_TASK_ROOT:-.}"
exec python -m uvicorn app:app --host 0.0.0.0 --port "${PORT:-8000}"
