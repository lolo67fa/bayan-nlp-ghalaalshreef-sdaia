# PROGRESS — Bayan

> لا تضع علامة ✅ قبل وجود رابط commit/report/test قابل للفحص.

## Gate status

| Gate | Status | Required evidence | Commit/report links | Blocker/next action |
|---|---|---|---|---|
| A — ingest | ✅ PASSED | preprocessing tests + tokenizer decision | `notebooks/01_text_processing_tokenization.ipynb`, `notebooks/02_attention_transformers.ipynb`, `DECISIONS.md#decision-d-001`, 9 tests green | Day 2 labs |
| B — tasks | ✅ PASSED | classification + NER + QA evidence | `notebooks/03_text_classification.ipynb`, `notebooks/04_ner_and_qa.ipynb`, `DECISIONS.md#decision-d-002`, 13 tests green | Day 3 labs |
| C — search & truth | 🟨 NOT_STARTED | search metrics + slices + taxonomy | — | Blocked by Gate B | Run `notebooks/05_arabic_nlp.ipynb`
| D — ship | 🟨 NOT_STARTED | project benchmark + API tests + canaries | — | Blocked by Gate C |
| E — submit | 🟨 NOT_STARTED | validator + demo + release tag | — | Blocked by Gate D |

Status values: `🟨 NOT_STARTED`, `🟧 IN_PROGRESS`, `✅ PASSED`, `🟥 BLOCKED`.

## Runtime/run-all evidence

| Notebook | Clean run date | Core marker | Colab/GitHub link |
|---|---|---|---|
| 00_runtime_doctor | 2026-08-30 | `BAYAN_ENV_READY = True` | `notebooks/00_runtime_doctor.ipynb` |
| 01_text_processing_tokenization | 2026-08-30 | `DAY1_NOTEBOOK1_CORE=PASS` | `notebooks/01_text_processing_tokenization.ipynb` |
| 02_attention_transformers | 2026-08-30 | `DAY1_NOTEBOOK2_CORE=PASS` | `notebooks/02_attention_transformers.ipynb` |
| 03_text_classification | 2026-08-31 | `DAY2_NOTEBOOK3_CORE=PASS` | `notebooks/03_text_classification.ipynb` |
| 04_ner_and_qa | 2026-08-31 | `DAY2_NOTEBOOK4_CORE=PASS` | `notebooks/04_ner_and_qa.ipynb` |

## Day 1 — complete

- Notebook 00 (runtime doctor): `BAYAN_ENV_READY = True`
- Notebook 01 (text processing & tokenisation): `DAY1_NOTEBOOK1_CORE=PASS`
- Notebook 02 (attention & transformers): `DAY1_NOTEBOOK2_CORE=PASS`, `TWO_CHECKPOINT_PARAMETER_AUDIT=PASS`, `ACTUAL_TRANSFORMER_FORWARD=PASS`


- Tests: 9 passed — `test_day1_preprocessing`, `test_day1_tokenization`, `test_day1_attention`
- Decision recorded: D-001 — tokenizer and Arabic preprocessing profile
- Measured: Arabic fertility 1.39, English fertility 1.32, truncation @8 = 40%, @10 = 0%, @16 = 0%

## Day 2 — complete

- Notebook 03 (text classification): `DAY2_NOTEBOOK3_CORE=PASS`
- Notebook 04 (NER & extractive QA): `DAY2_NOTEBOOK4_CORE=PASS`
- Tests: 13 passed — `test_day2_metrics`, `test_day2_ner_alignment`, `test_day2_qa_postprocess`, `test_day2_splits`
- Setup: `distilbert/distilbert-base-multilingual-cased`, device `cuda` (T4), `full_finetune`, seed 42
- Split integrity: `group_overlap == 0`, every split contains every label
- Measured (MEASURED_SMOKE): baseline macro-F1 0.6667 · transformer 0.55 · delta −0.1167 · NER entity F1 0.0 (0 predicted of 4 true) · QA no-answer returned `None`
- Decision recorded: D-002 — task models, splits and honest smoke results
- Recovery point: both notebooks saved to GitHub with outputs
- Known limitation logged: `sentencizer` splits after the abbreviation "د."
- Recovery point: all notebooks saved to GitHub with outputs
