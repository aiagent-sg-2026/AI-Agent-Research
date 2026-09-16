import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { loadJson, validateRegistry, root } from './registry.mjs';
import { buildPrompt } from './prompt.mjs';
import { sha256 } from './hash.mjs';
import { executeAdapter } from './execute.mjs';

export const PILOT_PROTOCOL = 'P01';
export const PILOT_ARMS = ['B0', 'B1', 'B2', 'FULL'];
export const PILOT_TASK_IDS = ['T01-invoice-tax-rounding', 'T02-approval-permission', 'T03-inventory-reservation', 'T04-query-filter', 'T05-retry-backoff'];
export const datasetFile = path.join(root, 'dataset/tasks.json');
export const pilotScriptFiles = ['src/pilot.mjs', 'scripts/pilot-qa.mjs', 'src/codex-luna-adapter.mjs', 'src/execute.mjs', 'src/prompt.mjs', 'src/hash.mjs', 'src/registry.mjs'];
const forbidden = ['hidden grader', 'answer key', 'expected patch', 'competitor output', 'prior trial outcomes', 'evaluator-owned', 'evaluator/graders'];

async function walk(dir) {
  const files = [];
  for (const e of (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...await walk(file)); else files.push(file);
  }
  return files;
}
export function loadDataset() {
  const d = loadJson(datasetFile);
  if (d.version !== 'pilot-v1' || !Array.isArray(d.tasks) || d.tasks.length !== 5) throw new Error('pilot dataset must contain exactly 5 tasks');
  const ids = new Set();
  for (const t of d.tasks) {
    if (!PILOT_TASK_IDS.includes(t.id) || ids.has(t.id) || typeof t.task !== 'string' || !t.fixture || !t.grader || !t.allowedTarget || !t.expectedFailure) throw new Error(`malformed pilot task ${t.id}`);
    if (!t.grader.startsWith('dataset/evaluator/graders/')) throw new Error(`grader for ${t.id} is not evaluator-owned`);
    if (!/^src\/[^/]+\.(mjs|js)$/.test(t.allowedTarget)) throw new Error(`invalid allowedTarget for ${t.id}`);
    ids.add(t.id);
  }
  if (ids.size !== PILOT_TASK_IDS.length) throw new Error('pilot tasks must contain the exact task ID set');
  return PILOT_TASK_IDS.map(id => d.tasks.find(t => t.id === id));
}
export async function validatePublicFixtures() {
  for (const task of loadDataset()) for (const file of await walk(path.resolve(root, task.fixture))) {
    const relative = path.relative(path.resolve(root, task.fixture), file);
    if (relative.split(path.sep).some(part => /grader|evaluator/i.test(part))) throw new Error(`public fixture contains evaluator path: ${task.id}`);
    const text = await fs.readFile(file, 'utf8');
    if (forbidden.some(marker => text.toLowerCase().includes(marker))) throw new Error(`public fixture contains hidden marker: ${task.id}`);
  }
  return true;
}
function prng(seed) { let x = Number.isFinite(Number(seed)) ? Number(seed) >>> 0 : 1; return () => (x = Math.imul(1664525, x) + 1013904223 >>> 0) / 2 ** 32; }
export function seededShuffle(items, seed) { const a = [...items], random = prng(seed); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function pilotPlan(seed = 1) {
  const protocol = validateRegistry().protocols.find(p => p.id === PILOT_PROTOCOL);
  return seededShuffle(loadDataset().flatMap(task => PILOT_ARMS.map(arm => ({ taskId: task.id, protocolId: protocol.id, arm, trial: 1, seed: Number(seed) }))), seed);
}
function runCommand(executable, argv, cwd, timeoutMs = 30000) {
  return new Promise(resolve => {
    let stdout = '', stderr = '', timedOut = false, done = false;
    const child = spawn(executable, argv, { cwd, shell: false, env: process.env });
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, timeoutMs);
    const finish = result => { if (done) return; done = true; clearTimeout(timer); resolve({ ...result, stdout, stderr, timedOut }); };
    child.stdout.on('data', b => { stdout += b; }); child.stderr.on('data', b => { stderr += b; });
    child.on('error', e => finish({ error: e.message })); child.on('close', (code, signal) => finish({ code, signal }));
  });
}
async function git(cwd, argv) { return runCommand('git', argv, cwd); }
async function grader(task, workspace) {
  const result = await runCommand(process.execPath, [path.resolve(root, task.grader), workspace], root);
  return { ...result, assertionFailure: /AssertionError/.test(`${result.stdout}\n${result.stderr}`), pass: result.code === 0 };
}
async function copyVisibleFixture(task, workspace) {
  const source = path.resolve(root, task.fixture); await fs.cp(source, workspace, { recursive: true, errorOnExist: true });
  if (existsSync(path.join(workspace, 'evaluator')) || existsSync(path.join(workspace, 'grader.mjs'))) throw new Error('fixture contains forbidden evaluator material');
}
async function changedFiles(workspace) {
  const diff = await git(workspace, ['diff', '--name-only', 'HEAD']), status = await git(workspace, ['status', '--short', '--untracked-files=all']);
  const names = new Set(diff.stdout.split('\n').filter(Boolean));
  for (const line of status.stdout.split('\n').filter(Boolean)) names.add(line.slice(3).replace(/ -> .*/, '').trim());
  return [...names].sort();
}
export async function runPilotCell(cell, { out, adapter, timeoutMs = 120000 } = {}) {
  const task = loadDataset().find(t => t.id === cell.taskId);
  if (!task || cell.protocolId !== PILOT_PROTOCOL || !PILOT_ARMS.includes(cell.arm) || cell.trial !== 1) throw new Error('invalid pilot cell');
  const protocol = validateRegistry().protocols.find(p => p.id === PILOT_PROTOCOL), dir = path.join(path.resolve(out), `${cell.taskId}-${cell.arm}`), workspace = path.join(dir, 'candidate');
  await fs.mkdir(dir, { recursive: true }); await copyVisibleFixture(task, workspace);
  const init = await git(workspace, ['init', '-q']); if (init.code !== 0) throw new Error(`git init failed: ${init.stderr}`);
  await git(workspace, ['config', 'user.email', 'pilot@example.invalid']); await git(workspace, ['config', 'user.name', 'Pilot']); await git(workspace, ['add', '.']); await git(workspace, ['commit', '-qm', 'baseline']);
  const baseline = await grader(task, workspace); if (baseline.pass || !baseline.assertionFailure) throw new Error(`baseline for ${task.id} did not fail via AssertionError`);
  const prompt = buildPrompt(task, protocol, cell.arm), promptFile = path.join(dir, 'prompt.txt'); await fs.writeFile(promptFile, prompt);
  if (forbidden.some(x => prompt.toLowerCase().includes(x))) throw new Error('candidate prompt contains forbidden evaluator material');
  const execution = await executeAdapter(adapter, { repoRoot: workspace, candidateRoot: workspace, runDir: dir, promptFile, taskId: task.id, protocolId: cell.protocolId, arm: cell.arm, trial: '1' }, { timeoutMs });
  const final = await grader(task, workspace), files = await changedFiles(workspace), diff = await git(workspace, ['diff', '--binary', 'HEAD']);
  const infrastructureInvalid = Boolean(execution.infrastructureError || execution.timedOut || final.error || (final.code !== 0 && !final.assertionFailure));
  const unrelatedEdits = files.filter(file => file !== task.allowedTarget), success = final.pass && !infrastructureInvalid && files.length === 1 && files[0] === task.allowedTarget;
  const metrics = { ...cell, allowedTarget: task.allowedTarget, baselineFailure: { code: baseline.code, assertionFailure: baseline.assertionFailure, expected: task.expectedFailure }, outcome: infrastructureInvalid ? 'infrastructure-invalid' : success ? 'success' : 'task-failure', infrastructureInvalid, success, modelProvenance: execution.provenance ?? null, tokens: execution.tokenUsage ?? null, latencyMs: execution.durationMs ?? null, changedFiles: files, unrelatedEdits, diffBytes: Buffer.byteLength(diff.stdout), sanitized: true };
  await fs.writeFile(path.join(dir, 'metrics.json'), JSON.stringify(metrics, null, 2)); await fs.writeFile(path.join(dir, 'diff.patch'), diff.stdout); await fs.writeFile(path.join(dir, 'baseline-grader.txt'), `${baseline.stdout}${baseline.stderr}`); await fs.writeFile(path.join(dir, 'final-grader.txt'), `${final.stdout}${final.stderr}`);
  return metrics;
}
async function fileHash(file) { return sha256(await fs.readFile(file)); }
export async function freezeInputs(out = path.join(root, 'pilot-freeze.json')) {
  await validatePublicFixtures(); const tasks = loadDataset(), files = [];
  for (const t of tasks) { for (const file of await walk(path.resolve(root, t.fixture))) files.push(path.relative(root, file)); files.push(t.grader); }
  files.push('dataset/tasks.json', 'registry/protocols.json', 'registry/baselines.json', ...pilotScriptFiles);
  const entries = []; for (const file of [...new Set(files)].sort()) entries.push({ file, sha256: await fileHash(path.resolve(root, file)) });
  const manifest = { version: 'pilot-v1', scope: 'task specs, visible fixtures, evaluator-owned hidden graders, protocol registry, pilot protocol scripts', entries, manifestSha256: sha256(entries) }; await fs.writeFile(out, JSON.stringify(manifest, null, 2) + '\n'); return manifest;
}
export async function verifyFrozenManifest(file = path.join(root, 'pilot-freeze.json')) {
  const expected = loadJson(file); if (expected.version !== 'pilot-v1' || !Array.isArray(expected.entries) || expected.manifestSha256 !== sha256(expected.entries)) throw new Error('invalid frozen input manifest');
  const check = path.join(path.dirname(file), `.pilot-freeze-check-${process.pid}.json`); const actual = await freezeInputs(check); await fs.rm(check, { force: true }); if (sha256(expected.entries) !== sha256(actual.entries)) throw new Error('frozen input manifest mismatch'); return true;
}
export async function runPilot({ seed = 1, out = path.join(root, 'pilot-out'), adapter = 'config/adapter.example.json', freeze = path.join(root, 'pilot-freeze.json'), timeoutMs = 120000 } = {}) {
  await verifyFrozenManifest(path.resolve(freeze));
  const output = path.resolve(out); if (existsSync(output) && (await fs.readdir(output)).length) throw new Error('pilot output already contains evidence; choose a new empty output directory');
  await fs.mkdir(path.join(output, 'cells'), { recursive: true });
  const config = loadJson(path.resolve(adapter)), cells = pilotPlan(seed), planRecord = { version: 'pilot-v1', seed: Number(seed), cells, planHash: sha256(cells), freeze: path.resolve(freeze) };
  await fs.writeFile(path.join(output, 'plan.json'), JSON.stringify(planRecord, null, 2)); const metrics = [];
  for (let i = 0; i < cells.length; i++) metrics.push(await runPilotCell(cells[i], { out: path.join(output, 'cells', String(i + 1).padStart(2, '0')), adapter: config, timeoutMs }));
  await writePilotSummary(output, metrics, await summarizePilot(output, false)); return { ...planRecord, metrics };
}
const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
async function collectMetrics(dir) {
  if (!existsSync(dir)) return [];
  const entries = [];
  for (const item of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) entries.push(...await collectMetrics(file));
    else if (item.isFile() && item.name === 'metrics.json') { try { entries.push(JSON.parse(await fs.readFile(file, 'utf8'))); } catch {} }
  }
  return entries;
}
export async function summarizePilot(out, write = true) {
  const entries = await collectMetrics(path.join(out, 'cells'));
  const arms = Object.fromEntries(PILOT_ARMS.map(arm => { const xs = entries.filter(x => x.arm === arm), good = xs.filter(x => x.success); return [arm, { cells: xs.length, successes: good.length, successRate: xs.length ? good.length / xs.length : null, meanTokens: mean(xs.map(x => x.tokens?.totalTokens).filter(Number.isFinite)), meanLatencyMs: mean(xs.map(x => x.latencyMs).filter(Number.isFinite)), meanDiffBytes: mean(xs.map(x => x.diffBytes).filter(Number.isFinite)), invalidCells: xs.filter(x => x.infrastructureInvalid).length }]; }));
  const result = { version: 'pilot-v1', cells: entries.length, arms, semantics: 'Preliminary descriptive results only: one trial per task/arm; no causal or universal conclusion is supported.' }; if (write) await writePilotSummary(out, entries, result); return result;
}
async function writePilotSummary(out, entries, result) { await fs.writeFile(path.join(out, 'summary.json'), JSON.stringify(result, null, 2) + '\n'); const lines = ['# Pilot V1 summary', '', 'Preliminary descriptive results only; this one-trial pilot supports no causal or universal conclusion.', '', `Cells recorded: ${entries.length}`, '', '| Arm | Cells | Successes | Success rate | Infrastructure-invalid |', '|---|---:|---:|---:|---:|']; for (const arm of PILOT_ARMS) { const x = result.arms[arm]; lines.push(`| ${arm} | ${x.cells} | ${x.successes} | ${x.successRate === null ? 'n/a' : `${(x.successRate * 100).toFixed(1)}%`} | ${x.invalidCells} |`); } await fs.writeFile(path.join(out, 'summary.md'), lines.join('\n') + '\n'); }
function cliArgs(argv) { const o = {}; for (let i = 2; i < argv.length; i++) { const x = argv[i]; if (x.startsWith('--')) o[x.slice(2)] = argv[++i] ?? true; } return o; }
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) { const a = cliArgs(process.argv), fail = e => { console.error(`ERROR: ${e.message}`); process.exitCode = 1; }; if (a.run) runPilot({ seed: Number(a.seed ?? 1), out: a.run, adapter: a.adapter ?? 'config/adapter.example.json', freeze: a.freeze ?? path.join(root, 'pilot-freeze.json') }).then(() => console.log('pilot run complete')).catch(fail); else if (a.freeze) freezeInputs(path.resolve(a.freeze)).then(x => console.log(JSON.stringify(x, null, 2))).catch(fail); else if (a.verify) verifyFrozenManifest(path.resolve(a.verify)).then(() => console.log('frozen manifest verified')).catch(fail); else if (a.plan) { const seed = Number(a.seed ?? 1), p = { version: 'pilot-v1', seed, cells: pilotPlan(seed) }; fs.mkdir(path.resolve(a.plan), { recursive: true }).then(() => fs.writeFile(path.join(path.resolve(a.plan), 'plan.json'), JSON.stringify({ ...p, planHash: sha256(p.cells) }, null, 2))).then(() => console.log(JSON.stringify(p, null, 2))).catch(fail); } else if (a.summary) summarizePilot(path.resolve(a.summary)).then(x => console.log(JSON.stringify(x, null, 2))).catch(fail); }
