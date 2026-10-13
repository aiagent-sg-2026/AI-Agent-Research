import {copy} from './helpers.mjs';
export function createTopicSubscription(transport,onValue){
  let active=null;
  let generation=0;
  const events=[];
  const emit=type=>events.push({type});
  async function replace(name){
    const old=active;
    const myGeneration=++generation;
    emit('attach');
    const handler=value=>{
      if(!active||active.generation!==myGeneration){emit('stale-drop');return}
      emit('deliver');onValue(value);
    };
    const handle=await transport.attach(name,handler);
    active={name,handle,generation:myGeneration};
    emit('activate');
    if(old){
      try{await transport.detach(old.handle);emit('detach')}
      catch(error){emit('cleanup-error');throw error}
    }
    return {active:name};
  }
  async function stop(){
    if(!active)return;
    const old=active;
    try{await transport.detach(old.handle);emit('detach')}
    catch(error){emit('cleanup-error');throw error}
    active=null;
    generation+=1;
    emit('stop');
  }
  return {replace,stop,active:()=>active?.name??null,trace:()=>copy(events)};
}
