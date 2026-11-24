"""«بيان | Bayan» try-it demo: one page + a small JSON API (FastAPI, CPU only).

Run from the repository root:

    pip install -r demo/requirements.txt
    uvicorn demo.app:app --port 7860
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator

try:  # works both as ``demo.app`` and when run from inside demo/
    from .engine import BayanDemo, validate_request_text
except ImportError:  # pragma: no cover
    from engine import BayanDemo, validate_request_text

STATIC = Path(__file__).resolve().parent / "static"


class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1000)

    @field_validator("text")
    @classmethod
    def reject_blank(cls, value: str) -> str:
        return validate_request_text(value, max_chars=1000)


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_search = os.environ.get("BAYAN_DISABLE_SEARCH") != "1"
    app.state.demo = BayanDemo(load_search=load_search)
    yield


app = FastAPI(title="Bayan demo", version="1.0.0", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(STATIC / "index.html")


@app.get("/api/status")
def status() -> dict:
    return app.state.demo.status()


@app.post("/api/analyze")
def analyze(request: AnalyzeRequest) -> dict:
    return app.state.demo.analyze(request.text)
