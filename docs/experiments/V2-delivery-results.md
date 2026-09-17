# Agent Quality Benchmark V2 — delivery-mechanism results

Status: **valid 60-cell evidence; descriptive only**.

## Frozen identity

- Source commit at execution: `76ef14ab4113a13fd9fbfc6a0a73de065d951b18`
- Protocol: `AQB-V2-DM-001`
- Seed: `20260917`
- Plan SHA-256: `b39ecf78b138b9e09700b2ae473c2998472e9dbe7b164d6dd87ae7638afce6d6`
- Frozen-input manifest SHA-256: `84ba18e989fd645ba70287a40c4d959388b75a41b02619fd173f699ba2aa65c7`
- Design: 5 frozen tasks × 4 delivery arms × 3 independent trials = **60 cells**
- Arms: A0 Plain, A1 Strong Prompt, A2 candidate `AGENTS.md`, A3 candidate-visible Agent Skill
- Model provenance: 60/60 verified `gpt-5.6-luna`, reasoning effort `medium`, provider `openai`, `codex-cli 0.153.4`
- Unique Codex threads: **60/60**
- Infrastructure-invalid cells: **0**
- Scope violations: **0**

## Independent acceptance replay

After the formal matrix completed, all 60 candidate workspaces were independently checked again without another model call:

- hidden grader replay matched successful acceptance: **60/60**
- candidate-visible tests passed: **60/60**
- each candidate changed exactly its task's allowed target: **60/60**
- candidate workspace path scan found no grader/evaluator material: **60/60 clean**
- unique task/arm/trial cells: **60/60**
- unique Codex threads with pinned provenance: **60/60**

## Results

| Arm | Success | Mean total tokens ± SD | vs A0 tokens | Mean latency ms ± SD | vs A0 latency | Mean diff bytes |
|---|---:|---:|---:|---:|---:|---:|
| A0 Plain | 15/15 | 78769.4 ± 13193.1 | baseline | 40383.8 ± 8065.2 | baseline | 504.9 |
| A1 Strong Prompt | 15/15 | 82060.3 ± 10745.2 | +4.18% | 41442.1 ± 4845.1 | +2.62% | 499.5 |
| A2 AGENTS.md | 15/15 | 76564.6 ± 8218.7 | -2.80% | 38821.5 ± 7664.4 | -3.87% | 520.9 |
| A3 Agent Skill | 15/15 | 88825.9 ± 20249.4 | +12.77% | 41444.3 ± 8171.1 | +2.63% | 494.2 |

Total measured usage across the 60 cells: **4,814,790 input + 78,513 output = 4,893,303 total tokens**.

Tool-call count was not captured by this V2 harness (recorded as `null`), so no tool-usage comparison is claimed. Recorded retries were **0** across all cells; recorded recovery events were **0/60**.

### Success by task and arm

| Task | A0 | A1 | A2 | A3 |
|---|---:|---:|---:|---:|
| T01-invoice-tax-rounding | 3/3 | 3/3 | 3/3 | 3/3 |
| T02-approval-permission | 3/3 | 3/3 | 3/3 | 3/3 |
| T03-inventory-reservation | 3/3 | 3/3 | 3/3 | 3/3 |
| T04-query-filter | 3/3 | 3/3 | 3/3 | 3/3 |
| T05-retry-backoff | 3/3 | 3/3 | 3/3 | 3/3 |

Each task/arm cell above contains three independent trials. All task/arm groups were 3/3 successful.

## Interpretation boundary

All four delivery mechanisms solved all five tasks in all three trials. Therefore this experiment provides **no success-rate evidence** that Strong Prompt, `AGENTS.md`, or Agent Skill improves correctness over Plain for these tasks.

Within this observed sample, A2 `AGENTS.md` had the lowest mean total-token use (76564.6, -2.80% versus A0) and lowest mean latency (38821.5 ms, -3.87% versus A0). A3 Agent Skill had the highest mean total-token use (88825.9, +12.77% versus A0). These are **descriptive observations, not a universal ranking or causal conclusion**.

The design covers five small deterministic coding bug-fix tasks with one pinned model/runtime and three trials per task/arm. It does not establish general performance on larger repositories, other models, other task families, or native Skill invocation systems. A3 also retains the documented delivery asymmetry: pinned Codex required a short explicit prompt directive to invoke the candidate-visible Skill.

## Reliability and evidence notes

- complete evidence cells: 60/60
- unique cells: 60/60
- trial coverage: 3 trials for every task/arm group
- all visible tests and hidden acceptance graders passed on independent replay
- standard deviations above describe observed cell-level dispersion across each arm's 15 cells; they are not inferential confidence intervals
- frozen evaluators, fixtures, task contracts, semantic instruction hash, model pin, CLI pin, and seed were not changed after observing results
