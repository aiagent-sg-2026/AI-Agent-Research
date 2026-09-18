# V4 Retrospective Validity Audit

Status: **V4 execution evidence is technically complete, but the corpus is not valid for delivery-mechanism comparison. Treat the 72-cell run as diagnostic only.**

## Why only V4-03 succeeded

The dominant pattern is task construction, not delivery-arm behavior. Every arm produced exactly 3/18 successes, and all 12 successes came from V4-03. A retrospective contract-to-grader audit found that V4-03 is the only task whose hidden checks are consistently derivable from the public contract without adding a material hidden rule.

| Task | Result | Retrospective finding |
|---|---:|---|
| V4-01 versioned contract | 0/12 | **Invalid.** The visible test requires `resolvePolicy({}, 'xx')` burst `1`, while hidden acceptance requires the same call to use burst `4`. The task cannot satisfy both. Hidden acceptance also requires a `region` output field and unknown-mode fallback not explicitly specified by the public contract. |
| V4-02 migration rollback | 0/12 | **Underspecified.** Public material requires reverse rollback/exactly-once effects, but does not define the failure result channel. Hidden acceptance requires `{ok:false, applied, error}`; most candidates reasonably rolled back and re-threw the original error. |
| V4-03 interleaving cache | 12/12 | **Valid but too easy.** Public consistency rules directly cover shared in-flight loads and rejected-load non-caching. Hidden checks are edge cases of those public rules, so all arms solved it. |
| V4-04 stream cancellation | 0/12 | **Underspecified.** Public lifecycle rules require cleanup, but the meaning of returned `closed` is not defined. Hidden acceptance requires `closed:true` after normal completion of a closable source, while the visible smoke test expects `closed:false` for a simple array. Most candidates implemented cleanup but interpreted `closed` differently. |
| V4-05 capability negotiation | 0/12 | **Ambiguous.** Hidden acceptance expects fallback to v1 when the peer advertises only v2 but lacks the v2 capability. The public protocol does not explicitly say fallback may ignore the peer's advertised version list. Most candidates correctly rejected that as no mutually supported version. |
| V4-06 legacy compatibility | 0/12 | **Underspecified.** Hidden acceptance requires legacy input without `active` to normalize to `active:false`, but that default is not stated in the public contract. Most candidates therefore omitted the field. |

## Evidence pattern

- Formal execution integrity: 72/72 unique cells, 72/72 pinned provenance, 0 infrastructure-invalid.
- Arm result: A0=A1=A2=A3=3/18. This is task-dominated, not evidence of mechanism equivalence.
- Failure classes: 46 TASK_LOGIC, 13 REGRESSION, 1 SCOPE_VIOLATION.
- V4-01 alone accounts for 12/13 regressions because of the direct visible/hidden contradiction.
- V4-02, V4-05, and V4-06 mostly fail on hidden requirements not fully specified to candidates.
- V4-03 demonstrates the desired benchmark property: public rules are complete; hidden tests add combinations/edge cases rather than new rules.
- Token telemetry was only 49/72, so efficiency comparison remains unavailable.

## Lesson for V5

Difficulty must come from **reasoning over explicit public rules**, not from evaluator-only rules. Hidden tests may hide cases, combinations, ordering, timing, and adversarial inputs; they must not hide the behavioral contract itself.

V5 therefore needs three independent gates before any formal model run:

1. **Contract completeness:** every hidden assertion maps to a specific public contract clause.
2. **Visible/hidden consistency:** an evaluator-owned reference implementation passes both suites; baseline passes visible and fails hidden.
3. **Difficulty calibration:** separate sibling calibration tasks establish a middle difficulty band before held-out formal variants are opened.

The V4 raw run and formal report remain preserved for auditability, but no delivery-mechanism conclusion should be drawn from V4.
