export async function readThrough(cache, key, load) { if (cache.has(key)) return cache.get(key); const value=await load(); cache.set(key,value); return value; }
