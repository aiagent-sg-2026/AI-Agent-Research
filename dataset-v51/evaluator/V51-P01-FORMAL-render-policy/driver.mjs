export async function runCase(fn,c){return {return:await fn(...c.args),observations:{}}}
