# V5 Calibration Retrospective

The V5 16-cell A0/A1 calibration completed with 16/16 unique valid cells and 0 infrastructure-invalid cells. A0 and A1 each passed 6/8. P01, P03, P04, P05, P06, and P08 were pass/pass; P02 and P07 were fail/fail. Under the preregistered V5 policy, zero pairs qualified and selection stopped.

The two floor pairs revealed a remaining contract-completeness problem:
- P02 public C3 required an error field but did not specify whether it was an Error object or string; hidden acceptance required a string.
- P07 public C5 described auditor default allow but did not specify the exact success reason literal; hidden acceptance required role-default.

Therefore V5 calibration evidence is not reused for V5.1. V5.1 uses a fresh corpus plus machine-readable public return/error/observation contracts, and uses treatment-blind aggregate-difficulty selection rather than selecting on an observed A0/A1 split.
