import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export const assertions=[{"id": "H1", "ruleIds": ["C1", "C2"]}, {"id": "H2", "ruleIds": ["C1", "C3"]}, {"id": "H3", "ruleIds": ["C4"]}, {"id": "H4", "ruleIds": ["C5"]}];
export const coveredRuleIds=["C1", "C2", "C3", "C4", "C5"];
export async function grade(root){const u=pathToFileURL(root+'/src/solution.mjs');u.searchParams.set('v',String(Date.now())+Math.random());const m=await import(u.href);
let opened=[];let t={open:async c=>{opened.push(c);return {codec:c,close:async()=>{}}}};assert.equal((await m.openCodec({codecs:['c3','c2'],capabilities:['binary']},t)).codec,'c3');assert.deepEqual(opened,['c3']);opened=[];t={open:async c=>{opened.push(c);if(c==='c3')throw Error('x');return {codec:c}}};assert.equal((await m.openCodec({codecs:['c3','c2'],capabilities:['binary']},t)).codec,'c2');assert.deepEqual(opened,['c3','c2']);let closed=0;t={open:async c=>c==='c3'?{codec:'bad',close:async()=>closed++}:{codec:'c2'}};assert.equal((await m.openCodec({codecs:['c3','c2'],capabilities:['binary']},t)).codec,'c2');assert.equal(closed,1);await assert.rejects(()=>m.openCodec({codecs:['c3'],capabilities:[]},{open:async c=>({codec:c})}),/codec/);
}
