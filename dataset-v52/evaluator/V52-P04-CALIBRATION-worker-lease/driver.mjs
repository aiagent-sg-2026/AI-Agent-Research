export function runCase(factory,c){let now=0;const x=factory({clock:{now:()=>now},ttl:10}),states=[],errors=[];const tr=()=>x.trace().map(e=>e.type),s=()=>{const v=x.state('k');states.push(v.state+(v.owner?':'+v.owner:''))};let value='ok';
if(c.kind==='basic'){x.acquire('k','alice');s()}
else if(c.kind==='busy'){x.acquire('k','alice');const r=x.acquire('k','bob');errors.push(r.error);s();value=r.error}
else if(c.kind==='renew'){const a=x.acquire('k','alice');now=6;let r=x.renew('k','alice','wrong',10);errors.push(r.error);r=x.renew('k','alice',a.token,10);now=11;s()}
else if(c.kind==='reclaim'){x.acquire('k','alice');now=10;s();x.acquire('k','bob');s()}
else if(c.kind==='old-owner'){const a=x.acquire('k','alice');now=10;x.acquire('k','alice');const r=x.release('k','alice',a.token);errors.push(r.error);s();value=r.error}
else {const a=x.acquire('k','alice');x.release('k','alice',a.token);s()}
return {return:{value},observations:{states,errors,trace:tr()}}}
