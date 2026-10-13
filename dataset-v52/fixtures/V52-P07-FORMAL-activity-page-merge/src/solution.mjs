import {copy} from './helpers.mjs';

export function createActivityPageMerge(){
  const processed=new Set();
  const order=[];
  const values=new Map();
  const events=[];
  let done=false;

  const emit=type=>{
    events.push({type});
  };

  function acceptPage(page){
    if(done||processed.has(page.cursor)){
      done=true;
      emit('stop');
      return {accepted:false,done:true};
    }

    processed.add(page.cursor);
    emit('page');

    for(const entry of page.entries){
      if(values.has(entry.eventId)){
        // Partial baseline bug: replacement changes first-seen ordering.
        order.splice(order.indexOf(entry.eventId),1);
        order.push(entry.eventId);
        values.set(entry.eventId,entry.payload);
        emit('replace');
      }else{
        order.push(entry.eventId);
        values.set(entry.eventId,entry.payload);
        emit('append');
      }
    }

    if(page.nextCursor===null||processed.has(page.nextCursor)){
      done=true;
      emit('stop');
    }
    return {accepted:true,done};
  }

  function timeline(){
    return order.map(eventId=>({eventId,payload:values.get(eventId)}));
  }

  function state(){
    return {done,processed:[...processed]};
  }

  return {acceptPage,timeline,state,trace:()=>copy(events)};
}
