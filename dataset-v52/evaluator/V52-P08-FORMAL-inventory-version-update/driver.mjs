export function runCase(factory,c){const x=factory({sku:'A',qty:5},1),states=[],errors=[],tr=()=>x.trace().map(e=>e.type);let value='ok';
if(c.kind==='success'){x.commit({expectedVersion:1,patch:{qty:6}});states.push(JSON.stringify(x.read()))}
else if(c.kind==='conflict'){const r=x.commit({expectedVersion:0,patch:{qty:99}});states.push(JSON.stringify(x.read()),'cv:'+r.currentVersion);errors.push(r.error);value='CONFLICT'}
else if(c.kind==='sequential'){x.commit({expectedVersion:1,patch:{qty:6}});const r=x.commit({expectedVersion:1,patch:{qty:99}});states.push(JSON.stringify(x.read()),'cv:'+r.currentVersion);errors.push(r.error);value='CONFLICT'}
else if(c.kind==='preserve'){x.commit({expectedVersion:1,patch:{qty:6}});states.push(JSON.stringify(x.read()))}
else if(c.kind==='ignore-version'){x.commit({expectedVersion:1,patch:{revision:99,qty:7}});states.push(JSON.stringify(x.read()))}
else{const req={expectedVersion:1,patch:{revision:99,qty:7}},before=JSON.stringify(req);x.commit(req);states.push(String(JSON.stringify(req)===before));const out=x.read();const k=Object.keys(out.data).at(-1);out.data[k]='MUT';states.push(String(JSON.stringify(x.read())!==JSON.stringify(out)))}
return {return:{value},observations:{states,errors,trace:tr()}}}
