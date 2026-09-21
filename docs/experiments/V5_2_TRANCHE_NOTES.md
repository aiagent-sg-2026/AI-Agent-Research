# V5.2 Representative Tranche — Three-Pair Construction

Status: **CORPUS VALIDATED — NO MODEL CALIBRATION AUTHORIZED OR EXECUTED**

This tranche implements the first three V5.2 calibration/formal sibling pairs:

1. V52-P01 — generation-aware manifest/route cache;
2. V52-P02 — framed telemetry/audit stream lifecycle;
3. V52-P03 — deterministic virtual-clock payment/search circuit breaker.

The calibration and formal siblings use different domain/surface details while preserving the same mechanism family and comparable structural complexity.

## Independent repair after authoring job

The initial corpus-authoring Codex job ended CODEX_TASK_BLOCKED. Its partial output was inspected rather than rerun. The first draft's validator passed despite violating the frozen redesign: it had only three hidden cases per sibling, 2–14 LOC baselines in most fixtures, non-visible-preserving mutants, and the circuit-breaker driver bypassed the breaker by invoking operations directly.

Those defects were repaired without running any benchmark model cells. The validator was strengthened so these conditions now fail closed.

## Verified tranche gates

npm run v52:tranche:validate checks all six siblings and requires:

- 6–12 candidate-visible files;
- 25–80 logical LOC realistic partial baseline;
- 6–9 public rule IDs;
- 6–10 hidden cases;
- at least two hidden cases combining three or more public rules;
- callable surface, state model, event ordering, abort/error precedence, identity/mutation rules, and public trace schema;
- every asserted hidden trace mapped to the public trace rule and limited to public event names;
- baseline visible PASS / hidden FAIL;
- reference visible PASS / hidden PASS;
- at least five mutants per sibling;
- every mutant visible PASS / hidden FAIL on a case covering its declared target rule;
- candidate leakage rejection;
- freshness against V5 and V5.1 contract/solution artifacts;
- sibling structural comparability;
- calibration and formal execution authorization both false.

Verified shape:

| Sibling | Files | Baseline LOC | Rules | Hidden cases | 3+ rule cases | Mutants |
|---|---:|---:|---:|---:|---:|---:|
| P01 calibration | 6 | 39 | 6 | 6 | 4 | 5 |
| P01 formal | 6 | 39 | 6 | 6 | 4 | 5 |
| P02 calibration | 6 | 62 | 6 | 6 | 5 | 5 |
| P02 formal | 6 | 62 | 6 | 6 | 5 | 5 |
| P03 calibration | 6 | 56 | 6 | 6 | 5 | 5 |
| P03 formal | 6 | 55 | 6 | 6 | 5 | 5 |

This is a construction tranche only. The full V5.2 design remains 12 pairs / 48 possible calibration cells, followed by selection of six formal siblings for a 72-cell formal matrix only after a separately authorized successful calibration. No calibration plan, model candidate call, or formal benchmark was run here.
