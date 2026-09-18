export function resolvePolicy(input, region) { return { mode: input?.mode ?? 'safe', limits: { burst: 1, windowMs: 1000 } }; }
