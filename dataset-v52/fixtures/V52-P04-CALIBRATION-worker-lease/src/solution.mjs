import {copy} from './helpers.mjs';
export function createWorkerLease({clock,ttl=10}){
  const records=new Map(),events=[];let seq=0;
  const isActive=rec=>Boolean(rec)&&clock.now()<=rec.expiresAt;
  const emit=type=>events.push({type});
  function acquire(key,owner){
    const old=records.get(key);
    if(isActive(old)){emit('deny');return {ok:false,error:'BUSY'}}
    const token='w'+(++seq),expiresAt=clock.now()+ttl;
    records.set(key,{owner,token,expiresAt});
    emit(old?'reclaim':'acquire');
    return {ok:true,token,expiresAt};
  }
  function renew(key,owner,token){
    const rec=records.get(key);
    if(!rec||!isActive(rec)){emit('deny');return {ok:false,error:'STALE'}}
    if(rec.owner!==owner||rec.token!==token){emit('deny');return {ok:false,error:'NOT_OWNER'}}
    rec.expiresAt=clock.now()+ttl;emit('renew');return {ok:true,expiresAt:rec.expiresAt};
  }
  function release(key,owner,token){
    const rec=records.get(key);
    if(!rec||!isActive(rec)){emit('deny');return {ok:false,error:'STALE'}}
    if(rec.owner!==owner||rec.token!==token){emit('deny');return {ok:false,error:'NOT_OWNER'}}
    records.delete(key);emit('release');return {ok:true};
  }
  function state(key){
    const rec=records.get(key);if(!rec)return {state:'empty'};
    if(!isActive(rec))return {state:'stale',owner:rec.owner};
    return {state:'active',owner:rec.owner,token:rec.token,expiresAt:rec.expiresAt};
  }
  return {acquire,renew,release,state,trace:()=>copy(events)};
}
