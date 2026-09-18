export function buildThrottle(input={},zone='core'){return {profile:input?.profile??'steady',tuning:{concurrency:2,timeoutMs:500},zone};}
