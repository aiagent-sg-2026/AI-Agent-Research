# AI-Agent-Research

Reproducible v0.1 benchmark harness for observable AI-agent behavior protocols. Node.js ESM, built-in `node:test`, and zero runtime dependencies.

Run `npm test`, `npm run validate`, then the sample command in `docs/BENCHMARK_PROTOCOL.md`. The harness records prompt/input hashes, randomized cell plans, execution evidence, and infrastructure-versus-agent classifications. It does not capture or score private reasoning.

The VM Codex adapter is `config/adapter.codex-luna.vm.json`. It invokes the `codex` executable with `--ignore-user-config`, requests `gpt-5.6-luna` and medium reasoning, and requires the exact `codex-cli 0.153.4` version. `CODEX_HOME` must be set to the authenticated Codex home; sessions must be persisted below `$CODEX_HOME/sessions`. The adapter locates the exact thread from JSON events, reads only the session metadata records needed for provenance, and writes verified model, effort, provider, CLI version, and thread ID to each trial manifest. Missing or mismatched evidence is infrastructure-invalid. Portability requires the pinned absolute CLI path (or a separate reviewed config for another environment) and an equivalent `CODEX_HOME` session layout; the example config is intentionally VM-specific.

## Pilot V1

Pilot V1 is dataset and harness only. It contains exactly five deterministic application/backend bugfix fixtures and evaluator-owned hidden graders. Candidate workspaces receive only a fresh copy of the visible fixture and the task contract; graders, answer keys, expected patches, competitor output, and prior outcomes are not copied or included in prompts. This is prompt/workspace isolation, not an OS-level secrecy guarantee: a process with broader filesystem access could potentially discover evaluator files.

The planned design is exactly P01 ROOT-CAUSE × B0/B1/B2/FULL × five tasks × one trial, or 20 formal cells. `npm run pilot:qa`, `npm run pilot:freeze`, `npm run pilot:verify`, and `npm run pilot:plan` validate or materialize the seeded plan. `npm run pilot:run` is the executable formal runner and `npm run pilot:summary` writes JSON and Markdown summaries; it verifies the freeze first, runs cells sequentially, and refuses to reuse a non-empty output directory. The real Luna experiment is intentionally not run by QA, freeze, verify, plan, or summary commands.

Visible tests are minimal smoke tests supplied in each candidate fixture. Hidden graders are evaluator-owned and prompt-hidden, so they are not copied into candidate workspaces or prompts; this is a harness boundary, not an OS-level secrecy guarantee. A formal success requires hidden-grader PASS and the only changed file to be the task's `allowedTarget`; unrelated edits are recorded separately.
