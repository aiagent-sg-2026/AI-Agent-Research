import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export const assertions=[{"id": "H1", "ruleIds": ["C1", "C2"]}, {"id": "H2", "ruleIds": ["C3", "C4"]}, {"id": "H3", "ruleIds": ["C3", "C5"]}];
export const coveredRuleIds=["C1", "C2", "C3", "C4", "C5"];
export async function grade(root){const u=pathToFileURL(root+'/src/solution.mjs');u.searchParams.set('v',String(Date.now())+Math.random());const m=await import(u.href);
let seen=[],rolled=[];let store={apply:async o=>seen.push(o.id),rollback:async o=>rolled.push(o.id)};assert.deepEqual(await m.applyBatch([{id:'a'},{id:'a'},{id:'b'}],store),{ok:true,applied:2});assert.deepEqual(seen,['a','b']);seen=[];rolled=[];store={apply:async o=>{seen.push(o.id);if(o.id==='e')throw Error('boom')},rollback:async o=>rolled.push(o.id)};assert.deepEqual(await m.applyBatch([{id:'c'},{id:'d'},{id:'e'},{id:'f'}],store),{ok:false,applied:2,error:'boom',rollbackErrors:[]});assert.deepEqual(rolled,['d','c']);assert.equal(seen.includes('f'),false);seen=[];store={apply:async o=>{if(o.id==='z')throw Error('apply')},rollback:async()=>{throw Error('undo')}};assert.deepEqual(await m.applyBatch([{id:'x'},{id:'z'}],store),{ok:false,applied:1,error:'apply',rollbackErrors:['undo']});
}
