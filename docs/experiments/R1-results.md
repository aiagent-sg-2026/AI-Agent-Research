# Pilot V1 R1 — verified descriptive results

Status: **valid pilot evidence; descriptive only**.

## Frozen identity

- Source commit at execution: `3be6fc8b926d6b12219250bcc4ad12f9bf8c13e5`
- Seed: `20260916`
- Plan SHA-256: `b43c295bf0706bff7c8e601aca3a2b2fe2a8043f5fd60ee72a4d463724b78f27`
- Frozen-input manifest SHA-256: `3d2ad3e778e6d511fc1ec85a8f3b7dc045b513920c616402c4840f7d5beede1b`
- Frozen entries: 30
- Protocol: P01 `ROOT-CAUSE`
- Arms: B0 plain, B1 trigger only, B2 generic-strong, FULL behavior contract
- Tasks: 5 deterministic engineering bugfix fixtures
- Trials: 1 per task/arm, 20 cells total
- Model: 20/20 independently verified `gpt-5.6-luna`, reasoning effort `medium`, provider `openai`, `codex-cli 0.153.4`
- Unique Codex threads: 20/20
- Infrastructure-invalid cells: 0

## Independent acceptance replay

After the formal matrix completed, all 20 candidate workspaces were independently checked again:

- hidden grader replay matched the recorded outcome: 20/20
- candidate-visible tests passed: 20/20
- successful candidates changed exactly their task's allowed target: 20/20
- prompt leakage scan for evaluator path / hidden grader / answer key / expected patch / competitor output / prior outcomes: 20/20 clean
- unique task/protocol/arm/trial cells: 20/20

Repository gates also passed: harness tests 27/27, Pilot QA, frozen-input verification, registry validation, and `git diff --check`.

## Results

| Arm | Success | Mean tokens | vs B0 tokens | Mean latency ms | vs B0 latency | Mean diff bytes |
|---|---:|---:|---:|---:|---:|---:|
| B0 plain | 5/5 | 74,977.2 | baseline | 60,778.4 | baseline | 489.0 |
| B1 `ROOT-CAUSE` trigger | 5/5 | 81,991.8 | +9.36% | 52,850.4 | -13.04% | 494.0 |
| B2 generic-strong | 5/5 | 106,000.6 | +41.38% | 59,770.8 | -1.66% | 514.6 |
| FULL P01 behavior contract | 5/5 | 96,696.6 | +28.97% | 61,407.6 | +1.04% | 503.4 |

Total measured usage across the 20 cells: 1,769,796 input tokens + 28,535 output tokens = **1,798,331 total tokens**.

## Interpretation boundary

All four arms solved all five tasks in this single-trial pilot. Therefore R1 provides **no success-rate evidence** that the `ROOT-CAUSE` trigger, generic-strong instruction, or FULL P01 contract improves these five tasks over the plain baseline. It also does not establish that any arm is faster or more efficient in general: the observed token/latency differences are descriptive samples with one trial per task/arm and no significance or stability analysis.

The correct next experiment is replication across repeated trials before promoting, rejecting, or ranking P01. R0 remains separately rejected and must not be combined with R1.
