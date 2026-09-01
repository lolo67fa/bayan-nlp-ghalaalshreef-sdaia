# BENCHMARKS — Bayan

## 1. Claim boundary | حدود الادعاء

- **Result label:** `MEASURED` · **Artefact role:** `PROJECT_ARTIFACT`
- **Task:** Bilingual (ar/en) topic classification, served behind a versioned FastAPI contract
- **Decision date:** 2026-08-31
- **Author:** Ghala Alshreef
- **Decision scope:** `PROJECT_BUDGET_DECISION` — this selects the serving runtime for this project on the declared workload and device. It is **not** a claim about production capacity, nor about the official `p99 ≤ 40 ms at 16 concurrent` requirement, which is measured on the frozen dataset in the announced measurement environment.
- **Generated report:** `reports/benchmark_results.json`

## 2. Performance budget — written before candidates

| Constraint | Value | Source |
|---|---|---|
| p95 latency | 1000 ms | Student-defined for a Colab CPU target before any candidate ran |
| minimum throughput | 0.1 items/s | Same |
| maximum quality tax | 0.05 macro-F1 | Same |
| target device | `colab-cpu` | Same |

- **Budget provenance:** `STUDENT_DEFINED_BEFORE_MEASUREMENT`
- The notebook asserts this literal value before any candidate is measured. A budget written afterwards is not a budget; it is a justification for whatever number appeared.
- **Evidence:** `notebooks/08_optimization_serving.ipynb`, configuration cell, commit `dc95a52`

## 3. Reproduction contract

| Item | Value |
|---|---|
| Colab runtime / Python | Google Colab, Python 3.13.15 |
| Platform | Linux-6.6.122+-x86_64-with-glibc2.35 |
| Device / provider | `cpu` / `CPUExecutionProvider` |
| Library versions | torch 2.11.0+cu128 · onnx 1.22.0 · onnxruntime 1.29.0 · transformers 5.15.1 · tokenizers 0.22.2 |
| Model ID | `distilbert/distilbert-base-multilingual-cased`, fine-tuned for this project |
| Model state SHA-256 | `e3f69650dcf31b0e04c23e4c1a8cbecd22b384e282081c76fd99db14bd3a76ae` |
| Preprocessing version | `ar-en-v1` (conservative profile, `1.0.0`) |
| Label map | 4 topics: digital_service, health, permit, transport |
| Workload SHA-256 | `9b07010d0e607282b66a0a1b1096175fd6015a237577db26bf03366393e077d8` |
| Split | validation |
| Examples | 8 rows (ar + en) |
| Length distribution | p50 = 11, p95 = 14.65, max = 15 tokens |
| Batch size | 4 |
| Padding / max length | dynamic padding, `max_length` = 96 |
| Would truncate | 0 of 8 |
| Warm-up / repetitions | 5 / 30 |
| Measured boundary | model-only (primary); PyTorch end-to-end (secondary) |
| Memory method | process RSS at start and observed peak; **approximate** |

## 4. Controlled candidates

| ID | Candidate | Change | Artefact size | SHA-256 |
|---|---|---|---|---|
| A | PyTorch FP32 | baseline | 516.23 MiB | `e3f69650dc…` |
| B | ONNX Runtime FP32 | export + runtime | 516.35 MiB | `13dccd6bbb…` |
| C | ONNX Runtime dynamic INT8 | weight quantisation | 129.45 MiB | `9b0eb1d90e…` |

All three ran on the identical workload, device, batch size and boundary. Otherwise the comparison would not be a comparison.

## 5. Parity

| Pair | max abs logits diff | mean abs diff | prediction agreement | Verdict |
|---|---|---|---|---|
| A vs B | 2.05e-07 | 5.93e-08 | 1.000 | **PASS** |
| A vs C | 4.20e-02 | 1.37e-02 | **0.625** | **FAIL** |

- **Tolerance chosen before inspection:** `max_abs_logits_diff < 1e-3` **and** `prediction_agreement == 1.0`
- **Rationale:** a small numerical difference is not sufficient evidence. A tiny shift can flip a prediction near a decision boundary, so both conditions must hold. Candidate C illustrates the point exactly: its logits move by only 0.042, yet three of eight predictions change.

## 6. Performance results

Model-only boundary, warm-up excluded, 30 repetitions, 8 items per call.

| ID | p50 ms | p95 ms | p99 ms | mean ms | throughput items/s | p95 speed-up |
|---|---|---|---|---|---|---|
| A | 213.41 | 1107.05 | 1168.87 | 369.45 | 21.65 | 1.00× |
| B | 118.85 | **137.12** | 160.23 | 121.46 | 65.87 | **8.07×** |
| C | 77.27 | 85.41 | 89.32 | 77.92 | 102.67 | 12.96× |

