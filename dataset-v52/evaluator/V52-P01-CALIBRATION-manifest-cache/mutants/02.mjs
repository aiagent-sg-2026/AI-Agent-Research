const cacheKey=(key,generation)=>key+'#'+generation;const cloneTrace=events=>events.map(x=>({...x}));
export function createManifestCache(){
 const values=new Map(),epochs=new Map(),flights=new Map(),events=[];
 const epoch=k=>epochs.get(k)??0;
 async function get(key,generation,load){
  const id=cacheKey(key,generation); events.push({type:'get',key,generation});
  if(values.has(id))return values.get(id);
  if(flights.has(id))return flights.get(id).promise;
  const started=epoch(key); events.push({type:'load',key,generation});
  const promise=(async()=>{try{const value=await load();values.set(id,value);events.push({type:'settle',key,generation});return value}catch(error){events.push({type:'reject',key,generation});throw error}finally{flights.delete(id)}})();
  flights.set(id,{promise,epoch:started}); return promise;
 }
 return {get,invalidate(key){events.push({type:'invalidate',key,generation:0});epochs.set(key,epoch(key)+1);for(const id of [...values.keys()])if(id.startsWith(`${key}#`))values.delete(id)},trace:()=>cloneTrace(events)};
}
