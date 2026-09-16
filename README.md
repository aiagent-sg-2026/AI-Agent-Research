# AI-Agent-Research

Reproducible v0.1 benchmark harness for observable AI-agent behavior protocols. Node.js ESM, built-in `node:test`, and zero runtime dependencies.

Run `npm test`, `npm run validate`, then the sample command in `docs/BENCHMARK_PROTOCOL.md`. The harness records prompt/input hashes, randomized cell plans, execution evidence, and infrastructure-versus-agent classifications. It does not capture or score private reasoning.

The VM Codex adapter is `config/adapter.codex-luna.vm.json`. It invokes the `codex` executable with `--ignore-user-config`, requests `gpt-5.6-luna` and medium reasoning, and requires the exact `codex-cli 0.153.4` version. `CODEX_HOME` must be set to the authenticated Codex home; sessions must be persisted below `$CODEX_HOME/sessions`. The adapter locates the exact thread from JSON events, reads only the session metadata records needed for provenance, and writes verified model, effort, provider, CLI version, and thread ID to each trial manifest. Missing or mismatched evidence is infrastructure-invalid. Portability requires the pinned absolute CLI path (or a separate reviewed config for another environment) and an equivalent `CODEX_HOME` session layout; the example config is intentionally VM-specific.
