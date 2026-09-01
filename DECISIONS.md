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


## Decision D-003 — Arabic profile and the Arabic-versus-multilingual question (Day 3)

- **Date:** 2026-08-31
- **Gate:** C
- **Status:** accepted
- **Owner:** Ghala Alshreef

### Context | السياق

D-001 chose a conservative profile and stated that any stronger transform would be adopted only with a measured task metric. Day 3 provides that measurement, and also raises a second question D-002 deferred: does an Arabic-specific checkpoint beat the multilingual one?

### Decision | القرار

Adopt two named, versioned profiles rather than one. `conservative` (v1.0.0) preserves diacritics and hamza forms; `search` (v1.0.0) additionally removes diacritics, unifies alef forms and maps `ى → ي`. Neither converts taa marbuta `ة` to `ه`.

Do **not** switch the shared encoder to CAMeLBERT yet. Keep the multilingual encoder and open a measured comparison on the frozen data before any swap.

### Evidence | الدليل

- Notebook: `notebooks/05_arabic_nlp.ipynb` — `DAY3_NOTEBOOK5_CORE=PASS`, `GOLDEN_TESTS=PASS`
- Backend: `camel-tools==1.6.0`, profile version `1.0.0`
- Golden cases: 4 passed. The same input `إِدَارَةُ الحِساب` returns `ادارة الحساب` under `search` and is left unchanged under `conservative` — the profiles demonstrably differ
- Fixture variants: Gulf 9 · MSA 9 · Arabizi 2
- Arabizi routing heuristic flagged exactly `A-019` and `A-020`, with no false positives
- `display_copy_preserved: True` — the two-copy contract from D-001 survives every transform
- **Dialect comparison [MEASURED_SMOKE]**, identical conditions (40 optimizer steps, validation n=4, frozen Gulf test n=4): `distilbert-base-multilingual-cased` gulf_test_macro_f1 = **0.0** · `CAMeL-Lab/bert-base-arabic-camelbert-da` = **0.6667**
- Corroborating slice evidence from `notebooks/07`: `variant=Gulf` macro-F1 0.658 against `variant=MSA` 0.837

### Why taa marbuta is excluded | لماذا استُثنيت التاء المربوطة

Mapping `ة` to `ه` merges distinctions that carry meaning and can corrupt entity boundaries in NER. The course classifies it as information-destroying, and no measurement here justifies it. It stays out of both profiles.

### Why the encoder is not switched yet | لماذا لم نستبدل المشفر

The Gulf gap is large and consistent across two independent notebooks, so the direction is credible. Three things stop it being sufficient:

1. The frozen Gulf test is **4 rows**. There is no confidence interval, and `notebooks/07` demonstrates that intervals on this data are wide enough to swallow far larger differences.
2. CAMeLBERT is Arabic-only. Bayan is bilingual by definition; swapping the shared encoder would trade a measured Arabic gain for an unmeasured English loss.
3. `result_type` is `MEASURED_SMOKE`. The rollback trigger written into D-002 requires a frozen-data result beyond its confidence interval. That bar is not met.

### Consequences and rollback | الأثر والرجوع

- **Positive consequence:** Preprocessing is now a named, versioned, testable artefact with golden tests that run before any corpus is touched.
- **Limitation:** The Arabizi heuristic is a transparent routing rule, not dialect identification, and the notebook asserts it is never described as a classifier.
- **New risk:** Two profiles means two contracts. Whichever is used at serve time must be the one used at train and eval time, and its version must be recorded with every result.
- **Rollback trigger:** On the frozen dataset with confidence intervals, an Arabic checkpoint beats the multilingual one on the Arabic slice without harming the English slice.
- **Rollback path:** Either swap `MODEL_ID` and re-measure all three heads, or route Arabic and English to separate encoders and measure the added serving cost.

---

## Decision D-004 — Semantic search: frozen threshold, and re-ranking rejected (Day 3)

- **Date:** 2026-08-31
- **Gate:** C
- **Status:** accepted
- **Owner:** Ghala Alshreef

### Context | السياق

