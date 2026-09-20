export async function loadEpoch(cache,name,epoch,load){const ck=name+'#'+epoch;if(cache.has(ck))return cache.get(ck);const v=await load();cache.set(ck,v);return v}
