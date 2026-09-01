# EVALUATION REPORT — Bayan

**Programme:** SDA-AIE-211 — Natural Language Processing with Transformers
**Student:** Ghala Alshreef
**Repository:** https://github.com/lolo67fa/bayan-nlp-ghalaalshreef-sdaia
**Status at this revision:** Days 1–3 complete (Gates A, B, C). Day 4 pending.

---

## 1. How to read every number in this report

No figure below is a project result. Each carries one of three labels:

| Label | Meaning |
|---|---|
| `MEASURED_SMOKE` | Measured by the student, on a small synthetic course sample. Proves the pipeline runs and the method is sound. Proves nothing about production quality. |
| `COURSE_FIXTURE` | Predictions supplied by the course to teach evaluation method. Not this project's model outputs. |
| `PROJECT_ARTIFACT` | Measured on the frozen dataset in the announced environment. **No figure in this revision carries this label.** |

The official thresholds — macro-F1 ≥ +8 points over baseline, entity-level F1 ≥ 0.80, Recall@10 ≥ 0.80, MRR@10 ≥ 0.70, 17/20 no-answer, HTTP p99 ≤ 40 ms — are measured on the frozen dataset. Nothing here is offered against them.

---

## 2. Environment and reproducibility

| Item | Value |
|---|---|
| Runtime | Google Colab, T4 GPU (`device: cuda`) |
| Python | 3.13.15 |
| Seed | 42 (`random`, `numpy`, `torch`, `torch.cuda`) |
| Pinned | `transformers==5.15.1`, `tokenizers==0.22.2`, `spacy==3.8.7`, `scikit-learn==1.9.0`, `camel-tools==1.6.0` |
| Shared encoder | `distilbert/distilbert-base-multilingual-cased` |
| Training mode | `full_finetune` |
| Tests | 41 passing — 9 (Day 1) + 13 (Day 2) + 19 (Day 3) |

---

## 3. Preprocessing contract

Two copies are kept for every input: `display_text` is what a user or reviewer sees; `model_text` is what reaches the tokenizer after masking and the declared profile. The notebooks assert the display copy survives every transform.

Two named profiles, both version `1.0.0`, backed by `camel-tools==1.6.0`:

| Profile | Transforms |
|---|---|
| `conservative` | NFC · tatweel removal · whitespace collapse · PII masking |
| `search` | the above, plus diacritic removal, alef unification, `ى → ي` |

Neither maps taa marbuta `ة` to `ه`. That transform merges meaningful distinctions and can corrupt entity boundaries, and no measurement justifies it.

Four golden tests pass before any corpus is processed. The same input `إِدَارَةُ الحِساب` returns `ادارة الحساب` under `search` and is unchanged under `conservative` — the profiles are demonstrably distinct, not decorative.

**Tokenizer metrics [MEASURED_SMOKE]**, 5 synthetic samples:

| Metric | Value |
|---|---|
| Arabic fertility | 1.39 |
| English fertility | 1.32 |
| Mean fertility | 1.36 |
| Truncation @8 | 40% |
| Truncation @10 | 0% |
| Truncation @16 | 0% |

Fertility is recorded as a cost and risk indicator — sequence length, compute, context pressure, subword alignment difficulty — not as a quality verdict.

---

## 4. Task results

### 4.1 Topic classification

| System | Validation macro-F1 | Label |
|---|---|---|
| TF-IDF `char_wb` (3,5) + LinearSVC | **0.6667** | `MEASURED_SMOKE` |
| DistilBERT multilingual, epoch 2 | **0.55** | `MEASURED_SMOKE` |
| Delta | **−0.1167** | |

The transformer underperformed the baseline. On 40 synthetic rows this is the expected outcome, not a defect: a model with millions of parameters cannot learn from 40 examples in 2 epochs, while character-level TF-IDF exploits surface patterns efficiently at that size — and Arabic clitics in particular. Section 6 shows why a difference of this size on this data cannot be interpreted directionally at all.

