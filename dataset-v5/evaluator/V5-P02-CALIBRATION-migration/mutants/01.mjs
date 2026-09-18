export async function applyBatch(ops,store){const seen=new Set();let n=0;for(const o of ops){if(seen.has(o.id))continue;seen.add(o.id);await store.apply(o);n++}return {ok:true,applied:n}}
