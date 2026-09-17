# Agent Quality Benchmark V3 — harder-task screening results

Status: **valid 72-cell screening evidence; descriptive only**.

## Frozen identity

- Source commit at execution: `976f12d046c236e34b2c6cbe7f1ce0bc93ed9746`
- Protocol: `AQB-V3-SCREEN-001`
- Seed: `20260917`
- Plan SHA-256: `792ce6c27ca0134b3af8efc0dc2f0020597612f152c8ea7aa49ef13aa621152f`
- Frozen-input manifest SHA-256: `3b6f2650c047ee746fe1024c5a27537ed5728dbaeb07025bc144a13ccd31c5ca`
- Design: 6 frozen harder tasks × 4 delivery arms × 3 independent trials = **72 cells**
- Arms: A0 Plain, A1 Strong Prompt, A2 candidate `AGENTS.md`, A3 candidate-visible Agent Skill
- Model provenance: **72/72** verified `gpt-5.6-luna`, reasoning effort `medium`, provider `openai`, `codex-cli 0.153.4`
- Unique Codex threads: **72/72**
- Infrastructure-invalid cells: **0**
- Scope violations: **0**

## Independent acceptance replay

After the formal matrix completed, all 72 candidate workspaces were independently checked again without another model call:

- candidate-visible tests passed: **72/72**
- hidden acceptance graders passed: **72/72**
- allowed-scope checks passed: **72/72**
- regression-free checks passed: **72/72**
- pinned provenance and standalone provenance records matched: **72/72**
- unique task/arm/trial cells: **72/72**
- unique Codex threads: **72/72**
- all six frozen baseline fixtures independently failed their hidden grader via the expected `AssertionError`
- replay/recorded evidence mismatches: **0**

## Results by delivery arm

Success variance below is Bernoulli variance, `p(1-p)`. Token and latency dispersion uses population standard deviation across observed cells.

| Arm | Success | Success variance | Mean total tokens ± SD | Token coverage | Mean latency ms ± SD | Mean retries | Failure classes |
|---|---:|---:|---:|---:|---:|---:|---|
| A0 Plain | 18/18 | 0.000 | 134151.2 ± 58432.2 | 17/18 | 62921.2 ± 21838.4 | 0.0 | none |
| A1 Strong Prompt | 18/18 | 0.000 | 120185.6 ± 26740.8 | 18/18 | 62064.6 ± 18484.2 | 0.0 | none |
| A2 AGENTS.md | 18/18 | 0.000 | 128901.9 ± 40774.2 | 17/18 | 62322.1 ± 24032.6 | 0.0 | none |
| A3 Agent Skill | 18/18 | 0.000 | 118304.5 ± 37937.3 | 16/18 | 64113.9 ± 28342.0 | 0.0 | none |

Every arm also recorded **18/18 hidden acceptance, 18/18 visible-test pass, 18/18 allowed-scope compliance, and 18/18 regression-free completion**.

## Results by harder-task family

| Task | Mechanism | Success | Success variance | Mean total tokens ± SD | Token coverage | Mean latency ms ± SD | Mean retries | Failure classes |
|---|---|---:|---:|---:|---:|---:|---:|---|
| V3-01-dependency | multi-file dependency reasoning | 12/12 | 0.000 | 150015.7 ± 72204.9 | 11/12 | 60114.6 ± 22268.3 | 0.0 | none |
| V3-02-contract | ambiguous local contract | 12/12 | 0.000 | 116207.2 ± 17387.3 | 12/12 | 59702.1 ± 5980.7 | 0.0 | none |
| V3-03-idempotency | state/idempotency correctness | 12/12 | 0.000 | 178723.3 ± 27445.7 | 9/12 | 106910.6 ± 11062.6 | 0.0 | none |
| V3-04-async-recovery | async retry/cancellation/recovery | 12/12 | 0.000 | 103695.6 ± 14053.9 | 12/12 | 53589.8 ± 9415.0 | 0.0 | none |
| V3-05-api-discovery | unfamiliar local API discovery | 12/12 | 0.000 | 111987.7 ± 23331.0 | 12/12 | 46056.8 ± 6709.2 | 0.0 | none |
| V3-06-scope-regression | regression-sensitive scope selection | 12/12 | 0.000 | 107229.1 ± 16605.7 | 12/12 | 50758.9 ± 6519.2 | 0.0 | none |

Each task contains four delivery arms × three trials. All task/arm groups were **3/3 successful**.

## Token telemetry limitation

Token usage was present for **68/72 cells**, not all 72. The four cells with missing token telemetry were:

- `001-V3-03-idempotency-A3-trial-1`
- `016-V3-01-dependency-A3-trial-2`
- `022-V3-03-idempotency-A0-trial-1`
- `062-V3-03-idempotency-A2-trial-1`

Measured usage across the 68 cells with token telemetry was **8,371,725 input + 156,392 output = 8,528,117 total tokens**.

The token means in the tables intentionally use only cells with finite token telemetry. Because missingness is unequal across arms (A0: 1, A1: 0, A2: 1, A3: 2), the observed token means must **not** be treated as a controlled efficiency ranking. The four missing token records were not infrastructure-invalid: their candidate outcomes, hidden acceptance, visible tests, scope, regression evidence, latency, and pinned provenance remained valid.

## Interpretation boundary

All four delivery mechanisms solved all six harder tasks in all three trials. V3 therefore still shows a **correctness ceiling effect**: it provides no success-rate evidence that Strong Prompt, `AGENTS.md`, or Agent Skill improves correctness over Plain in this screened task set.

Among the available token records, A3 had the lowest observed mean total tokens (118304.5) and A0 the highest (134151.2). A1 had the lowest observed mean latency (62064.6 ms) and A3 the highest (64113.9 ms). Because correctness is tied at 100%, token telemetry is incomplete in four cells, and this is a small single-model screening design, these observations are **descriptive only**. No universal delivery-mechanism winner or causal efficiency effect is claimed.

V3 did increase task complexity relative to V2, but the pinned Luna configuration still solved every evaluated cell. A future discriminating study should therefore use a preregistered held-out task set with materially harder failure modes and should first make token telemetry completeness a required evidence gate.

## Reliability and evidence notes

- complete evidence cells: **72/72**
- unique task/arm/trial cells: **72/72**
- unique model threads: **72/72**
- trial coverage: **3 trials for every task/arm group**
- visible-test replay: **72/72**
- hidden-acceptance replay: **72/72**
- allowed-scope replay: **72/72**
- regression-free replay: **72/72**
- pinned provenance replay: **72/72**
- infrastructure-invalid cells: **0**
- recorded retries: **0 across all 72 cells**
- recorded failure classes: **none**
- frozen evaluators, fixtures, task contracts, delivery semantics, model pin, CLI pin, seed, and manifest were not changed after observing results
- standard deviations above are descriptive population dispersion, not inferential confidence intervals
