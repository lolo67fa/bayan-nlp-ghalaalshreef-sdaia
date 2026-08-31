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

## Decision D-002 — Task models, splits and honest smoke results (Day 2)

- **Date:** 2026-08-31
- **Gate:** B
- **Status:** accepted
- **Owner:** Ghala Alshreef

### Context | السياق

Day 2 turns one shared encoder into three task heads: topic classification, NER, and extractive QA. Three things had to be fixed: which checkpoint, how the data is split so no evidence leaks between train and test, and how a result from a 40-row synthetic sample may honestly be labelled.

### Options considered | البدائل

| Option | Benefit | Cost/risk | Evidence |
|---|---|---|---|
| A — Multilingual DistilBERT (`distilbert/distilbert-base-multilingual-cased`) with full fine-tuning on GPU | One encoder serves Arabic and English; Apache-2.0; fits Colab free tier | Arabic coverage is thinner than a dedicated Arabic checkpoint | Ran end to end on a T4; three heads trained; all Day-2 tests green |
| B — TF-IDF `char_wb` (3,5) + LinearSVC as classification baseline | Fast; strong on small data; captures Arabic clitics at character level | No transfer; no shared encoder for NER or QA | Validation macro-F1 0.6667 |
| C — Arabic-only checkpoint (e.g. CAMeLBERT) | Likely stronger on Arabic | Would not serve the English half of the bilingual scope | Deferred to Day 3, where Arabic profiles are compared |

### Decision | القرار

Adopt Option A as the shared encoder for all three heads, and keep Option B as the permanent reference baseline for classification. Defer the Arabic-versus-multilingual comparison (Option C) to Day 3, when a measured Arabic profile exists.

Execution mode: `full_finetune` on `cuda`, seed 42, 2 epochs for classification, 2 epochs / 8 optimizer steps for NER.

### Evidence | الدليل

- Notebooks: `notebooks/03_text_classification.ipynb` (`DAY2_NOTEBOOK3_CORE=PASS`), `notebooks/04_ner_and_qa.ipynb` (`DAY2_NOTEBOOK4_CORE=PASS`)
- Tests: 13 passed — `test_day2_metrics`, `test_day2_ner_alignment`, `test_day2_qa_postprocess`, `test_day2_splits`
- **Split integrity:** `split_report["group_overlap"] == 0`, every split contains every label — no near-duplicate leaks between train and frozen test
- **Classification [MEASURED_SMOKE]:** baseline macro-F1 0.6667 · transformer macro-F1 0.55 at selected epoch 2 · delta −0.1167
- **NER [MEASURED_SMOKE]:** precision 0.0, recall 0.0, entity-level F1 0.0 — 4 true entities, 0 predicted. Training loss fell 2.3076 → 1.9365 over 2 epochs / 8 steps
- **NER alignment:** `NER alignment contract=PASS` and `Strict entity-boundary test=PASS` — `[B-ORG, I-ORG, O]` against `[B-ORG, O, O]` scores exactly 0.0
- **QA [MEASURED_SMOKE]:** valid span returned `الرياض` (score 8.5, start 16, end 22, null_margin −8.5); the no-answer case returned `None` with reason `no_answer_in_context` and margin 6.0. `QA post-processing tests=PASS`
- Result label for every figure above: `MEASURED_SMOKE`

### NER alignment policy | سياسة المحاذاة

Labels align to subwords through `word_ids()`. Special tokens and continuation subwords receive `-100`; only the first subword of a word carries the word's label. `-100` is ignored by the loss, so a fragmented word contributes exactly one supervised position rather than teaching the model that half an entity is not an entity. Scoring is entity-level and strict — a partially matched span scores zero, because half an entity is not an entity.

### QA null policy | سياسة اللا-إجابة

`best_span` searches candidates under `start <= end`, `max_answer_length=48` and `top_k=20`, then compares the best span's score against the null score. When the null margin exceeds the threshold, the function returns `None` with reason `no_answer_in_context` rather than forcing a span. A system that always answers is a system that fabricates; returning `None` is the correct answer when the context does not contain one.

### What this sample cannot prove | ما لا تثبته العينة

1. **The transformer underperformed the baseline by 11.67 points.** This is expected, not a defect: a model with millions of parameters cannot learn from 40 synthetic rows in 2 epochs, while character-level TF-IDF exploits surface patterns efficiently at that size. No conclusion about production quality follows in either direction.
2. **NER F1 is 0.0 because the model predicted no entities at all.** After 8 optimizer steps the randomly initialised token-classification head still finds the majority class `O` the fastest route to lower loss. The falling loss shows the path works; it does not show the model has learned the task.
3. **The QA sample has 10 rows with 2 no-answer cases**, not the 20 the project threshold refers to. The `17/20` requirement is measured on the frozen dataset, not here.
4. **No confidence interval, no seed variance, no per-slice breakdown.** A single seed on this sample size cannot separate signal from noise.

The R1–R7 thresholds (macro-F1 ≥ +8 points over baseline, entity-level F1 ≥ 0.80, 17/20 no-answer) are measured on the frozen dataset in the announced measurement environment. Nothing in this record is offered as a project result.

### Consequences and rollback | الأثر والرجوع

- **Positive consequence:** One encoder, one preprocessing contract, and three heads that all train, with split isolation proven rather than assumed.
- **Limitation:** Multilingual coverage of Arabic is thinner than a dedicated Arabic checkpoint.
- **New risk:** Reporting smoke figures without their label would misrepresent the system. Every figure above carries `MEASURED_SMOKE`.
- **Rollback trigger:** On the frozen data, an Arabic-specific checkpoint beats the multilingual one on the Arabic slice beyond its confidence interval without harming the English slice.
- **Rollback path:** Swap `MODEL_ID`, re-run all three heads on the same splits and seed, re-measure, and record a superseding decision.

- 

## قرارات إلزامية قبل Gate E

- [x] tokenizer + max length — D-001
- [x] Arabic preprocessing profile — D-001
- [x] task model/baseline and split — D-002
- [ ] semantic encoder/index/k/threshold
- [ ] metric/slices/error priorities
- [ ] performance budget
- [ ] ONNX/INT8 adopt or reject
- [ ] served artefact + preprocessing/label versions
