> **Retrospective status (2026-09-18): corpus validity audit found one direct visible/hidden contradiction and several underspecified hidden rules. Treat V4 as diagnostic execution evidence only; do not use it for delivery-mechanism conclusions. See `docs/experiments/V4-validity-postmortem.md`.**

# Agent Quality Benchmark V4 — Formal Results

## Verification status

- Formal job completed successfully against base commit `48d784ddde3d38444be1f004ed1fae1639685e75`.
- Frozen input verification (`npm run v4:verify`) passed immediately before this independent evidence replay.
- Matrix: exactly 72 unique cells = 6 tasks × 4 arms × 3 trials; seed `20260918`; no duplicate task-arm-trial tuple.
- Provenance: 72/72 valid cells pinned and verified as `gpt-5.6-luna`, effort `medium`, Codex CLI `0.153.4`.
- Independent non-model replay: visible tests, hidden graders, changed-file scope, and stored diffs matched the recorded evidence for all 72 cells.
- Infrastructure-invalid cells: 0/72. Retries: 0 total.

## Overall evidence

- Success: 12/72 (16.7%). Hidden acceptance: 12/72. Visible tests/regression-free: 59/72. Allowed-scope compliant: 71/72.
- Failure classes: REGRESSION=13, SCOPE_VIOLATION=1, TASK_LOGIC=46.
- Token telemetry: 49/72 cells. Observed partial total: 7,045,392 tokens (6,864,844 input; 180,548 output). Because coverage is incomplete, efficiency comparison is **unavailable**; partial token totals must not be compared across arms.
- Mean recorded latency: 100.59s per cell. This is descriptive runtime telemetry, not a quality substitute.
- Anti-ceiling gate: **satisfied** because valid non-infrastructure correctness failures exist. The correctness ceiling was therefore escaped; latency/token observations are not being used as substitutes for correctness.

## By arm

| Arm | Success | Bernoulli variance | Observed tokens | Mean latency | Retries | Failure classes |
|---|---:|---:|---:|---:|---:|---|
| A0 | 3/18 (16.7%) | 0.1389 | 1,969,329 (13/18 cells; partial) | 99.83s | 0 | REGRESSION=3, TASK_LOGIC=12 |
| A1 | 3/18 (16.7%) | 0.1389 | 1,912,994 (13/18 cells; partial) | 99.81s | 0 | REGRESSION=3, TASK_LOGIC=12 |
| A2 | 3/18 (16.7%) | 0.1389 | 1,341,134 (10/18 cells; partial) | 101.70s | 0 | REGRESSION=4, TASK_LOGIC=11 |
| A3 | 3/18 (16.7%) | 0.1389 | 1,821,935 (13/18 cells; partial) | 101.02s | 0 | REGRESSION=3, SCOPE_VIOLATION=1, TASK_LOGIC=11 |

All four delivery arms achieved exactly 3/18 successes (16.7%). On this held-out corpus, the observed correctness result does **not** identify a winning delivery mechanism. The successful cells were concentrated in the interleaving-cache task, so the pattern is task-dominated rather than evidence of an arm advantage.

## By task

| Task | Success | Bernoulli variance | Observed tokens | Mean latency | Retries | Failure classes |
|---|---:|---:|---:|---:|---:|---|
| V4-01-versioned-contract | 0/12 (0.0%) | 0.0000 | 1,531,868 (12/12 cells; partial) | 79.87s | 0 | REGRESSION=12 |
| V4-02-migration-rollback | 0/12 (0.0%) | 0.0000 | 1,443,218 (10/12 cells; partial) | 102.43s | 0 | TASK_LOGIC=12 |
| V4-03-interleaving-cache | 12/12 (100.0%) | 0.0000 | 981,399 (6/12 cells; partial) | 115.17s | 0 | none |
| V4-04-stream-cancellation | 0/12 (0.0%) | 0.0000 | 581,475 (3/12 cells; partial) | 117.54s | 0 | REGRESSION=1, SCOPE_VIOLATION=1, TASK_LOGIC=10 |
| V4-05-capability-negotiation | 0/12 (0.0%) | 0.0000 | 873,053 (6/12 cells; partial) | 108.22s | 0 | TASK_LOGIC=12 |
| V4-06-legacy-compatibility | 0/12 (0.0%) | 0.0000 | 1,634,379 (12/12 cells; partial) | 80.30s | 0 | TASK_LOGIC=12 |

## Interpretation boundaries

- This report is descriptive. With 3 trials per arm-task cell, it does not claim statistical equivalence or causal superiority.
- The mechanism-claim evidence gate is open because correctness failures are present, but the arm-level correctness rates are identical; therefore no delivery-mechanism winner is claimed.
- Token efficiency is intentionally not ranked because only 49/72 cells have token telemetry.
- No failed benchmark cell was rerun with a model, and no benchmark input or evaluator was changed.

## Verification artifact

`/tmp/v4-independent-verification.json` contains the independent aggregation used to produce this report; it is intentionally not committed as benchmark evidence because it is a derived local audit artifact.