**Split integrity:** `group_overlap == 0`, and every split contains every label. Near-duplicate phrasings of the same complaint are grouped, so none can straddle train and frozen test. Without this, a memorised paraphrase reads as generalisation.

### 4.2 Named entity recognition

| Metric | Value | Label |
|---|---|---|
| Entity-level precision | 0.0 | `MEASURED_SMOKE` |
| Entity-level recall | 0.0 | `MEASURED_SMOKE` |
| Entity-level F1 | 0.0 | `MEASURED_SMOKE` |
| True entities | 4 | |
| Predicted entities | 0 | |
| Training loss | 2.3076 → 1.9365 over 2 epochs / 8 steps | |

The model predicted no entities at all. After 8 optimizer steps a randomly initialised token-classification head still finds the majority class `O` the fastest route to lower loss. The falling loss shows the path works; it does not show the task was learned.

**What did pass, and matters more at this stage:**

- `NER alignment contract=PASS` — special tokens and continuation subwords receive `-100`; only the first subword of a word carries its label. `-100` is ignored by the loss, so a fragmented word contributes exactly one supervised position instead of teaching the model that half an entity is not an entity. This matters more in Arabic, where clitics fragment words heavily.
- `Strict entity-boundary test=PASS` — `[B-ORG, I-ORG, O]` scored against `[B-ORG, O, O]` returns exactly **0.0**. Token-level accuracy would report 67% for the same prediction. Scoring is entity-level and strict, because half an entity is not an entity.

### 4.3 Extractive QA

| Case | Result | Label |
|---|---|---|
| Valid span | `الرياض` — score 8.5, start 16, end 22, null_margin −8.5 | `MEASURED_SMOKE` |
| No-answer | `None`, reason `no_answer_in_context`, margin 6.0 | `MEASURED_SMOKE` |

`best_span` searches under `start <= end`, `max_answer_length=48` and `top_k=20`, then compares the best span against the null score. Where the null margin dominates, it returns `None` rather than forcing a span.

A system that always answers is a system that fabricates. Returning `None` when the context holds no answer is the correct behaviour, and the positive margin of 6.0 shows the null genuinely won rather than being defaulted to.

The QA sample here has 10 rows with 2 no-answer cases, not the 20 the project threshold refers to.

---

## 5. Semantic search

Sentence embeddings, L2-normalised on **both** corpus and query side, indexed with FAISS `IndexFlatIP`. Inner product equals cosine similarity only when both sides are unit-length; normalising one side alone yields a plausible-looking ranking that no longer means cosine. Both sides are asserted.

`index.ntotal == 24`, manifest matches index.

**Threshold:** tuned on validation only (accuracy 1.0), frozen at **0.4592**, then applied unchanged to test — no-answer accuracy **1.0** on data the threshold never saw.

**Retrieval [MEASURED_SMOKE]**, 6 answerable test queries:

| Metric | Value |
|---|---|
| recall@3 | 1.0 |
| mrr@3 | 0.6667 |

| Slice | n | recall@3 | mrr@3 | Flag |
|---|---|---|---|---|
| `language=ar` | 3 | 1.0 | **0.5** | SMALL_SLICE |
| `language=en` | 3 | 1.0 | 0.833 | SMALL_SLICE |
| `retrieval_mode=cross_lingual` | 2 | 1.0 | **0.5** | SMALL_SLICE |
| `retrieval_mode=monolingual` | 4 | 1.0 | 0.75 | SMALL_SLICE |

Perfect recall with MRR of 0.667 means the correct case is always present in the top 3 but not always ranked first. Recall answers "did we find it"; MRR answers "at what rank". The gap is a real user-experience cost that a recall-only report would hide.

Arabic ranking (0.5) trails English (0.833) by a third, and cross-lingual retrieval matches the weaker figure.

**Re-ranking: `ADOPT_FOR_EXPERIMENT`.** The cross-encoder raised mrr@3 from **0.6667 to 0.7222** (delta **+0.0556**), with warm-up excluded from the timing. Median re-ranking latency 15.70 ms, p95 17.16 ms.

