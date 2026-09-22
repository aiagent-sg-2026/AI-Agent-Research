export function runCase(factory,c){const x=factory(),states=[],errors=[],tr=()=>x.trace().map(e=>e.type);x.parent('child','root');let r;
if(c.kind==='inherit'){x.allow('alice','root');r=x.decide('alice','child')}
else if(c.kind==='local-deny'){x.allow('alice','root');x.deny('alice','child');r=x.decide('alice','child')}
else if(c.kind==='ancestor-deny'){x.deny('alice','root');x.allow('alice','child');r=x.decide('alice','child')}
else if(c.kind==='local-allow'){x.allow('alice','child');r=x.decide('alice','child')}
else if(c.kind==='disabled'){x.allow('alice','root');x.disable('alice');r=x.decide('alice','child')}
else r=x.decide('alice','child');
states.push(r.value+':'+r.reason);return {return:{value:r.value==='ALLOW'?'ok':'DENY'},observations:{states,errors,trace:tr()}}}
