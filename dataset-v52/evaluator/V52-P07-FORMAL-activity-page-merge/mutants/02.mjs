const copy=xs=>xs.map(x=>typeof x==='object'&&x!==null?{...x}:x);
export function createActivityPageMerge(){
  const processed=new Set(),order=[],values=new Map(),events=[];let done=false;
  const emit=type=>events.push({type});
  function acceptPage(page){
    if(done||processed.has(page.cursor)){done=true;emit('stop');return {accepted:false,done:true}}
    processed.add(page.cursor);emit('page');
    for(const entry of page.entries){
      if(values.has(entry.eventId)){order.splice(order.indexOf(entry.eventId),1);order.push(entry.eventId);values.set(entry.eventId,entry.payload);emit('replace')}
      else{order.push(entry.eventId);values.set(entry.eventId,entry.payload);emit('append')}
    }
    if(page.nextCursor===null||processed.has(page.nextCursor)){done=true;emit('stop')}
    return {accepted:true,done};
  }
  return {acceptPage,timeline:()=>order.map(eventId=>({eventId,payload:values.get(eventId)})),state:()=>({done,processed:[...processed]}),trace:()=>copy(events)};
}
