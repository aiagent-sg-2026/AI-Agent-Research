export function runCase(factory,c){
  const delivered=[];
  const ac=c.kind==='signal'?new AbortController():null;
  const highWaterMark=c.kind in {pressure:1,'abort-pressure':1}?0:2;
  const stream=factory(v=>delivered.push(v),{highWaterMark,signal:ac?.signal});
  const accepted=[];
  let error=null;
  const write=value=>{try{accepted.push(stream.write(value))}catch(e){error=e.name+':'+e.message}};
  if(c.kind==='partial'){
    write('3:re'); write('d;4:blue;');
  }else if(c.kind==='pressure'){
    write('1:a;1:b;'); stream.drain(); write('1:c;');
  }else if(c.kind==='abort'){
    write(''); stream.abort(); stream.close(); write('1:x;');
  }else if(c.kind==='multi'){
    write('1:a;1:b;');
  }else if(c.kind==='close'){
    write('1:x;'); stream.close(); stream.close(); write('1:y;');
  }else if(c.kind==='signal'){
    write(''); ac.abort(); stream.close(); write('1:z;');
  }else throw Error('unknown case kind');
  return {return:accepted.at(-1),observations:{
    frames:delivered,writes:accepted.length,accepted,
    trace:stream.trace().map(x=>x.type),error
  }};
}
