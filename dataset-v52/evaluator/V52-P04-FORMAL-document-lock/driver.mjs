export function runCase(factory,c){let now=0;const x=factory({clock:{now:()=>now},ttl:10}),states=[],errors=[];const tr=()=>x.trace().map(e=>e.type),s=()=>{const v=x.status('d');states.push(v.state+(v.holder?':'+v.holder:''))};let value='ok';
if(c.kind==='basic'){x.lock('d','alice');s()}
else if(c.kind==='busy'){x.lock('d','alice');const r=x.lock('d','bob');errors.push(r.error);s();value=r.error}
else if(c.kind==='renew'){const a=x.lock('d','alice');now=6;let r=x.extend('d','alice','wrong');errors.push(r.error);r=x.extend('d','alice',a.lockId);now=11;s()}
else if(c.kind==='reclaim'){x.lock('d','alice');now=10;s();x.lock('d','bob');s()}
else if(c.kind==='old-owner'){const a=x.lock('d','alice');now=10;x.lock('d','alice');const r=x.unlock('d','alice',a.lockId);errors.push(r.error);s();value=r.error}
else {const a=x.lock('d','alice');x.unlock('d','alice',a.lockId);s()}
return {return:{value},observations:{states,errors,trace:tr()}}}
