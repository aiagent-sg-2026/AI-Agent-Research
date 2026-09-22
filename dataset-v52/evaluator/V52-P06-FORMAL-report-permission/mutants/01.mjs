const copy=xs=>xs.map(x=>({...x}));
export function createReportPermission(){
 const parents=new Map(),rules=new Map(),disabled=new Set(),events=[];const emit=type=>events.push({type});
 const setRule=(subject,scope,value)=>{let m=rules.get(subject);if(!m){m=new Map();rules.set(subject,m)}m.set(scope,value)};
 function link(child,p){parents.set(child,p);emit('link')}
 function grant(subject,scope){setRule(subject,scope,'allow');emit('grant')}
 function block(subject,scope){setRule(subject,scope,'deny');emit('block')}
 function suspend(subject){disabled.add(subject);emit('suspend')}
 function resume(subject){disabled.delete(subject);emit('resume')}
 function check(subject,scope){if(disabled.has(subject)){emit('reject');return {value:'DENY',reason:'disabled'}}const chain=[scope];let nearestAllow=null;for(const s of chain){const r=rules.get(subject)?.get(s);if(r==='deny'){emit('reject');return {value:'DENY',reason:'explicit-deny'}}if(nearestAllow===null&&r==='allow')nearestAllow=s}if(nearestAllow!==null){emit('permit');return {value:'ALLOW',reason:'allow:'+nearestAllow}}emit('reject');return {value:'DENY',reason:'default-deny'}}
 return {link,grant,block,suspend,resume,check,trace:()=>copy(events)};
}
