# Agent Quality Benchmark V4 held-out design

V4 is a new held-out corpus, not a modification or reuse of V3. It keeps the exact V2_INSTRUCTION substantive text for A1, A2, and A3 and varies only delivery: prompt, candidate-root `AGENTS.md`, or candidate-visible Skill. A3 retains the documented explicit invocation directive because the pinned adapter has no native custom-skill API.

The matrix is exactly 6 new tasks × 4 arms × 3 seeded paired-block trials = 72 cells. Families combine authoritative local evidence with stale/decoy context where useful: nested version precedence, migration rollback/exactly-once behavior, interleaving cache generations, cancellation/backpressure cleanup, capability negotiation/resource lifecycle, and legacy/current compatibility.

Visible tests are smoke coverage and every untouched fixture must pass them while its evaluator-owned hidden grader fails with AssertionError. Hidden graders are outside candidate fixtures and are never copied into candidate workspaces. Hidden acceptance checks behavioral invariants, visible regression, and allowed scope; it does not grade task wording.

Anti-ceiling preregistration: V4 records no secondary observable quality metric (`secondaryMetricAvailable=false`). Therefore any mechanism claim requires at least one valid, non-infrastructure correctness failure; a complete token or latency series cannot substitute for that rule. No winner is manufactured. Efficiency comparisons are unavailable unless token telemetry is complete for all 72 valid cells. Provenance remains fail-closed. Tool/process telemetry is recorded only when reliably available; otherwise it is explicitly unavailable, never invented.

Use `npm run v4:plan`, `npm run v4:freeze`, and `npm run v4:verify` for non-model checks. `v4:run` is deliberately not invoked for this implementation.
