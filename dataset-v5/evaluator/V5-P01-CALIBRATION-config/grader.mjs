import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export const assertions=[{"id": "H1", "ruleIds": ["C1", "C2"]}, {"id": "H2", "ruleIds": ["C2", "C3"]}, {"id": "H3", "ruleIds": ["C3", "C4"]}, {"id": "H4", "ruleIds": ["C5"]}];
export const coveredRuleIds=["C1", "C2", "C3", "C4", "C5"];
export async function grade(root){const u=pathToFileURL(root+'/src/solution.mjs');u.searchParams.set('v',String(Date.now())+Math.random());const m=await import(u.href);
assert.deepEqual(m.resolveSettings({mode:'weird'},'xx'),{mode:'safe',limits:{burst:4,windowMs:1000},region:'xx'});assert.deepEqual(m.resolveSettings({mode:'fast'},'sg'),{mode:'fast',limits:{burst:6,windowMs:1000},region:'sg'});assert.deepEqual(m.resolveSettings({mode:'fast',limits:{burst:9}},'sg'),{mode:'fast',limits:{burst:9,windowMs:1000},region:'sg'});assert.notStrictEqual(m.resolveSettings({},'xx').limits,m.resolveSettings({},'xx').limits);
}
