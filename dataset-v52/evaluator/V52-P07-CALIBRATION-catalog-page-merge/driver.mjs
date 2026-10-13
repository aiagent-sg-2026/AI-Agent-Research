export function runCase(factory,c){const x=factory(),states=[],errors=[];const page=(cursor,nextCursor,items)=>x.mergePage({cursor,nextCursor,items});let value='ok';
if(c.kind==='basic'){page('c1',null,[{id:'a',value:1},{id:'b',value:2}]);states.push(JSON.stringify(x.items()))}
else if(c.kind==='replace'){page('c1','c2',[{id:'a',value:1},{id:'b',value:2}]);page('c2',null,[{id:'a',value:9}]);states.push(JSON.stringify(x.items()))}
else if(c.kind==='repeat-next'){page('c1','c2',[{id:'a',value:1}]);page('c2','c1',[{id:'b',value:2}]);states.push(String(x.state().done));value='done'}
else if(c.kind==='repeat-page'){page('c1','c2',[{id:'a',value:1}]);const r=page('c1','c3',[{id:'b',value:2}]);states.push(JSON.stringify(x.items()),String(r.accepted));value='done'}
else if(c.kind==='stable'){page('c1','c2',[{id:'a',value:1},{id:'b',value:2}]);page('c2',null,[{id:'b',value:7},{id:'c',value:3}]);states.push(JSON.stringify(x.items()))}
else if(c.kind==='trace-copy'){page('c1',null,[{id:'a',value:1}]);const t=x.trace();t[0].type='MUT';states.push(x.trace()[0].type)}
else{const input={cursor:'c1',nextCursor:null,items:[{id:'a',value:{n:1}}]};const before=JSON.stringify(input);page(input.cursor,input.nextCursor,input.items);states.push(String(JSON.stringify(input)===before))}
return {return:{value},observations:{states,errors,trace:x.trace().map(e=>e.type)}}}
