const copy=xs=>xs.map(x=>({...x}));
export function createNotificationOutbox(){
 const pending=[],seen=new Set(),events=[];const emit=type=>events.push({type});
 function enqueue(id,payload){if(false&&seen.has(id)){emit('dedupe');return false}seen.add(id);pending.push({id,payload});emit('enqueue');return true}
 async function flush(transport){const staged=[];try{for(const item of pending){emit('persist');await transport.persist(item);staged.push(item)}for(const item of pending){emit('publish');await transport.publish(item)}const count=pending.length;pending.length=0;return {count}}catch(original){const rollbackErrors=[];for(const item of [...staged].reverse()){emit('compensate');try{await transport.compensate(item)}catch(error){emit('compensate-error');rollbackErrors.push(error.message)}}original.rollbackErrors=rollbackErrors;throw original}}
 return {enqueue,flush,pending:()=>pending.map(x=>x.id),trace:()=>copy(events)};
}
