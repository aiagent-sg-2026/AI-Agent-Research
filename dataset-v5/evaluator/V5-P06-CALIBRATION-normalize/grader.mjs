import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export const assertions=[{"id": "H1", "ruleIds": ["C2", "C3"]}, {"id": "H2", "ruleIds": ["C4"]}, {"id": "H3", "ruleIds": ["C1", "C5"]}];
export const coveredRuleIds=["C1", "C2", "C3", "C4", "C5"];
export async function grade(root){const u=pathToFileURL(root+'/src/solution.mjs');u.searchParams.set('v',String(Date.now())+Math.random());const m=await import(u.href);
assert.deepEqual(m.normalizeRecord({name:'x',count:'2'}),{name:'x',count:2,active:false});assert.deepEqual(m.normalizeRecord({name:'x',count:0,active:false,extra:1}),{name:'x',count:0,active:false});for(const v of [null,[],{name:'',count:1},{name:'x',count:'2x'},{name:'x',count:-1},{name:'x',count:1,active:'yes'}])assert.equal(m.normalizeRecord(v),null);
}
