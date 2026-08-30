# DECISIONS — Bayan

> سجل القرارات. أضف قرارًا جديدًا لكل تغيير يؤثر في البيانات أو الجودة أو الخدمة.
> Add one record for each material data, quality, or serving decision.

## Decision D-001 — Tokenizer and Arabic preprocessing profile (Day 1)

- **Date:** 2026-08-30
- **Gate:** A
- **Status:** accepted
- **Owner:** Ghala Alshreef

### Context | السياق

Bayan processes bilingual Arabic/English feedback. Two choices had to be fixed before any task model: which tokenizer to build against, and how aggressively to normalise Arabic. Both are data-contract decisions — they must be identical at train, eval and serve time or the system develops train/serve skew.

### Options considered | البدائل

| Option | Benefit | Cost/risk | Evidence |
|---|---|---|---|
| A — Conservative profile (NFC, tatweel removal, whitespace collapse, PII masking; diacritics and alef preserved) | Loses no linguistic information; safe default | Some surface variants stay distinct | Arabic fertility 1.39, English 1.32, truncation @16 = 0% [MEASURED] |
| B — Aggressive profile (remove diacritics, unify alef and ya) | More surface forms collapse to one | May contradict a checkpoint's pretraining recipe; unmeasured effect on NER and QA | Not measured — no task metric available on Day 1 |

### Decision | القرار

Adopt Option A. Local WordPiece (27-token teaching vocabulary, `[UNK]` fallback, `BertPreTokenizer`, `[CLS] $A [SEP]` template) with the conservative Arabic profile. Set `max_length` at 16 or above for this corpus.

### Evidence | الدليل

- Notebook: `notebooks/01_text_processing_tokenization.ipynb` — `DAY1_NOTEBOOK1_CORE=PASS`
- Tests: `tests/test_day1_preprocessing.py`, `tests/test_day1_tokenization.py`
- Corpus slice: 5 synthetic course samples — 3 Arabic (indices 0, 1, 3), 2 English (indices 2, 4), measured on `model_text`
- Fertility [MEASURED]: Arabic 1.39 · English 1.32 · mean 1.36 · per-sample 1.17, 1.00, 1.50, 2.00, 1.14
- Truncation rate [MEASURED]: max_length=8 → 40% · max_length=10 → 0% · max_length=16 → 0%
- mBERT comparison [MEASURED]: a mixed Arabic/English sentence produced 12 tokens; Arabic words fragmented into subwords while every English word mapped to a single token — vocabulary coverage, not language label alone, drives fragmentation
- Result label: `MEASURED_SMOKE` — sample size is 5; these are not project results

### Consequences and rollback | الأثر والرجوع

- **Positive consequence:** No linguistic information is discarded before measurement; the same profile is applied at train, eval and serve.
- **Limitation 1:** Sentence segmentation breaks on abbreviations. `"راجع د. أحمد. ثم أعد المحاولة."` returns three sentences instead of two — `sentencizer` splits after `د.`. Documented, not silently fixed.
- **Limitation 2:** The teaching vocabulary is not representative. With 27 entries, out-of-vocabulary words collapse to `[UNK]`. Sample 4 produced four `[UNK]` tokens and the highest fertility (2.00) — a vocabulary-coverage artefact, not Arabic morphology.
- **Limitation 3:** `mask_pii` covers email and Saudi mobile patterns only. It is educational, not a production PII detector.
- **New risk:** Preserved diacritics may raise fertility on diacritised input, increasing sequence length and compute.
- **Rollback trigger:** A task metric on the frozen data shows the aggressive profile improving macro-F1 beyond its confidence interval, without harming the NER or QA slices.
- **Rollback path:** Switch the profile flag, re-measure fertility and truncation, re-run the Day 1 tests, and record a superseding decision here.

### Note on fertility | ملاحظة

Fertility is a cost and risk indicator — longer sequences, more compute, earlier context-limit pressure, harder subword alignment for NER. It is **not** a quality verdict. Tokenizer quality is judged by task metrics on the frozen data.

---

## قرارات إلزامية قبل Gate E

- [x] tokenizer + max length — D-001
- [x] Arabic preprocessing profile — D-001
- [ ] task model/baseline and split
- [ ] semantic encoder/index/k/threshold
- [ ] metric/slices/error priorities
- [ ] performance budget
- [ ] ONNX/INT8 adopt or reject
- [ ] served artefact + preprocessing/label versions