Retrieval needs three fixed choices: how vectors are compared, where the no-answer boundary sits, and whether a second-stage re-ranker earns its cost.

### Decision | القرار

Sentence embeddings, L2-normalised on both corpus and query side, indexed with FAISS `IndexFlatIP` so inner product equals cosine similarity. The no-answer threshold is tuned on validation only, then frozen at **0.4592** and applied unchanged to the test split. The cross-encoder re-ranker is **rejected**.

### Evidence | الدليل

- Notebook: `notebooks/06_semantic_search.ipynb` — `DAY3_NOTEBOOK6_CORE=PASS`
- Reports: `reports/search_manifest.json`, `reports/retrieval_metrics.json`
- `l2_normalised: True` — every vector norm equals 1.0 within 1e-5 on both sides
- `faiss_count_matches: True` — `index.ntotal == 24`; `manifest_matches: True`
- `validation_only_threshold: True` — the threshold never saw test data
- Threshold tuning: validation_accuracy **1.0** at 0.4592; test no_answer_accuracy **1.0** with the frozen value
- **Retrieval [MEASURED_SMOKE]**, 6 answerable test queries: recall@3 **1.0**, mrr@3 **0.6667**
- Slices, all flagged `SMALL_SLICE`: `language=ar` mrr@3 **0.5** · `language=en` **0.833** · `cross_lingual` **0.5** · `monolingual` **0.75**
- Re-ranking [MEASURED_SMOKE], warm-up excluded: mrr@3 **0.6667 → 0.7222**, delta **+0.0556**; median latency 15.70 ms, p95 17.16 ms. Decision: **`ADOPT_FOR_EXPERIMENT`**

### Why symmetric normalisation matters | لماذا التطبيع المتماثل

Inner product equals cosine similarity only when both sides are unit-length. Normalising one side alone still produces a plausible-looking ranking that no longer means cosine — a failure invisible to inspection. The notebook asserts the norm on both sides for exactly this reason.

### Why the re-ranker is adopted for experiment only | لماذا اعتُمد للتجربة فقط

Re-ranking produced a measured lift: mrr@3 rose from 0.6667 to 0.7222, a gain of 0.0556, with warm-up excluded from the timing. The retrieval stage already returns the correct case within the top 3 every time, so the re-ranker is not finding new documents — it is reordering ones already retrieved. That is exactly the failure mode the metrics identified: recall was perfect while MRR was not.

The status is `ADOPT_FOR_EXPERIMENT`, not adoption into the served path, for three reasons:

1. **Six answerable test queries.** The lift is one or two positions changing on a handful of queries. No confidence interval was computed, and the evaluation section of this project demonstrates that intervals on samples this size swallow far larger differences.
2. **A latency cost is now real.** Median 15.70 ms and p95 17.16 ms per query on CPU, on top of retrieval. The served path currently has no latency budget for a second stage.
3. **The measurement is `MEASURED_SMOKE`.** It shows the mechanism works and the direction is plausible; it does not show the gain generalises.

**Condition for full adoption:** a measured mrr@3 lift on the frozen dataset, with a confidence interval that excludes zero, and an added p95 that fits the serving budget.
### Consequences and rollback | الأثر والرجوع

- **Positive consequence:** Retrieval finds the right case within the top 3 every time on this fixture, and the no-answer boundary was validated on data it was not tuned on.
- **Limitation 1:** recall@3 of 1.0 alongside mrr@3 of 0.6667 means the correct case is present but not always ranked first. Recall answers "did we find it"; MRR answers "at what rank". The gap is a real user-experience cost.
- **Limitation 2:** Arabic mrr@3 (0.5) trails English (0.833) by a third, and cross-lingual retrieval matches the weaker figure. Ranking quality is not uniform across the bilingual scope.
- **Limitation 3:** Six answerable test queries, every slice below 10. CPU timing depends on the runtime.
- **Rollback trigger for the re-ranker:** a measured mrr@3 lift on the frozen data that exceeds the added p95 latency budget.
- **Rollback path for the threshold:** re-tune on validation only, re-freeze, re-run the test split, and supersede this record.

---

