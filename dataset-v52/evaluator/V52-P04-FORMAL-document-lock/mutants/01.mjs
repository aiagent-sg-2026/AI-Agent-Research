const copy=xs=>xs.map(x=>({...x}));
export function createDocumentLock({clock,ttl=10}){
  const records=new Map(),events=[];let seq=0;
  const isActive=rec=>Boolean(rec)&&clock.now()<rec.expiresAt;
  const emit=type=>events.push({type});
  function lock(docId,holder){
    const old=records.get(docId);
    if(false&&isActive(old)){emit('deny');return {ok:false,error:'BUSY'}}
    const lockId='d'+(++seq),expiresAt=clock.now()+ttl;
    records.set(docId,{holder,lockId,expiresAt});
    emit(old?'reclaim':'lock');
    return {ok:true,lockId,expiresAt};
  }
  function extend(docId,holder,lockId){
    const rec=records.get(docId);
    if(!rec||!isActive(rec)){emit('deny');return {ok:false,error:'STALE'}}
    if(rec.holder!==holder||rec.lockId!==lockId){emit('deny');return {ok:false,error:'NOT_OWNER'}}
    rec.expiresAt=clock.now()+ttl;emit('extend');return {ok:true,expiresAt:rec.expiresAt};
  }
  function unlock(docId,holder,lockId){
    const rec=records.get(docId);
    if(!rec||!isActive(rec)){emit('deny');return {ok:false,error:'STALE'}}
    if(rec.holder!==holder||rec.lockId!==lockId){emit('deny');return {ok:false,error:'NOT_OWNER'}}
    records.delete(docId);emit('unlock');return {ok:true};
  }
  function status(docId){
    const rec=records.get(docId);if(!rec)return {state:'empty'};
    if(!isActive(rec))return {state:'stale',holder:rec.holder};
    return {state:'active',holder:rec.holder,lockId:rec.lockId,expiresAt:rec.expiresAt};
  }
  return {lock,extend,unlock,status,trace:()=>copy(events)};
}
