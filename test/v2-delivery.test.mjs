import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { armPrompt, deliveryContract, freezeV2, runV2Cell, summarizeV2, validateV2Plan, v2Plan, V2_ARMS, V2_INSTRUCTION, V2_PROTOCOL } from '../src/v2-delivery.mjs';
import { loadDataset } from '../src/pilot.mjs';
import { sha256 } from '../src/hash.mjs';

const runCli = (args, cwd) => new Promise(resolve => {
  const child = spawn(process.execPath, [path.resolve('src/v2-delivery.mjs'), ...args], { cwd });
  let stdout = '', stderr = '';
  child.stdout.on('data', b => stdout += b);
  child.stderr.on('data', b => stderr += b);
  child.on('close', code => resolve({ code, stdout, stderr }));
});

test('V2 delivery matrix is exactly 5 tasks × 4 arms × 3 unique trials', () => {
  const plan = v2Plan(91); assert.equal(plan.length, 60); assert.equal(new Set(plan.map(x => x.cellId)).size, 60); validateV2Plan(plan);
  for (const task of loadDataset()) for (const arm of V2_ARMS) assert.equal(plan.filter(x => x.taskId === task.id && x.arm === arm).length, 3);
  assert.deepEqual(v2Plan(91), v2Plan(91)); assert.notDeepEqual(v2Plan(91), v2Plan(92));
});
test('--run takes precedence over --freeze without starting a formal run', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aqb-v2-cli-')), out = path.join(dir, 'out'), freeze = path.join(dir, 'freeze.json');
  await fs.writeFile(freeze, '{}');
  const result = await runCli(['--run', out, '--freeze', freeze], path.resolve('.'));
  assert.equal(result.code, 1);
  assert.match(result.stderr, /invalid V2 freeze manifest/);
  assert.equal(await fs.readFile(freeze, 'utf8'), '{}');
  await assert.rejects(() => fs.access(out));
});
test('A1/A2/A3 share the frozen semantic instruction and A0 has none', () => {
  const task = loadDataset()[0], contract = deliveryContract();
  assert.equal(sha256(V2_INSTRUCTION), contract.arms.find(x => x.id === 'A1').semantics); assert.equal(contract.arms.find(x => x.id === 'A1').semantics, contract.arms.find(x => x.id === 'A2').semantics); assert.equal(contract.arms.find(x => x.id === 'A2').semantics, contract.arms.find(x => x.id === 'A3').semantics); assert.equal(contract.arms.find(x => x.id === 'A0').semantics, null);
  assert.doesNotMatch(armPrompt(task, 'A0'), /Engineering instruction|skill invocation/i); assert.match(armPrompt(task, 'A1'), /Engineering instruction/); assert.doesNotMatch(armPrompt(task, 'A2'), /Engineering instruction/); assert.match(armPrompt(task, 'A3'), /skill invocation/i);
});
test('freeze records task, evaluator, instruction, and contract provenance without copying evaluator content', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aqb-v2-freeze-')), file = path.join(dir, 'freeze.json'), manifest = await freezeV2(file);
  assert.equal(manifest.version, V2_PROTOCOL); assert.equal(Object.keys(manifest.taskHashes).length, 5); assert.equal(Object.keys(manifest.evaluatorHashes).length, 5); assert.equal(manifest.instructionHash, sha256(V2_INSTRUCTION)); assert.ok(manifest.entries.some(x => x.file.includes('evaluator/graders'))); assert.doesNotMatch(await fs.readFile(file, 'utf8'), /AssertionError|expected patch|answer key/i);
});
test('stub V2 cell keeps evaluator material out of candidate and records scope/regression/failure evidence', async () => {
  const out = await fs.mkdtemp(path.join(os.tmpdir(), 'aqb-v2-cell-')), cell = v2Plan(1)[0], metrics = await runV2Cell(cell, { out, adapter: { executable: 'node', argv: [path.resolve('examples/stub-agent.mjs'), '{promptFile}'] } });
  assert.equal(metrics.outcome, 'task-failure'); assert.equal(metrics.failureClass, 'TASK_LOGIC'); assert.equal(metrics.regressionFree, true); assert.equal(metrics.scope.allowedTarget, loadDataset().find(t => t.id === cell.taskId).allowedTarget); const names = await fs.readdir(path.join(out, 'cells', cell.cellId, 'candidate')); assert.equal(names.includes('evaluator'), false); assert.equal(names.includes('AGENTS.md'), cell.arm === 'A2'); assert.equal(names.includes('.agent-skills'), cell.arm === 'A3');
});
test('summary is fail-closed about incomplete evidence and reports trial coverage', async () => {
  const out = await fs.mkdtemp(path.join(os.tmpdir(), 'aqb-v2-summary-')); await fs.mkdir(path.join(out, 'cells', 'x'), { recursive: true }); await fs.writeFile(path.join(out, 'cells', 'x', 'metrics.json'), JSON.stringify({ cellId: 'x', arm: 'A0', taskId: 'T01', trial: 1, outcome: 'success', success: true, visibleTests: { passed: true }, infrastructureInvalid: false, failureClass: null, scope: { compliant: true }, regressionFree: true, recovery: { recovered: false }, sanitized: true, tokens: { totalTokens: 2 }, latencyMs: 3, diffBytes: 1, retries: 0 })); const summary = await summarizeV2(out, false); assert.equal(summary.cells, 1); assert.equal(summary.reliability.expectedCellCount, 60); assert.equal(summary.reliability.uniqueCellCount, 1); assert.equal(summary.arms.A0.meanTokens, 2);
});
test('summary rejects invalid evidence instead of treating it as a result', async () => {
  const out = await fs.mkdtemp(path.join(os.tmpdir(), 'aqb-v2-invalid-')); await fs.mkdir(path.join(out, 'cells', 'x'), { recursive: true }); await fs.writeFile(path.join(out, 'cells', 'x', 'metrics.json'), JSON.stringify({ arm: 'A0', success: true })); await assert.rejects(() => summarizeV2(out, false), /invalid V2 evidence: missing cellId/);
});
