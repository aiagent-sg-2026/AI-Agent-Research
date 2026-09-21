# V5.2 Difficulty Redesign

Status: **DESIGN ONLY — no V5.2 calibration or formal execution authorized**

## Evidence

V5 produced six ceiling pairs and two floor pairs; A0 and A1 were both 6/8. The two floors were later traced to public/hidden contract-completeness defects.

V5.1 improved exact return/error/observation representation and used two trials per arm, but still produced six 4/4 ceilings, one 3/4 pair (P05), and one 0/4 pair (P08).

The V5.1 fixtures are structurally tiny: every calibration fixture has four candidate files, a one-line baseline implementation, a one-line public test, one editable file, 4–5 public rules, and only 3–5 hidden cases. Most work is therefore direct contract transcription rather than realistic engineering diagnosis.

## Remaining V5.1 validity gaps

### P05 peer negotiation

C4 says a mismatched opened session must be closed, but the public contract does not specify the close API. Hidden evaluation supplies `session.close()`. The only failing P05 trial used `transport.close(session)`.

P05's 3/4 result is therefore entangled with an unstated API-affordance choice and is not clean evidence of genuine middle difficulty.

### P08 retry upload

C3 says to await `onDelay(nextAttempt)` before each retry. C4 says to throw AbortError if the signal is aborted before another operation call. Hidden H4 aborts during the failed operation and expects **no delay** before AbortError.

All four model patches used the plausible sequence: transient failure -> delay -> next-loop abort check. The reference adds another abort check before delay. That precedence is not explicitly public.

P08's 0/4 result is therefore also not clean evidence of genuine capability floor.

## Root cause

After excluding P05/P08 interaction-contract ambiguity, V5.1 demonstrates no clean middle pair. The dominant problem is task simplicity:

1. one-file, one-function repairs;
2. exact rules colocated in one obvious contract;
3. short hidden combinations;
4. skeletal baselines instead of realistic partial implementations;
5. almost no authority discovery or helper inspection;
6. little non-local state;
7. async behavior is locally contained;
8. the model can translate public rules directly into code.

Strict schemas close value-shape ambiguity, but they do not close interface ownership, side-effect ordering, event precedence, or lifecycle semantics.

## V5.2 objective

Create fresh sibling pairs whose difficulty comes from deterministic engineering interactions, not evaluator secrecy or ambiguous prose. Target at least six clean pairs with combined A0+A1 success in the 1–3/4 band.

## Frozen corpus shape

Prepare **12 fresh calibration/formal sibling pairs**.

Calibration:
- 12 calibration siblings;
- A0 + A1;
- 2 fresh trials each;
- 48 cells maximum;
- seeded paired-block randomization.

Formal, only after successful selection:
- exactly 6 unopened formal siblings;
- A0/A1/A2/A3;
- 3 fresh trials;
- 72 cells.

Selection remains treatment-blind:
- four valid calibration cells per pair;
- 0/4 floor, 1–3/4 qualifying middle, 4/4 ceiling;
- rank by distance to 2/4, then frozen registry order;
- select exactly six only if at least six qualify;
- otherwise STOP;
- never use arm identity in qualification or ranking.

## Structural difficulty gate

Before model calibration, a V5.2 pair should normally have:

- 6–12 candidate-visible files;
- 2–4 behavior-relevant code/docs files;
- 1–3 editable files with explicit scope;
- a realistically partial baseline, usually 25–80 logical LOC;
- a reference delta normally requiring 12–40 logical lines across interacting concerns;
- 6–9 public rule IDs;
- 6–10 hidden cases;
- at least two hidden cases combining three or more rules;
- at least one state-sequence/lifecycle case;
- for async/stateful families, at least one deterministic interleaving;
- at least five visible-preserving mutants representing distinct partial-fix strategies.

These are pre-calibration design heuristics, not scoring rules.

## Public protocol-contract gate

Extend the public contract beyond return/error schemas. Every task must explicitly define:

1. callable surface: function signatures, available object methods, cleanup ownership, sync/async behavior;
2. state model: candidate-visible states, transitions, and persistence boundary;
3. event ordering: side-effect order, abort/error precedence, cleanup order, and when an action must not occur;
4. identity/mutation rules: input mutation, returned identity, dedupe/idempotency keys;
5. observable trace: public event schema plus ordering constraints.

The validator must reject any corpus where a hidden expectation depends on an API method, event order, timing precedence, or side effect that is not explicitly public.

## Make the method consequential without leaking answers

Difficulty should require reconciliation of public evidence rather than guessing evaluator behavior. Candidate-visible material can include:

- current contract plus explicitly marked stale documentation;
- an adjacent helper that must be inspected but not edited;
- a realistic partially-correct implementation;
- a small deterministic state store or fake transport;
- public tests covering happy paths but not every interaction.

A0 receives the same artifacts without the workflow method. A1 receives the frozen method. Both arms remain fully solvable from public evidence.

## Recommended 12-pair mechanism bank

1. lease/lock ownership with renewal, stale owner, and release ordering;
2. transactional outbox with dedupe, partial failure, and reverse compensation;
3. generation cache with concurrent load, invalidate-during-flight, and rejection cleanup;
4. stream framing with partial chunks, backpressure, abort, and close lifecycle;
5. circuit breaker with virtual clock, half-open probe, and reset semantics;
6. capability negotiation with an explicit Session API, mismatch cleanup, and fallback;
7. permission inheritance with explicit-deny precedence and scoped overrides;
8. paginated merge with cursor repetition, duplicate IDs, and stable ordering;
9. optimistic update with version conflict and no stale write;
10. subscription replacement with old-listener cleanup before activation;
11. schema migration with versioned defaults, deprecated fields, and transactional failure;
12. retry budget shared across staged operations with explicit abort/delay precedence.

Formal siblings must change domain data and surface details while preserving mechanism family and approximate structural complexity.

## Acceptance gates

Before calibration:
- baseline visible PASS / hidden FAIL;
- reference visible PASS / hidden PASS;
- every mutant visible PASS / hidden FAIL;
- every hidden assertion maps to public rule IDs;
- every public rule is covered;
- protocol/API/event-order validation passes;
- evaluator/reference/mutant content is not candidate-visible;
- formal siblings are frozen and unopened;
- provenance and token capture are verified.

After calibration:
- independently recompute all pair totals;
- reject any infrastructure-invalid pair;
- verify selection is invariant to swapping A0/A1 labels;
- select only through aggregate difficulty;
- if fewer than six clean middle pairs qualify, STOP and create a fresh bank.

## Interpretation

V5 and V5.1 do not establish a delivery-mechanism winner. They show a corpus-design problem: V5 had ceiling/floor polarization and known contract defects; V5.1 improved representation validity but remained too small/direct, while P05/P08 exposed missing protocol semantics.

V5.2 should increase **interaction complexity and diagnosis depth**, not ambiguity.

## Recommended implementation tranche

1. add a V5.2 registry/schema with frozen 12-pair / 48-cell calibration policy;
2. add callable-interface and event-order protocol validation;
3. build three representative calibration/formal sibling pairs only;
4. run non-model validators and mutation tests;
5. manually audit those three for ambiguity;
6. construct the remaining nine;
7. freeze all 12 pairs before authorizing any model call.

Do not repair or reuse V5.1 calibration siblings as V5.2 evidence. Preserve V5/V5.1 as historical failed calibration rounds.
