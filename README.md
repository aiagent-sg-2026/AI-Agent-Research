# AI-Agent-Research

> **[View Live AI Agent Research →](https://aiagent-sg-2026.github.io/AI-Agent-Research/)**
>
> Interactive, mobile-friendly research site: learn what improves AI-agent work quality, explore behavior protocols, and inspect controlled experiment results.

Reproducible v0.1 benchmark harness for observable AI-agent behavior protocols. Node.js ESM, built-in `node:test`, and zero runtime dependencies.

Run `npm test`, `npm run validate`, then the sample command in `docs/BENCHMARK_PROTOCOL.md`. The harness records prompt/input hashes, randomized cell plans, execution evidence, and infrastructure-versus-agent classifications. It does not capture or score private reasoning.

The VM Codex adapter is `config/adapter.codex-luna.vm.json`. It invokes the `codex` executable with `--ignore-user-config`, requests `gpt-5.6-luna` and medium reasoning, and requires the exact `codex-cli 0.153.4` version. `CODEX_HOME` must be set to the authenticated Codex home; sessions must be persisted below `$CODEX_HOME/sessions`. The adapter locates the exact thread from JSON events, reads only the session metadata records needed for provenance, and writes verified model, effort, provider, CLI version, and thread ID to each trial manifest. Missing or mismatched evidence is infrastructure-invalid. Portability requires the pinned absolute CLI path (or a separate reviewed config for another environment) and an equivalent `CODEX_HOME` session layout; the example config is intentionally VM-specific.

## Public site

The educational GitHub Pages site is built from `docs/` and is deployed by `.github/workflows/pages.yml`. It explains the research question, prompt/context/behavior engineering, the B0/B1/B2/FULL comparison, the 20-protocol registry, R0 rejection, R1’s descriptive results, and the methodology boundary without publishing evaluator-owned content or ignored run evidence. Run `npm run site:check` for static site checks. The public site is intended to be hosted at the repository’s GitHub Pages URL; the source repository is [github.com/aiagent-sg-2026/AI-Agent-Research](https://github.com/aiagent-sg-2026/AI-Agent-Research).

## Pilot V1

Pilot V1 is dataset and harness only. It contains exactly five deterministic application/backend bugfix fixtures and evaluator-owned hidden graders. Candidate workspaces receive only a fresh copy of the visible fixture and the task contract; graders, answer keys, expected patches, competitor output, and prior outcomes are not copied or included in prompts. This is prompt/workspace isolation, not an OS-level secrecy guarantee: a process with broader filesystem access could potentially discover evaluator files.

The planned design is exactly P01 ROOT-CAUSE × B0/B1/B2/FULL × five tasks × one trial, or 20 formal cells. `npm run pilot:qa`, `npm run pilot:freeze`, `npm run pilot:verify`, and `npm run pilot:plan` validate or materialize the seeded plan. `npm run pilot:run` is the executable formal runner and `npm run pilot:summary` writes JSON and Markdown summaries; it verifies the freeze first, runs cells sequentially, and refuses to reuse a non-empty output directory. The real Luna experiment is intentionally not run by QA, freeze, verify, plan, or summary commands.

Visible tests are minimal smoke tests supplied in each candidate fixture. Hidden graders are evaluator-owned and prompt-hidden, so they are not copied into candidate workspaces or prompts; this is a harness boundary, not an OS-level secrecy guarantee. A formal success requires hidden-grader PASS and the only changed file to be the task's `allowedTarget`; unrelated edits are recorded separately.

## Agent Quality Benchmark V2 delivery experiment

The first V2 harness is `src/v2-delivery.mjs`: five frozen representative tasks × A0/A1/A2/A3 × three trials = 60 cells. Use `npm run v2:freeze`, `npm run v2:verify`, and `npm run v2:plan` for freeze/verification/planning; `npm run v2:run` is the formal model command and is intentionally not run in implementation sessions. `npm run v2:summary` summarizes recorded evidence. A3's explicit skill directive is a documented adapter limitation, not an extra substantive instruction.
