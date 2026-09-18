import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export const assertions=[{"id": "H1", "ruleIds": ["C1", "C2"]}, {"id": "H2", "ruleIds": ["C1", "C3"]}, {"id": "H3", "ruleIds": ["C4"]}, {"id": "H4", "ruleIds": ["C5"]}];
export const coveredRuleIds=["C1", "C2", "C3", "C4", "C5"];
export async function grade(root){const u=pathToFileURL(root+'/src/solution.mjs');u.searchParams.set('v',String(Date.now())+Math.random());const m=await import(u.href);
let opened=[];let t={open:async v=>{opened.push(v);return {version:v,close:async()=>{}}}};assert.equal((await m.connectPeer({versions:['v2','v1'],capabilities:['stream']},t)).version,'v2');assert.deepEqual(opened,['v2']);opened=[];t={open:async v=>{opened.push(v);if(v==='v2')throw Error('reject');return {version:v,close:async()=>{}}}};assert.equal((await m.connectPeer({versions:['v2','v1'],capabilities:['stream']},t)).version,'v1');assert.deepEqual(opened,['v2','v1']);let closed=0;t={open:async v=>v==='v2'?{version:'wrong',close:async()=>closed++}:{version:'v1'}};assert.equal((await m.connectPeer({versions:['v2','v1'],capabilities:['stream']},t)).version,'v1');assert.equal(closed,1);await assert.rejects(()=>m.connectPeer({versions:['v2'],capabilities:[]},{open:async v=>({version:v})}),/compatible/);
}
