export async function applyStockMoves(moves,store){for(const m of moves)await store.apply(m);return {status:'committed',count:moves.length}}
