import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export const assertions=[{"id": "H1", "ruleIds": ["C1", "C3"]}, {"id": "H2", "ruleIds": ["C2"]}, {"id": "H3", "ruleIds": ["C4"]}];
export const coveredRuleIds=["C1", "C2", "C3", "C4"];
export async function grade(root){const u=pathToFileURL(root+'/src/solution.mjs');u.searchParams.set('v',String(Date.now())+Math.random());const m=await import(u.href);
const c=new Map();assert.deepEqual(await Promise.all([m.readGeneration(c,'k',1,async()=>1),m.readGeneration(c,'k',2,async()=>2)]),[1,2]);let n=0;const c2=new Map();assert.deepEqual(await Promise.all([m.readGeneration(c2,'q',3,async()=>{n++;await new Promise(r=>setTimeout(r,5));return 9}),m.readGeneration(c2,'q',3,async()=>{n++;return 8})]),[9,9]);assert.equal(n,1);let f=0;await assert.rejects(()=>m.readGeneration(c2,'e',1,async()=>{f++;throw Error('x')}));await assert.rejects(()=>m.readGeneration(c2,'e',1,async()=>{f++;throw Error('y')}));assert.equal(f,2);
}
