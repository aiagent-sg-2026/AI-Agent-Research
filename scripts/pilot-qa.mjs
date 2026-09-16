import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { loadDataset, pilotPlan, validatePublicFixtures } from '../src/pilot.mjs';
import { loadJson, validateRegistry, root } from '../src/registry.mjs';
const run = (command, args, cwd) => new Promise(resolve => { const child = spawn(command, args, { cwd }); let stdout = '', stderr = ''; child.stdout.on('data', b => stdout += b); child.stderr.on('data', b => stderr += b); child.on('close', code => resolve({ code, stdout, stderr })); });
const tasks = loadDataset(); const plan = pilotPlan(1), same = pilotPlan(1), different = pilotPlan(2);
assert.deepEqual(tasks.map(x => x.id), ['T01-invoice-tax-rounding','T02-approval-permission','T03-inventory-reservation','T04-query-filter','T05-retry-backoff']);
assert.deepEqual(plan, same); assert.notDeepEqual(plan, different); assert.equal(plan.length, 20); assert.equal(new Set(plan.map(x => `${x.taskId}|${x.protocolId}|${x.arm}|${x.trial}`)).size, 20);
assert.deepEqual([...new Set(plan.map(x=>x.protocolId))], ['P01']); assert.deepEqual([...new Set(plan.map(x=>x.trial))], [1]);
const rootPackage = loadJson(path.join(root, 'package.json'));
assert.equal(rootPackage.scripts.test, 'node --test test/*.test.mjs');
assert.match(rootPackage.scripts['pilot:run'], /pilot-out-r1/);
assert.match(tasks.find(x => x.id === 'T02-approval-permission').task, /departments is an array of department objects/);
assert.match(tasks.find(x => x.id === 'T05-retry-backoff').task, /attempt numbers are 1-based/);
assert.match(tasks.find(x => x.id === 'T05-retry-backoff').task, /non-positive attempt numbers with a RangeError/);
assert.match(await fs.readFile(path.join(root, '.gitignore'), 'utf8'), /^pilot-out-r1\/$/m);
assert.match(await fs.readFile(path.join(root, 'docs/experiments/R0-rejected.md'), 'utf8'), /pilot-out-r1/);
for (const task of tasks) { assert.match(task.grader, /^dataset\/evaluator\/graders\//); assert.match(task.allowedTarget, /^src\//); }
await validatePublicFixtures(); validateRegistry();
for (const task of tasks) {
  const fixture = path.resolve(root, task.fixture);
  const visibleResult = await run('npm', ['test'], fixture);
  assert.equal(visibleResult.code, 0, `${task.id} visible fixture test failed:\n${visibleResult.stdout}\n${visibleResult.stderr}`);
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'pilot-qa-hidden-'));
  await fs.cp(fixture, workspace, { recursive: true });
  try {
    const hidden = await run(process.execPath, [path.resolve(root, task.grader), workspace], root);
    assert.notEqual(hidden.code, 0, `${task.id} hidden grader unexpectedly passed untouched fixture`);
    assert.match(`${hidden.stdout}\n${hidden.stderr}`, /AssertionError/, `${task.id} hidden grader did not fail by assertion`);
  } finally { await fs.rm(workspace, { recursive: true, force: true }); }
}
console.log('pilot QA passed: exact task IDs/targets, P01, 4 arms, 20 unique seeded cells, visible fixtures PASS, untouched hidden graders FAIL by AssertionError, clean public fixtures');
