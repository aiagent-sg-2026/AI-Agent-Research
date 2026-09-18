export async function requestWithPolicy(op,o={}){const max=o.maxAttempts??3;for(let a=1;a<=max;a++){try{return await op(a)}catch(e){if(a===max)throw e;await o.onDelay?.(a+1)}}}