PyTorch end-to-end (tokenisation + model), secondary: p50 160.34 · p95 177.36 · p99 179.74 ms.

⚠️ Candidate A shows a wide gap between p50 (213 ms) and p95 (1107 ms) — a long tail typical of a shared Colab CPU under scheduler contention. This is a property of the measurement environment, not of the model.

Memory deltas were at or near zero for all candidates (RSS method is approximate and dominated by process baseline, so no memory claim is made).

## 7. Quality results

- **Primary metric:** macro-F1 on the same 8 validation rows used for latency
- **Evaluation file / split:** project validation split, `validation.csv`

| ID | macro-F1 | quality tax | Within 0.05 budget? |
|---|---|---|---|
| A | 0.550 | 0.000 | — (reference) |
| B | 0.550 | **0.000** | ✅ yes |
| C | 0.325 | **0.225** | ❌ no — 4.5× the budget |

Quality tax is computed on the identical examples used for the latency measurement, so speed and quality are not read from different data.

## 8. Budget verdict and decision

| Candidate | latency OK | throughput OK | quality OK | Overall |
|---|---|---|---|---|
| B — ONNX FP32 | ✅ | ✅ | ✅ | **PASS** |
| C — ONNX INT8 | ✅ | ✅ | ❌ | **FAIL** |

- **Selected runtime:** `onnx-fp32`
- **Decision:** **`ADOPT_ONNX_FP32`**
- **Evidence-based reason:** B is 8.07× faster at p95 than the PyTorch reference with **exact** prediction parity and a quality tax of zero. It meets every budget constraint that was written before it ran.
- **Why C was rejected despite being fastest:** C is the fastest candidate and a quarter of the size, and it is rejected anyway. Its prediction agreement is 0.625 — three of eight predictions change — and its quality tax of 0.225 is 4.5× the declared budget. Speed bought at the cost of correctness is not an optimisation. Recording the rejection is part of the result; hiding a candidate that looked good on latency would misrepresent the search.
- **Known limitations and noise sources:**
  1. The workload is **8 rows** on a shared Colab CPU. Absolute latency is environment-dependent and will not transfer.
  2. Candidate A's p50/p95 gap indicates scheduler contention during measurement.
  3. Memory figures use approximate RSS and support no claim.
  4. Single seed; run-to-run variance is unmeasured.
  5. `p95 = 137 ms` here says nothing about the official `p99 ≤ 40 ms at 16 concurrent` target, which is measured elsewhere on frozen data.
- **FP32 rollback path:** re-export from the recorded `MODEL_SOURCE`; weights stay outside GitHub. Only reports and hashes are committed.

## 9. Reproduction commands

```bash
git clone https://github.com/lolo67fa/bayan-nlp-ghalaalshreef-sdaia.git
cd bayan-nlp-ghalaalshreef-sdaia
pip install -r requirements-day4.txt

# Open notebooks/08_optimization_serving.ipynb in Google Colab, then:
#   1. Set PROJECT_MODE = True
#   2. Point PROJECT_MODEL_SOURCE / PROJECT_TOKENIZER_SOURCE at the saved checkpoint
#   3. Point PROJECT_VALIDATION_CSV at the validation split
#   4. Confirm BUDGET_PROVENANCE = "STUDENT_DEFINED_BEFORE_MEASUREMENT"
#   5. Runtime → Restart session and run all

PYTHONPATH=src python -m pytest -q tests/test_day4_benchmarking.py tests/test_day4_serving.py
```

No tokens or secrets are required. Model weights are not distributed; the recorded SHA-256 identifies the exact artefact measured.

## 10. Integrity check

- [x] Budget predates candidate results — asserted in the notebook before any candidate runs.
- [x] Same workload, device, batch size and boundary for all three candidates.
- [x] Warm-up excluded — 5 warm-up calls discarded before timing.
- [x] 30 measured repetitions.
- [x] p50, p95, p99 and throughput reported for every candidate.
- [x] Memory wording states the RSS method and its approximation.
- [x] Quality tax computed on the same examples as latency.
- [x] Failed and slower candidates are not hidden — INT8 is reported with its failure.
- [x] All numbers are `MEASURED` from this project's own run, not copied references.
- [x] No weights, ONNX artefacts, cache, secrets or PII committed — artefacts stay in `/content/`, only reports and hashes are tracked.
