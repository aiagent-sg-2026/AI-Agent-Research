import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export const assertions=[{"id": "H1", "ruleIds": ["C1", "C4"]}, {"id": "H2", "ruleIds": ["C2", "C5"]}, {"id": "H3", "ruleIds": ["C3", "C4"]}, {"id": "H4", "ruleIds": ["C4", "C5"]}];
export const coveredRuleIds=["C1", "C2", "C3", "C4", "C5"];
export async function grade(root){const u=pathToFileURL(root+'/src/solution.mjs');u.searchParams.set('v',String(Date.now())+Math.random());const m=await import(u.href);
assert.deepEqual(m.decideAccess({active:false,decision:'allow',role:'auditor'}),{allowed:false,reason:'inactive'});assert.deepEqual(m.decideAccess({active:true,decision:'deny',role:'auditor'}),{allowed:false,reason:'explicit-deny'});assert.deepEqual(m.decideAccess({active:true,decision:'allow',role:'guest'}),{allowed:false,reason:'role-deny'});assert.deepEqual(m.decideAccess({active:true,decision:'allow',role:'member'}),{allowed:true,reason:'explicit-allow'});assert.deepEqual(m.decideAccess({active:true,role:'auditor'}),{allowed:true,reason:'role-default'});assert.deepEqual(m.decideAccess({active:true,role:'member'}),{allowed:false,reason:'default-deny'});
}