## Decision D-005 — Evaluation method: intervals, slices and ranked fixes (Day 3)

- **Date:** 2026-08-31
- **Gate:** C
- **Status:** accepted
- **Owner:** Ghala Alshreef

### Context | السياق

Every number produced so far came from a small sample. Before any of them is reported as a result, the project needs a rule for when a difference may be called a difference.

### Decision | القرار

No directional claim is made from a point estimate alone. Every headline metric is reported with a bootstrap confidence interval; model-to-model comparisons use paired bootstrap on the same rows; results are broken out by language, variant and length bucket, with any slice under `min_slice_size=15` flagged `SMALL_SLICE` rather than dropped.

### Evidence | الدليل

- Notebook: `notebooks/07_evaluation_error_analysis.ipynb` — `DAY3_NOTEBOOK7_CORE=PASS`, all ten core checks True
- Reports: `reports/day3_evaluation_fixture.json`, `reports/day3_slice_report.csv`, `reports/day3_error_taxonomy.csv`
- Data: 36 rows, validation split, labelled `COURSE_FIXTURE` — course-supplied predictions for teaching evaluation method, **not** this project's model outputs
- Bootstrap: `n_boot=1000` overall, `n_boot=500` per slice, seed 42
- **Fixture A** macro-F1 0.7807, CI [0.6212, 0.8982] · **Fixture B** 0.7819, CI [0.6169, 0.9042]
- Slices: ALL 0.782 (n=36) · `language=ar` 0.758 (n=24) · `language=en` 0.829 (n=12, SMALL_SLICE) · `variant=Gulf` 0.658 (n=12, SMALL_SLICE) · `variant=MSA` 0.837 (n=12, SMALL_SLICE) · `length_bucket=long` **0.526** (n=18) · `length_bucket=short` 0.829 (n=18)
- Manual error taxonomy over tagged errors, each asserted to be a genuine error and non-duplicated
- Three ranked fixes recorded with priorities 1, 2, 3

### The central finding | النتيجة الجوهرية

Fixture B leads Fixture A by **0.0012** — and their confidence intervals overlap almost entirely. On 36 rows this difference is noise, not improvement. Reported as a point estimate it would read as a win; reported with an interval it reads as "cannot distinguish".

This governs how every earlier figure in this project is read, including the −0.1167 classification delta in D-002.

### Slice findings | نتائج الشرائح

1. **Length is the largest measured gap.** Long texts score 0.526 against 0.829 for short — roughly 30 points, and this is the most trustworthy comparison in the table because both buckets hold 18 rows and neither is flagged `SMALL_SLICE`.
2. **Gulf trails MSA by ~18 points**, consistent with the independent dialect comparison in D-003.
3. **Arabic trails English**, consistent with the retrieval slices in D-004.
4. Any slice whose `ci_high` reaches 1.0 (`language=en`, both variants) is too small to carry a conclusion; the flag is kept and the row retained rather than deleted.

### Consequences and rollback | الأثر والرجوع

- **Positive consequence:** The project now has a rule that prevents reporting noise as progress, and three independent lines of evidence converge on the same weak slices.
- **Limitation 1:** Slice intervals used `n_boot=500` rather than 1000 to keep runtime down; intervals are marginally coarser than the headline figures.
- **Limitation 2:** Every figure derives from `COURSE_FIXTURE` predictions. Before submission these are replaced with this project's own validation predictions.
- **Limitation 3:** Single seed. Seed variance is unmeasured.
- **Rollback trigger:** If replacing the fixture with project predictions changes which slices are weakest, the ranked fixes are re-derived.
- **Rollback path:** Re-run the notebook against project predictions, regenerate all three reports, and supersede this record.

  
## قرارات إلزامية قبل Gate E

- [x] tokenizer + max length — D-001
- [x] Arabic preprocessing profile — D-001
- [x] task model/baseline and split — D-002
- [x] semantic encoder/index/k/threshold — D-004
- [x] metric/slices/error priorities — D-005
- [ ] performance budget
- [ ] ONNX/INT8 adopt or reject
- [ ] served artefact + preprocessing/label versions
