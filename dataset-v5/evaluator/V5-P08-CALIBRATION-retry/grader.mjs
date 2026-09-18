import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export const assertions=[{"id": "H1", "ruleIds": ["C1", "C2", "C3"]}, {"id": "H2", "ruleIds": ["C2", "C5"]}, {"id": "H3", "ruleIds": ["C1", "C5"]}, {"id": "H4", "ruleIds": ["C4"]}];
export const coveredRuleIds=["C1", "C2", "C3", "C4", "C5"];
export async function grade(root){const u=pathToFileURL(root+'/src/solution.mjs');u.searchParams.set('v',String(Date.now())+Math.random());const m=await import(u.href);
let calls=0,del=[],first;try{first=await m.requestWithPolicy(async a=>{calls++;if(a<3){const e=Error('t');e.transient=true;throw e}return 'ok'},{onDelay:async n=>del.push(n)})}catch(e){first='threw:'+e.message}assert.equal(first,'ok');assert.equal(calls,3);assert.deepEqual(del,[2,3]);calls=0;await assert.rejects(()=>m.requestWithPolicy(async()=>{calls++;throw Error('perm')}),/perm/);assert.equal(calls,1);calls=0;await assert.rejects(()=>m.requestWithPolicy(async()=>{calls++;const e=Error('t');e.transient=true;throw e},{maxAttempts:2}),/t/);assert.equal(calls,2);const ac=new AbortController();calls=0;await assert.rejects(()=>m.requestWithPolicy(async()=>{calls++;const e=Error('t');e.transient=true;ac.abort();throw e},{signal:ac.signal}),e=>e.name==='AbortError');assert.equal(calls,1);
}
