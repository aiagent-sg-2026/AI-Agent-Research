export async function callWithBreaker(op,state){const v=await op();state.failures=0;return v}