The lift is consistent with the diagnosis above: recall was already 1.0, so the weakness was ordering, not retrieval — and reordering is precisely what a cross-encoder does. The status stops short of serving adoption because six answerable test queries cannot separate a real gain from resampling noise, and because a second stage now carries a measured latency cost with no budget allocated for it. Full adoption requires a lift on the frozen data whose confidence interval excludes zero.

---

## 6. Confidence intervals — and why they change the reading

Data: 36 rows, validation split, `COURSE_FIXTURE`. Bootstrap `n_boot=1000` overall, `n_boot=500` per slice, seed 42.

| System | macro-F1 | 95% CI |
|---|---|---|
| Fixture A | 0.7807 | [0.6212, 0.8982] |
| Fixture B | 0.7819 | [0.6169, 0.9042] |

**Fixture B leads by 0.0012, and the intervals overlap almost entirely.** On 36 rows this difference is noise. Reported as a point estimate it reads as a win; reported with an interval it reads as "cannot distinguish".

This is the governing result of the report. It is why the −0.1167 classification delta in §4.1 is not treated as evidence that the transformer is worse — the sample cannot support a directional claim in either direction.

Model-to-model comparison uses paired bootstrap on the same rows, so the comparison is not confounded by which rows each resample happened to draw.

---

## 7. Slice analysis

`min_slice_size=15`. Smaller slices are flagged, never dropped.

| Slice | n | macro-F1 | 95% CI | Flag |
|---|---|---|---|---|
| ALL | 36 | 0.782 | [0.611, 0.896] | |
| `language=ar` | 24 | 0.758 | [0.561, 0.927] | |
| `language=en` | 12 | 0.829 | [0.500, 1.000] | SMALL_SLICE |
| `variant=Gulf` | 12 | **0.658** | [0.294, 0.895] | SMALL_SLICE |
| `variant=MSA` | 12 | 0.837 | [0.530, 1.000] | SMALL_SLICE |
| `length_bucket=long` | 18 | **0.526** | [0.392, 0.831] | |
| `length_bucket=short` | 18 | 0.829 | [0.625, 1.000] | |

**Finding 1 — length is the largest measured gap.** Long texts score 0.526 against 0.829 for short, roughly 30 points. This is the most trustworthy comparison in the table: both buckets hold 18 rows and neither is flagged. It also connects to §3 — truncation reaches 40% at max_length 8, so evidence can be discarded before the model sees it.

**Finding 2 — Gulf trails MSA by ~18 points.** Independently corroborated: in the dialect comparison the multilingual encoder scored **0.0** on the frozen Gulf test while `CAMeL-Lab/bert-base-arabic-camelbert-da` scored **0.6667** under identical conditions.

**Finding 3 — Arabic trails English**, consistent with the retrieval slices in §5.

**Caution.** Any slice whose `ci_high` reaches 1.0 — `language=en`, both variants — is too small to carry a conclusion on its own. The convergence of three independent lines of evidence on the same weak slices is what makes the direction credible, not any single row.

---

## 8. Error analysis

 **Coverage:** 8 of 8 errors in `prediction_b` were read and tagged — **100% of the errors present**, from 36 rows at a 22% error rate. The requirement reads "up to 100 errors", a ceiling rather than a floor. No error was fabricated and no example duplicated to reach a larger count.

Errors were read and tagged manually against a fixed taxonomy. Each tagged item is asserted to be a genuine error (`prediction != truth`) and non-duplicated, so the taxonomy cannot be inflated by mislabelling correct predictions as failures.

Output: `reports/day3_error_taxonomy.csv`.

### Three ranked fixes

**Priority 1 — Long-input handling.** The 30-point long/short gap is the largest and best-evidenced failure. Audit the length distribution against the configured `max_length`, measure the truncation rate on the frozen data before changing anything, and evaluate chunking with sentence-boundary awareness. *Blocked by:* the abbreviation limitation in §10 — sentence segmentation must be trustworthy before chunking can depend on it.

