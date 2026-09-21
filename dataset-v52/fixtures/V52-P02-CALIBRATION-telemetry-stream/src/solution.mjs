import {copy} from './helpers.mjs';

export function createTelemetryStream(onFrame,{highWaterMark=2,signal}={}){
  let buffer='';
  let closed=false;
  let aborted=false;
  let paused=false;
  const queue=[];
  const events=[];

  const emit=()=>{
    while(!paused && !aborted && queue.length){
      const value=queue.shift();
      onFrame(value);
      events.push({type:'frame',value});
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
    if(aborted) throw Object.assign(Error('Aborted'),{name:'AbortError'});
    if(closed) throw Error('Closed');
    events.push({type:'chunk',size:chunk.length});
    buffer+=chunk;
    parse();
    if(queue.length>highWaterMark){
      paused=true;
      events.push({type:'pause'});
    }
    emit();
    // Partial baseline bug: backpressure is never exposed to caller.
    return true;
  };

  const drain=()=>{
    if(closed||aborted) return;
    paused=false;
    events.push({type:'drain'});
    emit();
  };
  const abort=()=>{
    if(aborted||closed) return;
    aborted=true;
    queue.length=0;
    events.push({type:'abort'});
  };
  const close=()=>{
    if(closed) return;
    if(!aborted) emit();
    closed=true;
    events.push({type:'close'});
  };

  signal?.addEventListener('abort',abort,{once:true});
  return {write,drain,abort,close,trace:()=>copy(events)};
}
