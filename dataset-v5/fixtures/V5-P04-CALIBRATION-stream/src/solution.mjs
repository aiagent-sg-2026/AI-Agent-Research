export async function drain(source,onValue,signal){let count=0;for await(const v of source){if(signal?.aborted)break;await onValue(v);count++}return {closed:false,count}}
