# Pilot V1 R0 — rejected experiment

- Status: rejected; do not use for protocol comparison or arm ranking.
- Cells: 20/20 completed with verified `gpt-5.6-luna` / medium provenance.
- Reason: T02 was underspecified about the department data shape, and T05's visible test used zero-based attempts while its task and hidden grader used one-based attempts.
- Claim boundary: R0 metrics are retained as raw ignored `pilot-out` evidence only. No arm ranking, treatment comparison, or benchmark claim is valid from R0.
- Replacement: repaired inputs are frozen for R1; a fresh R1 run must use `pilot-out-r1` and must not reuse R0 metrics.
