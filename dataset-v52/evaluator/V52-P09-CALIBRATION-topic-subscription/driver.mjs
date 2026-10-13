export async function runCase(factory,c){const handles=[],delivered=[],errors=[];let failDetach=false;const transport={attach:async(name,handler)=>{const h={id:handles.length+1,name,handler};handles.push(h);return h},detach:async h=>{if(failDetach)throw Error('DETACH_FAIL')}};const x=factory(transport,v=>delivered.push(v)),states=[],tr=()=>x.trace().map(e=>e.type);let value='ok';
if(c.kind==='first'){await x.replace('a');states.push(x.active())}
else if(c.kind==='replace'){await x.replace('a');await x.replace('b');states.push(x.active())}
else if(c.kind==='cleanup-fail'){await x.replace('a');failDetach=true;try{await x.replace('b')}catch(e){errors.push(e.message)}states.push(x.active(),String(handles.length));value='ERR'}
else if(c.kind==='stale'){await x.replace('a');const old=handles[0];await x.replace('b');old.handler('old');handles[1].handler('new');states.push(delivered.join(','))}
else if(c.kind==='stop'){await x.replace('a');await x.stop();await x.stop();states.push(String(x.active()))}
else{await x.replace('a');const t=x.trace();t[0].type='MUT';states.push(x.trace()[0].type)}
return {return:{value},observations:{states,errors,trace:tr()}}}
