export function runCase(factory,c){const x=factory(),states=[],errors=[];const page=(cursor,nextCursor,entries)=>x.acceptPage({cursor,nextCursor,entries});let value='ok';
if(c.kind==='basic'){page('c1',null,[{eventId:'a',payload:1},{eventId:'b',payload:2}]);states.push(JSON.stringify(x.timeline()))}
else if(c.kind==='replace'){page('c1','c2',[{eventId:'a',payload:1},{eventId:'b',payload:2}]);page('c2',null,[{eventId:'a',payload:9}]);states.push(JSON.stringify(x.timeline()))}
else if(c.kind==='repeat-next'){page('c1','c2',[{eventId:'a',payload:1}]);page('c2','c1',[{eventId:'b',payload:2}]);states.push(String(x.state().done));value='done'}
else if(c.kind==='repeat-page'){page('c1','c2',[{eventId:'a',payload:1}]);const r=page('c1','c3',[{eventId:'b',payload:2}]);states.push(JSON.stringify(x.timeline()),String(r.accepted));value='done'}
else if(c.kind==='stable'){page('c1','c2',[{eventId:'a',payload:1},{eventId:'b',payload:2}]);page('c2',null,[{eventId:'b',payload:7},{eventId:'c',payload:3}]);states.push(JSON.stringify(x.timeline()))}
else if(c.kind==='trace-copy'){page('c1',null,[{eventId:'a',payload:1}]);const t=x.trace();t[0].type='MUT';states.push(x.trace()[0].type)}
else{const input={cursor:'c1',nextCursor:null,entries:[{eventId:'a',payload:{n:1}}]};const before=JSON.stringify(input);page(input.cursor,input.nextCursor,input.entries);states.push(String(JSON.stringify(input)===before))}
return {return:{value},observations:{states,errors,trace:x.trace().map(e=>e.type)}}}
