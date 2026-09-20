export async function readVersion(cache,key,generation,load){const ck=key+'@'+generation;if(cache.has(ck))return cache.get(ck);const v=await load();cache.set(ck,v);return v}
