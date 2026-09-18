import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export const assertions=[{"id": "H1", "ruleIds": ["C1", "C3"]}, {"id": "H2", "ruleIds": ["C2"]}, {"id": "H3", "ruleIds": ["C4"]}];
export const coveredRuleIds=["C1", "C2", "C3", "C4"];
export async function grade(root){const u=pathToFileURL(root+'/src/solution.mjs');u.searchParams.set('v',String(Date.now())+Math.random());const m=await import(u.href);
const s=new Map();assert.deepEqual(await Promise.all([m.getSnapshot(s,'a',1,async()=>10),m.getSnapshot(s,'a',2,async()=>20)]),[10,20]);let n=0;const s2=new Map();assert.deepEqual(await Promise.all([m.getSnapshot(s2,'b',5,async()=>{n++;await new Promise(r=>setTimeout(r,5));return 7}),m.getSnapshot(s2,'b',5,async()=>{n++;return 8})]),[7,7]);assert.equal(n,1);let f=0;await assert.rejects(()=>m.getSnapshot(s2,'bad',1,async()=>{f++;throw Error('a')}));await assert.rejects(()=>m.getSnapshot(s2,'bad',1,async()=>{f++;throw Error('b')}));assert.equal(f,2);
}
