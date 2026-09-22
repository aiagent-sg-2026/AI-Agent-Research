import {copy} from './helpers.mjs';

export function createReportPermission(){
  const parents=new Map();
  const rules=new Map();
  const disabled=new Set();
  const events=[];
  const emit=type=>events.push({type});

  function setRule(subject,scope,value){
    let map=rules.get(subject);
    if(!map){
      map=new Map();
      rules.set(subject,map);
    }
    map.set(scope,value);
  }

  function link(child,parentScope){
    parents.set(child,parentScope);
    emit('link');
  }
  function grant(subject,scope){
    setRule(subject,scope,'allow');
    emit('grant');
  }
  function block(subject,scope){
    setRule(subject,scope,'deny');
    emit('block');
  }
  function suspend(subject){
    disabled.add(subject);
    emit('suspend');
  }
  function resume(subject){
    disabled.delete(subject);
    emit('resume');
  }

  function check(subject,scope){
    if(disabled.has(subject)){
      emit('reject');
      return {value:'DENY',reason:'disabled'};
    }

    const chain=[];
    const seen=new Set();
    for(let current=scope;current&&!seen.has(current);current=parents.get(current)){
      seen.add(current);
      chain.push(current);
    }

    // Partial baseline bug: the closest rule wins immediately,
    // so a child allow can incorrectly defeat an ancestor explicit deny.
    for(const current of chain){
      const rule=rules.get(subject)?.get(current);
      if(rule==='deny'){
        emit('reject');
        return {value:'DENY',reason:'explicit-deny'};
      }
      if(rule==='allow'){
        emit('permit');
        return {value:'ALLOW',reason:'allow:'+current};
      }
    }

    emit('reject');
    return {value:'DENY',reason:'default-deny'};
  }

  return {
    link,grant,block,suspend,resume,check,
    trace:()=>copy(events)
  };
}
