export function createSearchGate(){const e=[];return {query:async f=>{e.push({type:'query'});return f()},state:()=> 'closed',events:()=>e}}
