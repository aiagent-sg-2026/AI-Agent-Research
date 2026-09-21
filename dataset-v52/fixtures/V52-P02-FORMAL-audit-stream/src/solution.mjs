import {copy} from './helpers.mjs';

export function createAuditStream(onRecord,{highWaterMark=2,signal}={}){
  let buffer='';
  let shutdown=false;
  let cancelled=false;
  let paused=false;
  const queue=[];
  const events=[];

  const emit=()=>{
    while(!paused && !cancelled && queue.length){
      const value=queue.shift();
      onRecord(value);
      events.push({type:'record',value});
    }
  };

  const parse=()=>{
    for(;;){
      const colon=buffer.indexOf(':');
      if(colon<0) return;
      const size=Number(buffer.slice(0,colon));
      if(!Number.isInteger(size)) return;
      const end=colon+1+size;
      if(buffer.length<end+1) return;
      if(buffer[end]!==';') throw Error('BadFrame');
      queue.push(buffer.slice(colon+1,end));
      buffer=buffer.slice(end+1);
    }
  };

  const write=chunk=>{
    if(cancelled) throw Object.assign(Error('Aborted'),{name:'AbortError'});
    if(shutdown) throw Error('Closed');
    events.push({type:'chunk',size:chunk.length});
    buffer+=chunk;
    parse();
    if(queue.length>highWaterMark){
      paused=true;
      events.push({type:'pause'});
    }
    emit();
    // Partial baseline bug: callers never receive a false backpressure signal.
    return true;
  };

  const drain=()=>{
    if(cancelled||shutdown) return;
    paused=false;
    events.push({type:'drain'});
    emit();
  };
  const cancel=()=>{
    if(cancelled||shutdown) return;
    cancelled=true;
    queue.length=0;
    events.push({type:'cancel'});
  };
  const close=()=>{
    if(shutdown) return;
    if(!cancelled) emit();
    shutdown=true;
    events.push({type:'shutdown'});
  };

  signal?.addEventListener('abort',cancel,{once:true});
  return {write,drain,cancel,shutdown:close,trace:()=>copy(events)};
}
