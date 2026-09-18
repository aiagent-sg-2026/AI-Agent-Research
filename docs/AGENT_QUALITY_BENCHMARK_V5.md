# Agent Quality Benchmark V5 — Calibrated Held-Out Design

Status: **DESIGN PROPOSAL. No V5 model run is authorized by this document.**

## Goal

V5 should avoid both observed failure modes:

- V3: correctness ceiling — 72/72 success.
- V4: task floor / corpus validity defects — 12/72 success concentrated in one task, with several hidden-contract problems.

The target is a fair, method-sensitive benchmark where difficulty comes from combining explicit public constraints, not guessing evaluator-only behavior.

## Experimental question

With the same pinned model/runtime and the same substantive engineering method, does delivery through the user prompt, candidate `AGENTS.md`, or candidate-visible Agent Skill change observable task correctness/reliability versus a plain task?

## Arms

- **A0 Plain:** task + allowed scope only.
- **A1 Prompt:** task + the frozen V5 method in the user prompt.
- **A2 AGENTS.md:** same frozen V5 method in candidate-root `AGENTS.md`.
- **A3 Agent Skill:** same frozen V5 method in a candidate-visible Skill plus the existing explicit invocation directive.

A1/A2/A3 must have the exact same substantive-method hash. Only the delivery channel may differ.

## Frozen V5 method

> Identify the authoritative current contract and ignore explicitly stale material. Convert every public rule into a verification checklist, inspect adjacent helpers before implementing, make the smallest allowed-scope change, run visible tests, locally exercise contract edge cases when practical, then re-check the public contract for defaults, ordering, cleanup, and compatibility before finishing.

This is intentionally more consequential than the V2/V3/V4 one-line instruction while remaining task-independent.

## Benchmark validity gates

Every formal task must pass all gates before freeze:

1. **Public-rule traceability**
   - Every hidden assertion has a stable rule ID such as `C1`, `C2`.
   - Every rule ID points to candidate-visible authoritative documentation.
   - Hidden acceptance may combine rules or use unseen inputs, but may not introduce a new rule.

2. **Reference-solution consistency**
   - Evaluator-owned reference patch passes visible tests and hidden acceptance.
   - Untouched baseline passes visible tests and fails hidden acceptance.
   - A direct logical contradiction between visible and hidden expectations is a hard reject.

3. **Mutation quality**
   - At least three evaluator-owned incomplete mutants per task.
   - Mutants represent plausible partial solutions: stale-doc choice, missing cleanup/default/order, superficial visible-test patch.
   - Hidden grader must reject each mutant for the intended rule group.

4. **Scope validity**
   - Allowed targets are a non-empty permitted subset.
   - A correct solution is never required to edit every allowed file.
   - Scope rules are identical across arms.

5. **No answer leakage**
   - Candidate fixtures contain no evaluator path, expected patch, hidden case, competitor output, or prior result.

## Difficulty calibration without contaminating formal tasks

Use **paired sibling fixtures**:

- Prepare 8 task pairs: one calibration sibling + one unopened held-out sibling per mechanism family.
- Freeze/hash both siblings before any model calibration.
- Run only the 8 calibration siblings; formal siblings are never executed or edited during calibration.
- Calibration budget: A0 and A1, one fresh trial each = **16 model calls maximum**.
- A pair is eligible for the formal six-task set only when calibration shows the mechanism is neither trivially solved by both arms nor impossible for both arms, or shows a method-sensitive A0/A1 difference.
- Selection rule and tie-break order must be frozen before calibration results are observed.
- If fewer than six pairs qualify, stop and redesign new pairs; do not weaken acceptance after seeing results.

This separates **difficulty tuning** from **formal evidence**.

## Formal V5 matrix

Keep cost comparable with V3/V4:

- 6 held-out tasks
- 4 arms
- 3 fresh trials
- **72 unique formal cells**
- seeded paired-block randomization

No formal cell may be reused after failure.

## Proposed task families

The six selected held-out siblings should come from these mechanism families:

1. **Versioned configuration merge**
   - Explicit precedence, allowed enum values, defaults, result shape, and stale-version markers.
   - Hidden cases combine region override + user override + invalid enum.

2. **Transactional migration**
   - Explicit success/failure return shape, exactly-once scope, reverse rollback order, and rollback-error precedence.
   - Hidden cases combine duplicates, mid-sequence failure, and rollback failure.

3. **Generation-aware async cache**
   - Extends the valid V4-03 pattern with explicit invalidation/generation rules.
   - Hidden cases interleave load, invalidate, reject, and concurrent callers.

4. **Closable stream pipeline**
   - Explicitly define when `closed` is true/false, cleanup ownership, cancellation boundary, handler backpressure, and error precedence.
   - Hidden cases use closable/non-closable sources and async acknowledgement.

5. **Capability negotiation**
   - Explicitly define whether fallback must be peer-advertised, capability requirements, open failure fallback, and close semantics.
   - Hidden cases vary peer version order, missing capabilities, and rejected candidates.

6. **Schema compatibility normalization**
   - Explicit legacy defaults, coercion rules, malformed cases, unknown-field handling, and output shape.
   - Hidden cases combine fields rather than invent new defaults.

## Difficulty-band target

V5 does not tune formal tasks after seeing formal results. The calibration siblings should target a middle band:

- avoid mechanisms where calibration A0 and A1 both pass trivially;
- avoid mechanisms where both fail for contract-clarity reasons;
- prefer mechanisms where the method can plausibly change outcome.

Formal results remain valid even if they later show a ceiling or floor, provided all validity gates passed.

## Evidence recorded per cell

- success / hidden acceptance
- visible-test pass
- allowed-scope compliance
- regression-free status
- pinned provenance
- failure class
- latency
- retries
- diff size
- token telemetry when available

No private chain-of-thought is captured or graded.

## Telemetry rule

Correctness evidence does not depend on token telemetry. Efficiency comparison is available only when token telemetry is complete for all valid formal cells. Before V5 formal execution, add a session-log fallback or another verified mechanism if needed to make token capture reliable; otherwise publish correctness only.

## Interpretation gate

A V5 delivery-mechanism conclusion requires all of:

- complete 72-cell matrix;
- 0 unresolved corpus-validity violations;
- pinned provenance complete for all valid cells;
- at least two formal tasks with non-unanimous outcomes across their 12 cells;
- at least one arm-level correctness difference.

If these conditions are not met, report descriptive task outcomes only and do not declare a winner.

## Implementation order

1. Build automated contract-traceability/reference/mutant validators.
2. Build and freeze 8 calibration/formal sibling pairs.
3. Run the bounded 16-call calibration only.
4. Apply the preregistered pair-selection rule.
5. Freeze the selected six formal siblings and 72-cell plan.
6. Independently verify freeze/provenance gates.
7. Only then authorize a V5 formal run.
