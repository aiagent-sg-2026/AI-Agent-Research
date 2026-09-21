export async function runCase(factory,c){
  let now=0;
  const limit=c.kind==='consecutive'?2:1;
  const unit=factory({failureLimit:limit,cooldown:10,clock:{now:()=>now}});
  const states=[],results=[],errors=[];
  const op=ok=>async()=>{if(!ok)throw Error('DOWN');return 'ok'};
  const take=async operation=>{
    try{results.push(await unit.query(operation))}
    catch(e){errors.push(e.name+':'+e.message)}
    states.push(unit.state());
  };
  if(c.kind==='open'){
    await take(op(true)); await take(op(false)); await take(op(true));
  }else if(c.kind==='probe'){
    await take(op(false)); now=9; await take(op(true)); now=10; await take(op(true));
  }else if(c.kind==='probe-fail'){
    await take(op(false)); now=10; await take(op(false)); await take(op(true)); now=20; await take(op(true));
  }else if(c.kind==='consecutive'){
    await take(op(false)); await take(op(true)); await take(op(false)); await take(op(true));
  }else if(c.kind==='busy'){
    await take(op(false)); now=10;
    let release; const wait=new Promise(r=>release=r);
    const first=unit.query(async()=>{await wait;return 'ok'}).then(v=>{results.push(v);states.push(unit.state())}).catch(e=>{errors.push(e.name+':'+e.message);states.push(unit.state())});
    await Promise.resolve();
    await take(op(true));
    release(); await first;
  }else if(c.kind==='copy'){
    await take(op(true));
    const snapshot=unit.events(); if(snapshot[0])snapshot[0].type='tampered';
  }else throw Error('unknown case kind');
  return {return:{value:results.at(-1)},observations:{states,results,errors,events:unit.events().map(x=>x.type)}};
}
