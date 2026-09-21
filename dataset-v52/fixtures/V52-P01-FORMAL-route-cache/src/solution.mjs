import {routeKey,copy} from './helpers.mjs';

export function createRouteCache(){
  const values=new Map();
  const epochs=new Map();
  const flights=new Map();
  const events=[];
  const epoch=route=>epochs.get(route)??0;

  async function resolve(route,revision,loader){
    const id=routeKey(route,revision);
    events.push({type:'resolve',route,revision});
    if(values.has(id)) return values.get(id);
    if(flights.has(id)) return flights.get(id);

    const started=epoch(route);
    events.push({type:'fetch',route,revision});
    const promise=(async()=>{
      try{
        const value=await loader();
        // Partial baseline bug: an evicted in-flight result becomes visible.
        values.set(id,value);
        events.push({type:'settle',route,revision});
        return value;
      }catch(error){
        events.push({type:'reject',route,revision});
        throw error;
      }finally{
        flights.delete(id);
      }
    })();
    flights.set(id,promise);
    return promise;
  }

  function evict(route){
    events.push({type:'evict',route,revision:0});
    epochs.set(route,epoch(route)+1);
    for(const id of [...values.keys()]){
      if(id.startsWith(route+'@')) values.delete(id);
    }
  }

  return {resolve,evict,trace:()=>copy(events)};
}
