export const cacheKey=(key,generation)=>`${key}#${generation}`;
export function cloneTrace(trace){return trace.map(event=>({...event}));}
