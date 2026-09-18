import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export const assertions=[{"id": "H1", "ruleIds": ["C1", "C2"]}, {"id": "H2", "ruleIds": ["C2", "C3"]}, {"id": "H3", "ruleIds": ["C3", "C4"]}, {"id": "H4", "ruleIds": ["C5"]}];
export const coveredRuleIds=["C1", "C2", "C3", "C4", "C5"];
export async function grade(root){const u=pathToFileURL(root+'/src/solution.mjs');u.searchParams.set('v',String(Date.now())+Math.random());const m=await import(u.href);
assert.deepEqual(m.buildThrottle({profile:'bad'},'core'),{profile:'steady',tuning:{concurrency:2,timeoutMs:500},zone:'core'});assert.deepEqual(m.buildThrottle({profile:'turbo'},'edge'),{profile:'turbo',tuning:{concurrency:5,timeoutMs:200},zone:'edge'});assert.deepEqual(m.buildThrottle({profile:'turbo',tuning:{timeoutMs:450}},'edge'),{profile:'turbo',tuning:{concurrency:5,timeoutMs:450},zone:'edge'});assert.deepEqual(Object.keys(m.buildThrottle({extra:1},'core')).sort(),['profile','tuning','zone']);
}
