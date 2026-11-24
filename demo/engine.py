"""Bayan demo engine: topic classification + bilingual semantic search on CPU.

Everything is rebuilt from the synthetic course data in ``data/sample`` when the
demo starts, so no private model files or Google Drive paths are needed:

* Topic: the TF-IDF (char_wb 3-5) + LinearSVC baseline from Notebook 03,
  retrained on the 24 training rows. The fine-tuned DistilBERT from
  Notebooks 03/08 lives in a private Drive folder and is not used here.
* Search: ``paraphrase-multilingual-MiniLM-L12-v2`` embeddings of the 24 cases
  with exact inner-product search (same ranking as the FAISS IndexFlatIP in
  Notebook 06) and the no-answer threshold tuned on validation queries only.
"""
from __future__ import annotations

import csv
import json
import sys
import threading
import time
import unicodedata
from pathlib import Path
from typing import Any

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from bayan.preprocessing import (  # noqa: E402
    build_text_record,
    mask_pii,
    normalize_arabic,
    normalize_whitespace,
)
from bayan.retrieval import (  # noqa: E402
    exact_inner_product_search,
    retrieval_metrics,
    tune_no_answer_threshold,
)
from bayan.serving import infer_language, validate_request_text  # noqa: E402

DATA = ROOT / "data" / "sample"
SEED = 42
SEARCH_MODEL_ID = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
TOPIC_MODEL_NAME = "TF-IDF (char 3-5) + LinearSVC baseline"
K = 3


def _read_csv(name: str) -> list[dict[str, str]]:
    with (DATA / name).open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def _model_text(text: str, language: str) -> str:
    """Conservative profile from Decision D-001 (PII masked, NFC, no tatweel)."""

    return build_text_record(text, language=language).model_text


def search_text(text: str, language: str) -> str:
    """Search profile from Notebook 06: Arabic dediac + alef/ya unification."""

    text = unicodedata.normalize("NFC", text).replace("\u0640", "")
    if language == "ar":
        return normalize_arabic(
            text, remove_diacritics=True, normalize_alef=True, normalize_ya=True
        )
    return normalize_whitespace(text)


class TopicModel:
    def __init__(self) -> None:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics import f1_score
        from sklearn.pipeline import make_pipeline
        from sklearn.svm import LinearSVC

        rows = _read_csv("bayan_day2_classification.csv")
        train = [r for r in rows if r["split"] == "train"]
        validation = [r for r in rows if r["split"] == "validation"]
        self.labels = sorted({r["topic"] for r in rows})
        self.pipeline = make_pipeline(
            TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=1),
            LinearSVC(random_state=SEED),
        )
        self.pipeline.fit(
            [_model_text(r["text"], r["language"]) for r in train],
            [r["topic"] for r in train],
        )
        predictions = self.pipeline.predict(
            [_model_text(r["text"], r["language"]) for r in validation]
        )
        self.metrics = {
            "train_rows": len(train),
            "validation_rows": len(validation),
            "validation_macro_f1": float(
                f1_score(
                    [r["topic"] for r in validation],
                    predictions,
                    labels=self.labels,
                    average="macro",
                    zero_division=0,
                )
            ),
        }

    def predict(self, model_text: str) -> dict[str, Any]:
        margins = self.pipeline.decision_function([model_text])[0]
        classes = list(self.pipeline.classes_)
        order = np.argsort(-margins)
        return {
            "label": classes[order[0]],
            "margins": [
                {"label": classes[i], "margin": round(float(margins[i]), 4)}
                for i in order
            ],
        }


