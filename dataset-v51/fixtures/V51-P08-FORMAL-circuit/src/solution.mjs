export async function callBreaker(op,state){const v=await op();state.failures=0;return v}
