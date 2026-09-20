export async function retryUpload(op,o={}){const max=o.maxAttempts??3;for(let a=1;a<=max;a++){try{return await op()}catch(e){if(a===max)throw e;await o.onDelay?.(a+1)}}}
