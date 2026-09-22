export function runCase(factory,c){const x=factory(),states=[],errors=[],tr=()=>x.trace().map(e=>e.type);x.link('section','root');let r;
if(c.kind==='inherit'){x.grant('alice','root');r=x.check('alice','section')}
else if(c.kind==='local-deny'){x.grant('alice','root');x.block('alice','section');r=x.check('alice','section')}
else if(c.kind==='ancestor-deny'){x.block('alice','root');x.grant('alice','section');r=x.check('alice','section')}
else if(c.kind==='local-allow'){x.grant('alice','section');r=x.check('alice','section')}
else if(c.kind==='disabled'){x.grant('alice','root');x.suspend('alice');r=x.check('alice','section')}
else r=x.check('alice','section');
states.push(r.value+':'+r.reason);return {return:{value:r.value==='ALLOW'?'ok':'DENY'},observations:{states,errors,trace:tr()}}}
