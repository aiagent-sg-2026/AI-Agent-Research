# V5.1 Calibration Results

Status: **COMPLETE — STOP before formal benchmark**

Job `dc8edf48-b67c-4d9f-b4a9-f8f570bcd108` completed successfully from source `cb311ff592d94a41a0a44b4cd3c50ee3ebeac693`.

Independent verification:
- 32/32 unique calibration cells, seed `20260920`.
- Output plan matches the frozen 32-cell plan exactly; 0 formal siblings executed.
- 0 infrastructure-invalid cells.
- Provenance: 32/32 valid cells verified as `gpt-5.6-luna`, effort `medium`, Codex CLI `0.153.4`.
- Visible tests: 32/32 pass. Hidden acceptance: 27/32 pass. Allowed scope: 32/32 compliant.
- Failures: 5 × `TASK_LOGIC`; retries: 0 for all 32 cells.
- Token telemetry: 27/32 cells (84.375%), 3,008,811 observed tokens. Efficiency comparison is unavailable because coverage is incomplete.

## Difficulty by pair

| Pair | Combined | Band | A0 | A1 |
|---|---:|---|---:|---:|
| V51-P01 | 4/4 | ceiling | 2/2 | 2/2 |
| V51-P06 | 4/4 | ceiling | 2/2 | 2/2 |
| V51-P07 | 4/4 | ceiling | 2/2 | 2/2 |
| V51-P08 | 0/4 | floor | 0/2 | 0/2 |
| V51-P02 | 4/4 | ceiling | 2/2 | 2/2 |
| V51-P03 | 4/4 | ceiling | 2/2 | 2/2 |
| V51-P05 | 3/4 | middle | 1/2 | 2/2 |
| V51-P04 | 4/4 | ceiling | 2/2 | 2/2 |

The five failed cells are all hidden-acceptance `TASK_LOGIC` failures: all four P08 cells plus P05 A0 trial 2. All five still pass visible tests and scope checks.

## Frozen treatment-blind selection

V5.1 qualifies only pairs with 1–3 successes across the four calibration cells. Only `V51-P05` qualifies. Because at least six qualified pairs are required, the preregistered result is:

**STOP — insufficient-qualified-pairs. No formal tasks selected.**

Swapping A0 and A1 labels produces the same qualified set (`V51-P05`) and the same STOP decision, confirming selection does not depend on arm identity.

Descriptively, A0 was 13/16 and A1 was 14/16. Calibration is for difficulty selection, so this one-cell difference is not evidence of a delivery-mechanism winner.

No 72-cell formal benchmark was started.
