"""
AutismEarlyAI - interface prototype backend.

IMPORTANT: No trained model is connected to this service.

Earlier versions of this file returned simulated outputs for demonstration of
the user interface: a randomly generated "probability" and an illustrative
heatmap drawn over fixed eye/nose/mouth regions. Those outputs did not come
from any machine-learning model and had no clinical or scientific meaning.
That simulation has been removed. The analysis and report endpoints are now
disabled and return HTTP 503 until a trained, evaluated model is connected
and documented.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

STATUS_MESSAGE = (
    "Analysis is disabled. This website is an interface prototype and no trained "
    "AI model is connected. It does not analyse images or produce autism risk "
    "scores and is not a medical device."
)


@app.get("/api/health")
def health():
    return {"status": "ok", "model_connected": False, "message": STATUS_MESSAGE}


@app.post("/api/analyze")
def analyze():
    return JSONResponse(status_code=503, content={"detail": STATUS_MESSAGE})


@app.post("/api/report")
def report():
    return JSONResponse(status_code=503, content={"detail": STATUS_MESSAGE})
