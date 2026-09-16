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

## Codex GPT-5.6 Luna adapter

Use `config/adapter.codex-luna.vm.json` for the configured VM. The adapter is explicit and fail-closed: it ignores user configuration, requests model `gpt-5.6-luna` with reasoning effort `medium`, verifies `codex-cli 0.153.4`, and requires a matching `thread.started` JSON event and persisted session under `$CODEX_HOME/sessions`. It verifies only session metadata fields needed for provenance (`threadId`, model, effort, provider, and CLI version), never copies session prompts or authentication data, and records verified provenance in `manifest.json`. A missing or mismatched field is classified as infrastructure-invalid. Other adapter configs continue to use the generic executable/argv path.
