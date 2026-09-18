import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export const assertions=[{"id": "H1", "ruleIds": ["C1"]}, {"id": "H2", "ruleIds": ["C2", "C3", "C4"]}, {"id": "H3", "ruleIds": ["C3", "C5"]}];
export const coveredRuleIds=["C1", "C2", "C3", "C4", "C5"];
export async function grade(root){const u=pathToFileURL(root+'/src/solution.mjs');u.searchParams.set('v',String(Date.now())+Math.random());const m=await import(u.href);
let order=[];const src={i:0,async next(){order.push('pull'+this.i);return this.i++<2?{value:this.i,done:false}:{done:true}},[Symbol.asyncIterator](){return this}};await m.drain(src,async v=>{order.push('start'+v);await new Promise(r=>setTimeout(r,2));order.push('end'+v)});assert.deepEqual(order.slice(0,4),['pull0','start1','end1','pull1']);let pulls=0,closed=0;const c={async next(){pulls++;return {value:pulls,done:false}},async return(){closed++;return {done:true}},[Symbol.asyncIterator](){return this}};const ac=new AbortController();assert.deepEqual(await m.drain(c,async v=>{if(v===2)ac.abort()},ac.signal),{closed:true,count:2});assert.equal(closed,1);assert.equal(pulls,2);const e={async next(){return {value:1,done:false}},async return(){closed++;return {done:true}},[Symbol.asyncIterator](){return this}};await assert.rejects(()=>m.drain(e,async()=>{throw Error('handler')}),/handler/);
}
