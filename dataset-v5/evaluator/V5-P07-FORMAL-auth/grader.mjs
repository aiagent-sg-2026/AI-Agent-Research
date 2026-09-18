import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export const assertions=[{"id": "H1", "ruleIds": ["C1", "C4"]}, {"id": "H2", "ruleIds": ["C2", "C3"]}, {"id": "H3", "ruleIds": ["C3", "C4"]}, {"id": "H4", "ruleIds": ["C3", "C5"]}];
export const coveredRuleIds=["C1", "C2", "C3", "C4", "C5"];
export async function grade(root){const u=pathToFileURL(root+'/src/solution.mjs');u.searchParams.set('v',String(Date.now())+Math.random());const m=await import(u.href);
assert.deepEqual(m.authorizeAction({locked:true,effect:'allow',role:'admin',action:'delete'}),{allowed:false,reason:'locked'});assert.deepEqual(m.authorizeAction({effect:'deny',role:'admin',action:'read'}),{allowed:false,reason:'explicit-deny'});assert.deepEqual(m.authorizeAction({effect:'allow',role:'viewer',action:'write'}),{allowed:false,reason:'role-deny'});assert.deepEqual(m.authorizeAction({effect:'allow',role:'editor',action:'write'}),{allowed:true,reason:'explicit-allow'});assert.deepEqual(m.authorizeAction({role:'viewer',action:'read'}),{allowed:true,reason:'role-default'});assert.deepEqual(m.authorizeAction({role:'editor',action:'delete'}),{allowed:false,reason:'role-deny'});
}
