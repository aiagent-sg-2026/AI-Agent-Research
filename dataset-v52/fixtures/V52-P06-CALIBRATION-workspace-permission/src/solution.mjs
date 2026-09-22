import {copy} from './helpers.mjs';

export function createWorkspacePermission(){
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

  function parent(child,parentScope){
    parents.set(child,parentScope);
    emit('parent');
  }
  function allow(subject,scope){
    setRule(subject,scope,'allow');
    emit('allow');
  }
  function deny(subject,scope){
    setRule(subject,scope,'deny');
    emit('deny');
  }
  function disable(subject){
    disabled.add(subject);
    emit('disable');
  }
  function enable(subject){
    disabled.delete(subject);
    emit('enable');
  }

  function decide(subject,scope){
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
    parent,allow,deny,disable,enable,decide,
    trace:()=>copy(events)
  };
}
