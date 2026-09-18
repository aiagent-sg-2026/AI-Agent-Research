# AI-Agent-Research v0.1

This harness measures whether an observable behavior contract improves task outcome and reliability. It never requires, captures, or grades private chain-of-thought: scoring uses only outputs, actions, and evidence visible to the evaluator.

## Experiment rules

Evaluator, fixtures, baseline, and task are frozen within a comparison. Every trial is a fresh run directory. Comparisons hold task, model, tools, context, budget, and evaluator constant while changing one major variable. Cells use a seeded randomized order. The candidate receives no evaluator implementation, answer key, hidden expected patch, competitor output, or prior trial outcome. Missing or unverifiable evidence is UNKNOWN, never PASS. Infrastructure-invalid attempts are classified separately from valid agent failures. Rejected experiments remain recorded.

## v0.1 scoring contract

- Final Outcome (50): acceptance tests 30, user goal 10, regression-free 5, scope 5.
- Observable Agent Trajectory (20): evidence/tool correctness 5, information gathering 5, useful recovery 5, no unnecessary loops/work 5. Private chain-of-thought is explicitly excluded.
- Reliability (15) is measured across repeated trials.
- Efficiency (10), conditional on task success: tokens 4, wall time 3, tool calls 3.
- Discipline/Safety (5); a critical safety violation makes the experiment FAIL regardless of score.

Default screening is 3 trials per task/protocol; confirmation is 10. Track mean, median, minimum, maximum, success, variance, and catastrophic failure.

## Scope and operation

`node src/runner.mjs --task examples/tasks/sample-task.json --arms B0,FULL --protocols P01 --trials 1 --adapter config/adapter.example.json --out out/run` executes cells. Add `--dry-run` for a zero-process deterministic plan. Adapter configs contain an executable and argv template; placeholders are substituted into argv and spawned with `shell:false`. Output and timeout bounds are enforced.

This release defers real model trials, hidden graders, a 20-task production dataset, and protocol composition. The included stub is a local no-network execution proof, not a model benchmark.

## Pilot V1 boundary

The Pilot V1 harness adds five visible fixtures and evaluator-owned prompt-hidden graders. A one-cell run copies only the fixture into a fresh local git repository, requires the untouched baseline to fail its hidden grader via AssertionError, invokes the configured adapter in that candidate root, then records sanitized grader outcomes, token usage, latency, changed files, and diff scope. Infrastructure-invalid cells are separate from valid task failures. The 20-cell Luna experiment is not run during harness, QA, freeze, verify, plan, or summary commands. The formal runner verifies frozen inputs first, runs the seeded cells sequentially, persists evidence, and rejects reuse of non-empty output. One trial per task/arm is preliminary descriptive evidence and supports no causal or universal conclusion. Visible tests are minimal smoke tests; prompt-hidden graders are not an OS-level secrecy guarantee.

## Codex GPT-5.6 Luna adapter

Use `config/adapter.codex-luna.vm.json` for the configured VM. The adapter is explicit and fail-closed: it ignores user configuration, requests model `gpt-5.6-luna` with reasoning effort `medium`, verifies `codex-cli 0.153.4`, and requires a matching `thread.started` JSON event and persisted session under `$CODEX_HOME/sessions`. It verifies only session metadata fields needed for provenance (`threadId`, model, effort, provider, and CLI version), never copies session prompts or authentication data, and records verified provenance in `manifest.json`. A missing or mismatched field is classified as infrastructure-invalid. Other adapter configs continue to use the generic executable/argv path.

## V2 delivery-mechanism experiment

The first V2 delivery experiment is five frozen representative Pilot fixtures × A0 Plain, A1 Strong Prompt, A2 candidate `AGENTS.md`, and A3 candidate-visible Agent Skill × three fresh trials: exactly 60 unique cells. `npm run v2:freeze`, `npm run v2:verify`, `npm run v2:plan`, and `npm run v2:summary` support freeze, verification, planning, and summaries; `npm run v2:run` is the expensive model runner and is not invoked during implementation or QA.

A0 receives only the task contract and scope. A1 receives the frozen engineering instruction in the prompt. A2 receives it in candidate-root `AGENTS.md`, with candidate rules enabled only for A2. A3 receives it in `.agent-skills/aqb-delivery/SKILL.md` plus a short explicit invocation directive because pinned Codex has no native custom-skill invocation API. This is the declared delivery asymmetry; the substantive A1/A2/A3 instruction hash is identical. Hidden graders and answer keys remain evaluator-owned and are hash-recorded only. Cells record correctness, visible tests, regression, scope, tokens, latency, recovery/failure class, provenance, and three-trial reliability; incomplete evidence is never success.

## V4 held-out boundary

V4 is an isolated six-fixture held-out benchmark (`AQB-V4-HELDOUT-001`), exactly 6 × 4 × 3 = 72 seeded paired-block cells, pinned to gpt-5.6-luna / medium / Codex CLI 0.153.4. Its fixtures and graders are new and materially interaction-heavy; V3 evidence is preserved unchanged. V4 is descriptive only. No secondary observable quality metric is recorded (`secondaryMetricAvailable=false`), so mechanism claims require at least one valid task/arm correctness failure escaping the ceiling; no winner is manufactured. Token telemetry is a hard gate for efficiency comparisons: missing telemetry makes efficiency unavailable while leaving correctness evidence usable. Process/tool telemetry is reported as unavailable when the adapter cannot reliably extract it.
