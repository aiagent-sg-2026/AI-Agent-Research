export async function runCase(factory,c){
  const cache=factory(),loads=[],values=[];
  const trace=()=>cache.trace().map(x=>x.type);
  const load=v=>async()=>{loads.push(v);if(v==='TEMP')throw Error('TEMP');return v};
  if(c.kind==='share'){
    let release;const wait=new Promise(r=>release=r);
    const a=cache.get('asset',1,async()=>{loads.push('a');await wait;return 'a'});
    const b=cache.get('asset',1,async()=>{loads.push('wrong');return 'b'});
    release();values.push(...await Promise.all([a,b]));
  }else if(c.kind==='invalidate'){
    let release;const wait=new Promise(r=>release=r);
    const first=cache.get('asset',1,async()=>{loads.push('old');await wait;return 'old'});
    cache.invalidate('asset');release();
    values.push(await first,await cache.get('asset',1,load('new')));
  }else if(c.kind==='retry'){
    try{await cache.get('retry',1,load('TEMP'))}catch{}
    values.push(await cache.get('retry',1,load('ok')));
  }else if(c.kind==='generation'){
    values.push(await cache.get('asset',1,load('g1')));
    values.push(await cache.get('asset',2,load('g2')));
  }else if(c.kind==='ready-invalidate'){
    values.push(await cache.get('ready',1,load('cached')));
    cache.invalidate('ready');
    values.push(await cache.get('ready',1,load('fresh')));
  }else if(c.kind==='reject-share'){
    let release;const wait=new Promise(r=>release=r);
    const a=cache.get('shared',1,async()=>{loads.push('TEMP');await wait;throw Error('TEMP')});
    const b=cache.get('shared',1,async()=>{loads.push('wrong');return 'wrong'});
    release();await Promise.allSettled([a,b]);
    values.push(await cache.get('shared',1,load('ok')));
  }else throw Error('unknown case kind');
  return {return:{value:values.at(-1)},observations:{
    loads:loads.length,values,
    cacheKeys:[...new Set(cache.trace().filter(x=>x.type==='settle').map(x=>x.key+'#'+x.generation))],
    trace:trace()
  }};
}
