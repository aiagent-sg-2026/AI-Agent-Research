# V5.2 Representative Corpus — Six-Pair Construction

Status: **6/12 PAIRS CONSTRUCTED AND VALIDATED — NO MODEL CALIBRATION AUTHORIZED OR EXECUTED**

The V5.2 corpus currently contains six calibration/formal sibling pairs:

1. V52-P01 — generation-aware manifest/route cache;
2. V52-P02 — framed telemetry/audit stream lifecycle;
3. V52-P03 — deterministic virtual-clock payment/search circuit breaker;
4. V52-P04 — worker lease/document lock ownership;
5. V52-P05 — order/notification transactional outbox;
6. V52-P06 — workspace/report permission inheritance.

Calibration and formal siblings use different domain/surface details while preserving mechanism family and comparable structural complexity.

## Authoring-job inspection history

Tranche 1's Codex authoring job ended CODEX_TASK_BLOCKED. Its partial output was inspected instead of rerun. Independent review found weak hidden coverage, undersized baselines, non-visible-preserving mutants, and a circuit-breaker driver that bypassed the breaker. Those defects were repaired and the validator was strengthened.

Tranche 2's Codex authoring job 45fb2e41-4a19-4fc3-b873-30b3b5064630 also ended CODEX_TASK_BLOCKED with retryRecommended=false. Its files were inspected rather than rerun. Although the then-current validator passed, manual protocol audit found P04-P06 candidate contracts had been copied from a generic skeleton: the outbox contract still described lease ownership/stale actors, and permission contracts did not state their real precedence semantics. P04-P06 were therefore rewritten around their actual mechanisms before acceptance.

No benchmark candidate/model cell was called during either repair.

## Current protocol semantics

P04 explicitly publishes acquisition/lock ownership, exact token/lockId validation, the clock.now() >= expiresAt stale boundary, renewal/extension, release/unlock, fresh identity on reclaim, and old-token invalidation.

P05 explicitly publishes lifetime idempotency, stage-all-before-send / persist-all-before-publish ordering, reverse compensation, original-error precedence over compensation failures, failed-flush pending retention, and retry semantics.

P06 explicitly publishes parent-chain traversal, global explicit-deny/block precedence, closest allowed grant when no deny exists, disabled/suspended precedence, default deny, and decision trace ordering.

## Fail-closed validation

npm run v52:tranche:validate validates all twelve siblings and requires:

- 6–12 candidate-visible files;
- 25–80 logical LOC partial baseline;
- 6–9 public rule IDs;
- 6–10 hidden cases;
- at least two hidden cases combining three or more public rules;
- callable surface, state model, event ordering, error/abort precedence, identity/mutation rules, and public trace schema;
- every asserted hidden trace maps to public C6 and uses only public event names;
- baseline visible PASS / hidden FAIL;
- reference visible PASS / hidden PASS;
- at least five mutants per sibling;
- every mutant visible PASS / hidden FAIL on a case covering its declared target rule;
- candidate leakage rejection;
- freshness against V5 and V5.1 contract/solution artifacts;
- uniqueness of V5.2 candidate contract/solution hashes across all constructed siblings;
- calibration/formal sibling structural comparability;
- calibration and formal execution authorization both false.

Current verified shape:

| Pair | Calibration LOC | Formal LOC | Rules each | Hidden each | 3+ rule cases | Mutants each |
|---|---:|---:|---:|---:|---:|---:|
| P01 cache | 39 | 39 | 6 | 6 | 4 | 5 |
| P02 stream | 62 | 62 | 6 | 6 | 5 | 5 |
| P03 breaker | 56 | 55 | 6 | 6 | 5 | 5 |
| P04 lease/lock | 32 | 32 | 6 | 6 | 5 | 5 |
| P05 outbox | 53 | 53 | 6 | 6 | 5 | 5 |
| P06 permission | 65 | 65 | 6 | 6 | 6 | 5 |

The constructed tranche is now 6 pairs / 12 siblings, representing 24 possible A0/A1 calibration cells if separately authorized later. The frozen full design remains 12 pairs / 48 calibration cells, treatment-blind selection of exactly six qualifying pairs, then 72 formal cells. No calibration plan, calibration model call, or formal benchmark has been started.
