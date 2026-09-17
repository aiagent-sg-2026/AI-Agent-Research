# Agent Quality Benchmark V3 screening

V3 is a separate, harder screening corpus. It preserves the V2 substantive engineering instruction and varies only its delivery channel: A0 has no added instruction, A1 receives the exact text in the prompt, A2 receives it in candidate-scoped `AGENTS.md`, and A3 receives it in a candidate-visible Skill. A3 has an explicit invocation directive because the pinned adapter has no native custom-skill invocation API; the substantive text remains in the Skill.

The six tasks require dependency reasoning, local contract resolution, idempotent state transitions, async recovery and cancellation, unfamiliar adapter discovery, and scope-sensitive regression preservation. Public fixtures include runnable visible tests and local evidence; evaluator-owned graders remain outside candidates. Each untouched fixture passes visible tests and fails hidden acceptance with `AssertionError`.

The registered matrix is exactly 6 tasks × 4 arms × 3 trials = 72 seeded cells. V3 is screening/descriptive evidence only. It does not promote an arm or establish a universal winner. Any apparent arm effect must be tested later on held-out confirmation tasks with the preregistered confirmation design. Missing, malformed, contaminated, or unverified evidence is infrastructure-invalid/unknown and never silently treated as success.

Use `npm run v3:plan`, `npm run v3:freeze`, and `npm run v3:verify` for non-model checks. `v3:run` is intentionally not part of this implementation validation.
