const copy=xs=>xs.map(x=>typeof x==='object'&&x!==null?{...x}:x);
export function createCatalogPageMerge(){
  const processed=new Set(),order=[],values=new Map(),events=[];let done=false;
  const emit=type=>events.push({type});
  function mergePage(page){
    if(done||processed.has(page.cursor)){emit('page');return {accepted:false,done}}
    processed.add(page.cursor);emit('page');
    for(const item of page.items){
      if(values.has(item.id)){values.set(item.id,item.value);emit('update')}
      else{order.push(item.id);values.set(item.id,item.value);emit('add')}
    }
    if(page.nextCursor===null||processed.has(page.nextCursor)){done=true;emit('stop')}
    return {accepted:true,done};
  }
  return {mergePage,items:()=>order.map(id=>({id,value:values.get(id)})),state:()=>({done,processed:[...processed]}),trace:()=>copy(events)};
}
