export async function applyMigration(ops, store) { for (const op of ops) await store.apply(op); return {ok:true, applied:ops.length}; }
