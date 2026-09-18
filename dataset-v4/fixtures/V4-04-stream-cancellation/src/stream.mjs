export async function consume(source, onValue, signal) { for await (const value of source) { if(signal?.aborted) break; await onValue(value); } return {closed:false}; }
