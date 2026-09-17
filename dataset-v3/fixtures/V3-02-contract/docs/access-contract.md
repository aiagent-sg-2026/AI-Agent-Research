# Access contract
1. Inactive accounts are denied.
2. Explicit `deny` overrides every allow.
3. A known role rule applies next (`deny` or `allow`).
4. Explicit `allow` applies when no role rule decided.
5. An active account with no decision and no role rule is allowed by default.
6. An unknown explicit decision is denied.
Return `{ allowed, reason }`; reasons are `inactive`, `explicit-deny`, `role-deny`, `role-allow`, `decision`, `default`, or `unknown-decision`.