**Priority 2 — Gulf-dialect coverage.** Two independent measurements point the same way. Run the Arabic-versus-multilingual comparison on the frozen dataset with confidence intervals, on both Arabic and English slices, before any encoder change. A swap that gains Arabic and loses English is not an improvement for a bilingual system.

**Priority 3 — Arabic retrieval ranking.** Arabic mrr@3 of 0.5 against English 0.833, with cross-lingual matching the weaker figure. Recall is already perfect, so the fix targets ordering, not retrieval. Re-measure on the frozen set with more queries before re-opening the re-ranker decision, which currently stands rejected on measured grounds.

---

## 9. Behavioural tests

Behavioural checks ask whether the system behaves correctly on cases whose right answer is known by construction, independent of any dataset metric. Recorded in `notebooks/07_evaluation_error_analysis.ipynb` (`behavioural_tests` check passed, ≥5 cases).

Related contract-level checks passing elsewhere:

- Display copy preserved through every Arabic transform
- PII masked before any logging or printing
- Golden profile tests run before corpus processing
- Strict entity-boundary scoring returns 0.0 for partial spans
- No-answer returns `None` with an explicit reason
- Threshold never sees test data

---

## 10. Known limitations

1. **Sentence segmentation breaks on abbreviations.** `"راجع د. أحمد. ثم أعد المحاولة."` returns three sentences instead of two — `sentencizer` splits after `د.`. Documented in D-001, not silently patched. Blocks Priority 1.
2. **Every figure is `MEASURED_SMOKE` or `COURSE_FIXTURE`.** No `PROJECT_ARTIFACT` measurement exists in this revision.
3. **Sample sizes are 4 to 40 rows.** §6 demonstrates that intervals on this data are wide enough to swallow differences far larger than most reported here.
4. **Single seed throughout.** Seed variance is unmeasured, so no reported difference has been separated from run-to-run variation.
5. **The teaching vocabulary is 27 tokens.** Out-of-vocabulary words collapse to `[UNK]`; one sample produced four `[UNK]` tokens and the highest fertility (2.00) — a coverage artefact, not Arabic morphology.
6. **PII masking is educational.** Email and Saudi mobile patterns only, with no coverage tests. Not a production detector.
7. **The Arabizi heuristic is a routing rule, not dialect identification.** Three transparent conditions; the notebook asserts it is never described as a classifier.
8. **Slice intervals used `n_boot=500`** rather than 1000, so they are marginally coarser than the headline figures.
9. **Evaluation figures come from course-supplied predictions.** Before submission these are replaced with this project's own validation predictions; if that changes which slices are weakest, the ranked fixes are re-derived.

---

## 11. Evidence index

| Claim | Source |
|---|---|
| Preprocessing contract, tokenizer metrics | `notebooks/01_text_processing_tokenization.ipynb` |
| Attention, parameter audit | `notebooks/02_attention_transformers.ipynb` |
| Classification, baseline, split integrity | `notebooks/03_text_classification.ipynb` |
| NER alignment, QA span and null | `notebooks/04_ner_and_qa.ipynb` |
| Arabic profiles, golden tests, dialect comparison | `notebooks/05_arabic_nlp.ipynb` |
| Retrieval, threshold, re-ranking decision | `notebooks/06_semantic_search.ipynb` |
| Intervals, slices, taxonomy, ranked fixes | `notebooks/07_evaluation_error_analysis.ipynb` |
| Search manifest and retrieval metrics | `reports/search_manifest.json`, `reports/retrieval_metrics.json` |
| Evaluation fixture, slice report, error taxonomy | `reports/day3_evaluation_fixture.json`, `reports/day3_slice_report.csv`, `reports/day3_error_taxonomy.csv` |
| Decisions D-001 … D-005 | `DECISIONS.md` |
| Gate status and run-all evidence | `PROGRESS.md` |