class SearchIndex:
    def __init__(self, encoder: Any | None = None) -> None:
        if encoder is None:
            from sentence_transformers import SentenceTransformer

            encoder = SentenceTransformer(SEARCH_MODEL_ID, device="cpu")
        self.encoder = encoder
        self.cases = _read_csv("bayan_day3_cases.csv")
        self.ids = [c["case_id"] for c in self.cases]
        self.by_id = {c["case_id"]: c for c in self.cases}
        self.vectors = self._encode(
            [
                search_text(f'{c["summary"]} [SEP] {c["resolution"]}', c["language"])
                for c in self.cases
            ]
        )
        with (DATA / "bayan_day3_queries.jsonl").open(encoding="utf-8") as handle:
            queries = [json.loads(line) for line in handle if line.strip()]
        validation = [q for q in queries if q["split"] == "validation"]
        test = [q for q in queries if q["split"] == "test"]
        val_rank = self._rank([(q["query"], q["language"]) for q in validation])
        tuned = tune_no_answer_threshold(
            [r[0]["score"] for r in val_rank],
            [bool(q["relevant_case_ids"]) for q in validation],
        )
        self.threshold = tuned["threshold"]
        test_rank = self._rank([(q["query"], q["language"]) for q in test])
        test_metrics = retrieval_metrics(
            [[r["case_id"] for r in ranking] for ranking in test_rank],
            [q["relevant_case_ids"] for q in test],
            k=K,
        )
        no_answer = float(
            np.mean(
                [
                    (ranking[0]["score"] >= self.threshold) == bool(q["relevant_case_ids"])
                    for q, ranking in zip(test, test_rank)
                ]
            )
        )
        self.metrics = {
            "cases": len(self.cases),
            "threshold": self.threshold,
            "threshold_validation_accuracy": tuned["validation_accuracy"],
            "test_recall_at_3": test_metrics["recall@3"],
            "test_mrr_at_3": test_metrics["mrr@3"],
            "test_answerable_queries": test_metrics["answerable_queries"],
            "test_no_answer_accuracy": no_answer,
            "test_queries": len(test),
        }

    def _encode(self, texts: list[str]) -> np.ndarray:
        return np.asarray(
            self.encoder.encode(
                texts, convert_to_numpy=True, normalize_embeddings=True
            ),
            dtype=np.float32,
        )

    def _rank(self, items: list[tuple[str, str]], k: int = K) -> list[list[dict]]:
        vectors = self._encode([search_text(text, lang) for text, lang in items])
        return exact_inner_product_search(vectors, self.vectors, self.ids, k=k)

    def search(self, text: str, language: str) -> dict[str, Any]:
        ranking = self._rank([(text, language)])[0]
        results = []
        for item in ranking:
            case = self.by_id[str(item["case_id"])]
            results.append(
                {
                    "case_id": case["case_id"],
                    "score": round(float(item["score"]), 4),
                    "language": case["language"],
                    "variant": case["variant"],
                    "topic": case["topic"],
                    "summary": case["summary"],
                    "resolution": case["resolution"],
                }
            )
        best = results[0]["score"]
        return {
            "status": "ready",
            "has_match": best >= self.threshold,
            "best_score": best,
            "threshold": round(self.threshold, 4),
            "results": results,
        }


class BayanDemo:
    """Owns both models; search loads in the background so the page opens fast."""

    def __init__(self, *, load_search: bool = True, encoder: Any | None = None) -> None:
        started = time.perf_counter()
        self.topic = TopicModel()
        self.topic_seconds = time.perf_counter() - started
        self.search_index: SearchIndex | None = None
        self.search_state = "loading" if load_search else "disabled"
        self.search_error: str | None = None
        if load_search:
            thread = threading.Thread(target=self._load_search, args=(encoder,), daemon=True)
            thread.start()
            self._thread = thread

    def _load_search(self, encoder: Any | None) -> None:
        try:
            self.search_index = SearchIndex(encoder)
            self.search_state = "ready"
        except Exception as exc:  # network, disk or model errors
            self.search_error = f"{type(exc).__name__}: {exc}"[:300]
            self.search_state = "unavailable"

    def wait_for_search(self, timeout: float | None = None) -> None:
        thread = getattr(self, "_thread", None)
        if thread is not None:
            thread.join(timeout)

    def status(self) -> dict[str, Any]:
        return {
            "topic": {
                "status": "ready",
                "model": TOPIC_MODEL_NAME,
                "labels": self.topic.labels,
                **self.topic.metrics,
            },
            "search": {
                "status": self.search_state,
                "model": SEARCH_MODEL_ID,
                "error": self.search_error,
                **(self.search_index.metrics if self.search_index else {}),
            },
            "data": "Synthetic SDAIA Academy course samples (data/sample)",
        }

    def analyze(self, text: str) -> dict[str, Any]:
        started = time.perf_counter()
        cleaned = validate_request_text(text, max_chars=1000)
        language = infer_language(cleaned)
        model_text = _model_text(cleaned, language)
        topic = self.topic.predict(model_text)
        if self.search_state == "ready" and self.search_index is not None:
            search = self.search_index.search(model_text, language)
        else:
            search = {"status": self.search_state, "error": self.search_error}
        return {
            "text": cleaned,
            "language": language,
            "model_text": model_text,
            "masked": mask_pii(cleaned) != cleaned,
            "topic": {"model": TOPIC_MODEL_NAME, **topic},
            "search": search,
            "latency_ms": round((time.perf_counter() - started) * 1000, 1),
        }
