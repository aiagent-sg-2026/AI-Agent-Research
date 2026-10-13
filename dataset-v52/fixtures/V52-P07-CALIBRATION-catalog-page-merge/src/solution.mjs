import {copy} from './helpers.mjs';

export function createCatalogPageMerge(){
  const processed=new Set();
  const order=[];
  const values=new Map();
  const events=[];
  let done=false;

  const emit=type=>{
    events.push({type});
  };

  function mergePage(page){
    if(done||processed.has(page.cursor)){
      done=true;
      emit('stop');
      return {accepted:false,done:true};
    }

    processed.add(page.cursor);
    emit('page');

    for(const item of page.items){
      if(values.has(item.id)){
        // Partial baseline bug: replacing a duplicate moves it to the end.
        order.splice(order.indexOf(item.id),1);
        order.push(item.id);
        values.set(item.id,item.value);
        emit('update');
      }else{
        order.push(item.id);
        values.set(item.id,item.value);
        emit('add');
      }
    }

    if(page.nextCursor===null||processed.has(page.nextCursor)){
      done=true;
      emit('stop');
    }
    return {accepted:true,done};
  }

  function items(){
    return order.map(id=>({id,value:values.get(id)}));
  }

  function state(){
    return {done,processed:[...processed]};
  }

  return {mergePage,items,state,trace:()=>copy(events)};
}
