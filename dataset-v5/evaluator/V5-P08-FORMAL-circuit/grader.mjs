import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export const assertions=[{"id": "H1", "ruleIds": ["C1"]}, {"id": "H2", "ruleIds": ["C2"]}, {"id": "H3", "ruleIds": ["C3", "C4", "C5"]}];
export const coveredRuleIds=["C1", "C2", "C3", "C4", "C5"];
export async function grade(root){const u=pathToFileURL(root+'/src/solution.mjs');u.searchParams.set('v',String(Date.now())+Math.random());const m=await import(u.href);
let calls=0;await assert.rejects(()=>m.callWithBreaker(async()=>{calls++;return 1},{open:true,failures:2}),e=>e.name==='CircuitOpen');assert.equal(calls,0);const s={open:false,failures:1};assert.equal(await m.callWithBreaker(async()=>9,s),9);assert.equal(s.failures,0);const s2={open:false,failures:0};const err=Error('boom');await assert.rejects(()=>m.callWithBreaker(async()=>{throw err},s2,{threshold:2}),e=>e===err);assert.deepEqual(s2,{open:false,failures:1});await assert.rejects(()=>m.callWithBreaker(async()=>{throw err},s2,{threshold:2}),e=>e===err);assert.equal(s2.failures,2);assert.equal(s2.open,true);
}
