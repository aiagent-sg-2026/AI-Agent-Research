export function runCase(factory,c){const x=factory({name:'Ada',city:'SG'},1),states=[],errors=[],tr=()=>x.trace().map(e=>e.type);let value='ok';
if(c.kind==='success'){x.update({expectedVersion:1,patch:{city:'KL'}});states.push(JSON.stringify(x.snapshot()))}
else if(c.kind==='conflict'){const r=x.update({expectedVersion:0,patch:{city:'XX'}});states.push(JSON.stringify(x.snapshot()),'cv:'+r.currentVersion);errors.push(r.error);value='CONFLICT'}
else if(c.kind==='sequential'){x.update({expectedVersion:1,patch:{city:'KL'}});const r=x.update({expectedVersion:1,patch:{city:'XX'}});states.push(JSON.stringify(x.snapshot()),'cv:'+r.currentVersion);errors.push(r.error);value='CONFLICT'}
else if(c.kind==='preserve'){x.update({expectedVersion:1,patch:{city:'KL'}});states.push(JSON.stringify(x.snapshot()))}
else if(c.kind==='ignore-version'){x.update({expectedVersion:1,patch:{version:99,city:'MY'}});states.push(JSON.stringify(x.snapshot()))}
else{const req={expectedVersion:1,patch:{version:99,city:'MY'}},before=JSON.stringify(req);x.update(req);states.push(String(JSON.stringify(req)===before));const out=x.snapshot();const k=Object.keys(out.data).at(-1);out.data[k]='MUT';states.push(String(JSON.stringify(x.snapshot())!==JSON.stringify(out)))}
return {return:{value},observations:{states,errors,trace:tr()}}}
