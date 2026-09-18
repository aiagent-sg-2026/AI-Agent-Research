export async function getSnapshot(store,name,revision,loader){const k=name+'#'+revision;if(store.has(k))return store.get(k);const v=await loader();store.set(k,v);return v}
