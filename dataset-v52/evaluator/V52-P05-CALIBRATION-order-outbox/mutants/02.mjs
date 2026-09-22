const copy=xs=>xs.map(x=>({...x}));
export function createOrderOutbox(){
 const pending=[],seen=new Set(),events=[];const emit=type=>events.push({type});
 function enqueue(id,payload){if(seen.has(id)){emit('dedupe');return false}seen.add(id);pending.push({id,payload});emit('enqueue');return true}
 async function flush(transport){const staged=[];try{for(const item of pending){emit('stage');await transport.stage(item);staged.push(item);emit('send');await transport.send(item)}const count=pending.length;pending.length=0;return {count}}catch(original){const rollbackErrors=[];for(const item of [...staged].reverse()){emit('rollback');try{await transport.rollback(item)}catch(error){emit('rollback-error');rollbackErrors.push(error.message)}}original.rollbackErrors=rollbackErrors;throw original}}
 return {enqueue,flush,pending:()=>pending.map(x=>x.id),trace:()=>copy(events)};
}
