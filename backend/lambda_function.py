"""AWS Lambda entry point — wraps the FastAPI app with Mangum (ASGI adapter).

Used only in the deployed Lambda (behind a Function URL). Local dev runs uvicorn
directly. Mangum buffers responses, so the /summary SSE returns its full body at
once on Lambda — content identical; live streaming is a local-only nicety.
"""
from mangum import Mangum

from app import app

handler = Mangum(app, lifespan="off")
