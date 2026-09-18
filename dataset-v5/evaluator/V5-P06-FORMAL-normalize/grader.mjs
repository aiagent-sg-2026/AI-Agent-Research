import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export const assertions=[{"id": "H1", "ruleIds": ["C2", "C3"]}, {"id": "H2", "ruleIds": ["C4"]}, {"id": "H3", "ruleIds": ["C1", "C5"]}];
export const coveredRuleIds=["C1", "C2", "C3", "C4", "C5"];
export async function grade(root){const u=pathToFileURL(root+'/src/solution.mjs');u.searchParams.set('v',String(Date.now())+Math.random());const m=await import(u.href);
assert.deepEqual(m.normalizeItem({sku:'A',qty:'3'}),{sku:'A',qty:3,enabled:true});assert.deepEqual(m.normalizeItem({sku:'A',qty:0,enabled:false,junk:1}),{sku:'A',qty:0,enabled:false});for(const v of [null,[],{sku:'',qty:1},{sku:'A',qty:'3x'},{sku:'A',qty:-1},{sku:'A',qty:1,enabled:'no'}])assert.equal(m.normalizeItem(v),null);
}
