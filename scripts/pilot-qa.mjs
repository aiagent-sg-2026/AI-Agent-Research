import assert from 'node:assert/strict';
import { loadDataset, pilotPlan, validatePublicFixtures } from '../src/pilot.mjs';
import { validateRegistry } from '../src/registry.mjs';
const tasks = loadDataset(); const plan = pilotPlan(1), same = pilotPlan(1), different = pilotPlan(2);
assert.deepEqual(tasks.map(x => x.id), ['T01-invoice-tax-rounding','T02-approval-permission','T03-inventory-reservation','T04-query-filter','T05-retry-backoff']);
assert.deepEqual(plan, same); assert.notDeepEqual(plan, different); assert.equal(plan.length, 20); assert.equal(new Set(plan.map(x => `${x.taskId}|${x.protocolId}|${x.arm}|${x.trial}`)).size, 20);
assert.deepEqual([...new Set(plan.map(x=>x.protocolId))], ['P01']); assert.deepEqual([...new Set(plan.map(x=>x.trial))], [1]);
for (const task of tasks) { assert.match(task.grader, /^dataset\/evaluator\/graders\//); assert.match(task.allowedTarget, /^src\//); }
await validatePublicFixtures(); validateRegistry(); console.log('pilot QA passed: exact task IDs/targets, P01, 4 arms, 20 unique seeded cells, clean public fixtures');
