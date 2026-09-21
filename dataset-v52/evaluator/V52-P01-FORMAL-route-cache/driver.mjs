export async function runCase(factory,c){
  const cache=factory(),loads=[],values=[];
  const load=v=>async()=>{loads.push(v);if(v==='TEMP')throw Error('TEMP');return v};
  if(c.kind==='share'){
    let release;const wait=new Promise(r=>release=r);
    const a=cache.resolve('/home',3,async()=>{loads.push('x');await wait;return 'x'});
    const b=cache.resolve('/home',3,async()=>{loads.push('wrong');return 'y'});
    release();values.push(...await Promise.all([a,b]));
  }else if(c.kind==='invalidate'){
    let release;const wait=new Promise(r=>release=r);
    const first=cache.resolve('/home',3,async()=>{loads.push('old');await wait;return 'old'});
    cache.evict('/home');release();
    values.push(await first,await cache.resolve('/home',3,load('fresh')));
  }else if(c.kind==='retry'){
    try{await cache.resolve('/retry',1,load('TEMP'))}catch{}
    values.push(await cache.resolve('/retry',1,load('ok')));
  }else if(c.kind==='generation'){
    values.push(await cache.resolve('/home',1,load('r1')));
    values.push(await cache.resolve('/home',2,load('r2')));
  }else if(c.kind==='ready-invalidate'){
    values.push(await cache.resolve('/ready',1,load('cached')));
    cache.evict('/ready');
    values.push(await cache.resolve('/ready',1,load('fresh')));
  }else if(c.kind==='reject-share'){
    let release;const wait=new Promise(r=>release=r);
    const a=cache.resolve('/shared',1,async()=>{loads.push('TEMP');await wait;throw Error('TEMP')});
    const b=cache.resolve('/shared',1,async()=>{loads.push('wrong');return 'wrong'});
    release();await Promise.allSettled([a,b]);
    values.push(await cache.resolve('/shared',1,load('ok')));
  }else throw Error('unknown case kind');
  return {return:{value:values.at(-1)},observations:{
    loads:loads.length,values,
    keys:[...new Set(cache.trace().filter(x=>x.type==='settle').map(x=>x.route+'@'+x.revision))],
    trace:cache.trace().map(x=>x.type)
  }};
}
