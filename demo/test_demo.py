"""End-to-end checks for the Bayan demo API.

These load the real models (the search model is downloaded on first run), so
they live next to the demo instead of in the light ``tests/`` suite.

    PYTHONPATH=. python -m pytest -q demo/test_demo.py
"""
from __future__ import annotations

import time

import pytest

pytest.importorskip("sentence_transformers")
from fastapi.testclient import TestClient  # noqa: E402

from demo.app import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        deadline = time.time() + 600
        while test_client.get("/api/status").json()["search"]["status"] == "loading":
            assert time.time() < deadline, "search model did not load"
            time.sleep(1)
        yield test_client


def test_status_reproduces_recorded_metrics(client):
    status = client.get("/api/status").json()
    assert status["search"]["status"] == "ready"
    # Same values as Notebook 03 and reports/retrieval_metrics.json.
    assert status["topic"]["validation_macro_f1"] == pytest.approx(0.6667, abs=1e-4)
    assert status["search"]["threshold"] == pytest.approx(0.4592, abs=1e-3)
    assert status["search"]["test_recall_at_3"] == 1.0
    assert status["search"]["test_mrr_at_3"] == pytest.approx(0.6667, abs=1e-4)
    assert status["search"]["test_no_answer_accuracy"] == 1.0


def test_arabic_request(client):
    data = client.post("/api/analyze", json={"text": "أحتاج موعد عيادة ولا يوجد وقت متاح"}).json()
    assert data["language"] == "ar"
    assert data["topic"]["label"] == "health"
    assert data["search"]["has_match"] is True
    assert data["search"]["results"][0]["case_id"] == "AR-007"


def test_english_request(client):
    data = client.post("/api/analyze", json={"text": "The bus was over thirty minutes late"}).json()
    assert data["language"] == "en"
    assert data["topic"]["label"] == "transport"
    assert data["search"]["results"][0]["case_id"] == "EN-004"


def test_arabic_query_finds_english_case(client):
    data = client.post("/api/analyze", json={"text": "وين موقع موقف الباص في الحي؟"}).json()
    best = data["search"]["results"][0]
    assert data["language"] == "ar"
    assert best["language"] == "en" and best["case_id"] == "EN-006"
    assert data["search"]["has_match"] is True


def test_out_of_scope_returns_no_match(client):
    data = client.post("/api/analyze", json={"text": "What is tomorrow's weather?"}).json()
    assert data["search"]["has_match"] is False
    assert data["search"]["best_score"] < data["search"]["threshold"]


def test_contact_details_are_masked_before_the_models(client):
    data = client.post("/api/analyze", json={"text": "ما وصلني رمز التحقق، رقمي 0500000000"}).json()
    assert data["masked"] is True
    assert "0500000000" not in data["model_text"] and "[PHONE]" in data["model_text"]


@pytest.mark.parametrize("payload", [{"text": "   "}, {"text": ""}, {"text": "x" * 1001}, {}])
def test_invalid_requests_are_rejected(client, payload):
    assert client.post("/api/analyze", json=payload).status_code == 422


def test_page_is_served(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "بيان" in response.text
