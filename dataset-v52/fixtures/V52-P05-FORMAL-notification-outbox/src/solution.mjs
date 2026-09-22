import {copy} from './helpers.mjs';

export function createNotificationOutbox(){
  const pending=[];
  const seen=new Set();
  const events=[];
  const emit=type=>events.push({type});

  function enqueue(id,payload){
    if(seen.has(id)){
      emit('dedupe');
      return false;
    }
    seen.add(id);
    pending.push({id,payload});
    emit('enqueue');
    return true;
  }

  async function flush(transport){
    const staged=[];
    try{
      for(const item of pending){
        emit('persist');
        await transport.persist(item);
        staged.push(item);
      }
      for(const item of pending){
        emit('publish');
        await transport.publish(item);
      }
      const count=pending.length;
      pending.length=0;
      return {count};
    }catch(original){
      const rollbackErrors=[];
      // Partial baseline bug: compensation runs in forward, not reverse, stage order.
      for(const item of staged){
        emit('compensate');
        try{
          await transport.compensate(item);
        }catch(error){
          emit('compensate-error');
          rollbackErrors.push(error.message);
        }
      }
      original.rollbackErrors=rollbackErrors;
      throw original;
    }
  }

  return {
    enqueue,
    flush,
    pending:()=>pending.map(x=>x.id),
    trace:()=>copy(events)
  };
}
