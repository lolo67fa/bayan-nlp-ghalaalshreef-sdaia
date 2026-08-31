# PROGRESS — Bayan

> لا تضع علامة ✅ قبل وجود رابط commit/report/test قابل للفحص.

## Gate status

| Gate | Status | Required evidence | Commit/report links | Blocker/next action |
|---|---|---|---|---|
| A — ingest | ✅ PASSED | preprocessing tests + tokenizer decision | `notebooks/01_text_processing_tokenization.ipynb`, `notebooks/02_attention_transformers.ipynb`, `DECISIONS.md#decision-d-001`, 9 tests green | Day 2 labs |
| B — tasks | 🟨 NOT_STARTED | classification + NER + QA evidence | — | Run `notebooks/03_text_classification.ipynb` |
| C — search & truth | 🟨 NOT_STARTED | search metrics + slices + taxonomy | — | Blocked by Gate B |
| D — ship | 🟨 NOT_STARTED | project benchmark + API tests + canaries | — | Blocked by Gate C |
| E — submit | 🟨 NOT_STARTED | validator + demo + release tag | — | Blocked by Gate D |

Status values: `🟨 NOT_STARTED`, `🟧 IN_PROGRESS`, `✅ PASSED`, `🟥 BLOCKED`.

## Runtime/run-all evidence

| Notebook | Clean run date | Core marker | Colab/GitHub link |
|---|---|---|---|
| 00_runtime_doctor | 2026-08-30 | `BAYAN_ENV_READY = True` | `notebooks/00_runtime_doctor.ipynb` |
| 01_text_processing_tokenization | 2026-08-30 | `DAY1_NOTEBOOK1_CORE=PASS` | `notebooks/01_text_processing_tokenization.ipynb` |
| 02_attention_transformers | 2026-08-30 | `DAY1_NOTEBOOK2_CORE=PASS` | `notebooks/02_attention_transformers.ipynb` |

## Day 1 — complete

- Notebook 00 (runtime doctor): `BAYAN_ENV_READY = True`
- Notebook 01 (text processing & tokenisation): `DAY1_NOTEBOOK1_CORE=PASS`
- Notebook 02 (attention & transformers): `DAY1_NOTEBOOK2_CORE=PASS`, `TWO_CHECKPOINT_PARAMETER_AUDIT=PASS`, `ACTUAL_TRANSFORMER_FORWARD=PASS`
- Tests: 9 passed — `test_day1_preprocessing`, `test_day1_tokenization`, `test_day1_attention`
- Decision recorded: D-001 — tokenizer and Arabic preprocessing profile
- Measured: Arabic fertility 1.39, English fertility 1.32, truncation @8 = 40%, @10 = 0%, @16 = 0%
- Known limitation logged: `sentencizer` splits after the abbreviation "د."
- Recovery point: all notebooks saved to GitHub with outputs
