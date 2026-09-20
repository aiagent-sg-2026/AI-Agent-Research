# Agent Quality Benchmark V5.1 — Strict Contract Calibration

Status: **IMPLEMENTED FRESH SCAFFOLD. No V5.1 model calibration or formal run is authorized yet.**

V5.1 replaces the V5 calibration corpus rather than repairing it in place. V5 showed 6/8 pair ceilings and 2/8 pair floors, with P02 and P07 exposing a remaining semantic-contract gap: public prose described behavior but did not fully specify exact output representation. V5.1 therefore makes exact output/error/observation contracts machine-readable and candidate-visible.

## Strict contract rule

Every sibling exposes docs/contract.json with:
- stable public rule IDs;
- a closed returnSchema;
- a closed observationSchema;
- exact allowed error variants.

Evaluator cases.json may hide input combinations, but its expected return values, errors, and observations must validate against the public schemas before the corpus can freeze. Hidden graders use one generic case runner; they do not embed independent expected literals.

This prevents the V5 defects where a hidden grader expected an Error string or exact reason literal that the public contract did not specify.

## Fresh corpus

Eight new calibration/formal sibling pairs cover:
1. strict versioned policy merge;
2. strict transactional rollback;
3. strict generation-aware async cache;
4. strict closable stream lifecycle;
5. strict capability negotiation;
6. strict schema normalization;
7. strict authorization precedence;
8. strict retry/circuit recovery.

No V5 calibration fixture or result is reused as V5.1 evidence.

## V5.1 method

A0 receives only task + scope.

A1/A2/A3 share this substantive method:

> Read the candidate-visible contract before editing. Treat every rule ID, return schema, observation schema, exact enum literal, and error variant as normative. Make a checklist of those obligations, inspect adjacent implementation helpers, make the smallest allowed-scope change, run visible tests, exercise edge combinations when practical, then re-check exact keys, types, literals, ordering, cleanup, and error representation before finishing.

A2/A3 remain reserved for the later formal matrix.

## Calibration design

Calibration is now **8 pairs × A0/A1 × 2 trials = 32 cells**. Two trials reduce the chance that one stochastic call decides task selection.

Selection is deliberately treatment-blind:
- every pair must have four valid calibration cells;
- combined success across A0/A1 must be 1–3 of 4;
- 0/4 is a floor and 4/4 is a ceiling;
- qualifying pairs are ranked by distance to 2/4 total success, then registry order;
- select six only if at least six qualify;
- never rank/select based on which arm won.

This avoids selecting tasks specifically because they happened to show an A0/A1 effect during calibration.

## Validity gates

Before freeze:
- exactly 8 pairs / 16 fresh siblings;
- every hidden case maps to public rule IDs;
- every hidden expected return/observation validates against candidate-visible schemas;
- every hidden expected error exactly matches a public error variant;
- every public rule is exercised by hidden cases;
- baseline: visible PASS, hidden FAIL;
- reference: visible PASS, hidden PASS;
- at least 3 visible-preserving mutants per sibling, all hidden FAIL;
- evaluator/reference/mutant content never enters candidate fixtures;
- hidden case execution is bounded in a child process.

Formal V5.1 remains 6 selected formal siblings × 4 arms × 3 trials = 72 cells, but formal execution is not authorized by this scaffold.
