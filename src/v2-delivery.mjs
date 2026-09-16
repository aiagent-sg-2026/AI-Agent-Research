import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { loadJson, root } from './registry.mjs';
import { sha256 } from './hash.mjs';
import { executeAdapter } from './execute.mjs';
import { loadDataset, validatePublicFixtures, seededShuffle } from './pilot.mjs';

export const V2_PROTOCOL = 'AQB-V2-DM-001';
export const V2_ARMS = ['A0', 'A1', 'A2', 'A3'];
export const V2_TRIALS = 3;
export const V2_INSTRUCTION = 'Inspect the existing implementation, reason from the task contract, use available tools when useful, make the smallest correct change within scope, run relevant visible tests, and report what you verified.';
export const V2_SKILL_PATH = '.agent-skills/aqb-delivery/SKILL.md';
const forbidden = ['hidden grader', 'answer key', 'expected patch', 'competitor output', 'prior trial outcome', 'dataset/evaluator', 'evaluator/graders'];
const harnessFiles = ['src/v2-delivery.mjs', 'src/execute.mjs', 'src/codex-luna-adapter.mjs', 'src/hash.mjs', 'src/pilot.mjs'];

const walk = async dir => { const out = []; for (const entry of (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) { const file = path.join(dir, entry.name); if (entry.isDirectory()) out.push(...await walk(file)); else out.push(file); } return out; };
const fileHash = file => fs.readFile(file).then(sha256);
const canonicalTask = task => JSON.stringify({ id: task.id, task: task.task, allowedTarget: task.allowedTarget, fixture: task.fixture });

export function armPrompt(task, arm) {
  if (!V2_ARMS.includes(arm)) throw new Error(`unknown V2 arm ${arm}`);
  const scope = `\n\nVisible scope: edit only ${task.allowedTarget}. Do not edit tests, package metadata, evaluator files, or unrelated files.`;
  if (arm === 'A0') return `${task.task}${scope}`;
  if (arm === 'A1') return `${task.task}${scope}\n\nEngineering instruction:\n${V2_INSTRUCTION}`;
  if (arm === 'A2') return `${task.task}${scope}`;
  return `${task.task}${scope}\n\nHarness skill invocation: read and apply ${V2_SKILL_PATH} before editing; this is the candidate-visible Agent Skill delivery channel.`;
}

export function v2Plan(seed = 20260917) {
  const tasks = loadDataset();
  const cells = tasks.flatMap(task => V2_ARMS.flatMap(arm => Array.from({ length: V2_TRIALS }, (_, i) => ({ version: V2_PROTOCOL, taskId: task.id, arm, trial: i + 1, seed: Number(seed) }))));
  return seededShuffle(cells, Number(seed)).map((cell, index) => ({ ...cell, ordinal: index + 1, cellId: `${String(index + 1).padStart(3, '0')}-${cell.taskId}-${cell.arm}-trial-${cell.trial}` }));
}

export function validateV2Plan(cells) {
  if (!Array.isArray(cells) || cells.length !== 60) throw new Error('V2 delivery plan must contain exactly 60 cells');
  const keys = cells.map(c => `${c.taskId}|${c.arm}|${c.trial}`);
  if (new Set(keys).size !== 60 || new Set(cells.map(c => c.cellId)).size !== 60) throw new Error('V2 delivery plan contains duplicate cells');
  if (cells.some(c => !c.taskId || !V2_ARMS.includes(c.arm) || !Number.isInteger(c.trial) || c.trial < 1 || c.trial > 3)) throw new Error('V2 delivery plan contains invalid cell');
  return true;
}
const validateCell = cell => { if (!cell || !cell.taskId || !V2_ARMS.includes(cell.arm) || !Number.isInteger(cell.trial) || cell.trial < 1 || cell.trial > V2_TRIALS || typeof cell.cellId !== 'string') throw new Error('invalid V2 cell'); };

export function deliveryContract() {
  return { version: V2_PROTOCOL, arms: V2_ARMS.map(id => ({ id, channel: id === 'A0' ? 'plain task prompt' : id === 'A1' ? 'user prompt' : id === 'A2' ? 'candidate AGENTS.md' : 'candidate-visible skill plus explicit invocation directive', instructionHash: sha256(V2_INSTRUCTION), semantics: id === 'A0' ? null : sha256(V2_INSTRUCTION) })), asymmetry: 'A3 requires a short prompt directive because the pinned Codex adapter has no native custom-skill invocation API; the substantive instruction is delivered only by the candidate-visible skill. A2 enables candidate AGENTS.md loading in the V2 Codex invocation; A0/A1/A3 retain --ignore-rules.' };
}

async function copyFixture(task, workspace) {
  await fs.cp(path.resolve(root, task.fixture), workspace, { recursive: true, errorOnExist: true });
  const names = await walk(workspace);
  if (names.some(file => /grader|evaluator/i.test(path.relative(workspace, file)))) throw new Error('candidate fixture contains evaluator material');
}
async function command(executable, args, cwd) { return new Promise(resolve => { const child = spawn(executable, args, { cwd, shell: false }); let stdout = '', stderr = ''; child.stdout.on('data', b => stdout += b); child.stderr.on('data', b => stderr += b); child.on('error', error => resolve({ code: null, error: error.message, stdout, stderr })); child.on('close', code => resolve({ code, stdout, stderr })); }); }
async function changedFiles(workspace) { const result = await command('git', ['status', '--short', '--untracked-files=all'], workspace); return result.stdout.split('\n').filter(Boolean).map(line => line.slice(3).replace(/ -> .*/, '').trim()).sort(); }

async function writeDelivery(workspace, arm) {
  if (arm === 'A2') await fs.writeFile(path.join(workspace, 'AGENTS.md'), `${V2_INSTRUCTION}\n`);
  if (arm === 'A3') { const file = path.join(workspace, V2_SKILL_PATH); await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, `# AQB delivery skill\n\n${V2_INSTRUCTION}\n`); }
}

export async function freezeV2(out = path.join(root, 'v2-delivery-freeze.json')) {
  await validatePublicFixtures();
  const tasks = loadDataset(), files = ['dataset/tasks.json', 'registry/benchmark-v2.json', 'src/v2-delivery.mjs', ...harnessFiles];
  for (const task of tasks) { files.push(task.grader); for (const file of await walk(path.resolve(root, task.fixture))) files.push(path.relative(root, file)); }
  files.push('config/adapter.codex-luna.vm.json');
  const entries = []; for (const file of [...new Set(files)].sort()) entries.push({ file, sha256: await fileHash(path.resolve(root, file)) });
  const manifest = { version: V2_PROTOCOL, taskIds: tasks.map(t => t.id), trials: V2_TRIALS, arms: V2_ARMS, taskHashes: Object.fromEntries(tasks.map(t => [t.id, sha256(canonicalTask(t))])), evaluatorHashes: Object.fromEntries(await Promise.all(tasks.map(async t => [t.id, await fileHash(path.resolve(root, t.grader))]))), instructionHash: sha256(V2_INSTRUCTION), contract: deliveryContract(), entries, manifestSha256: sha256(entries) };
  await fs.writeFile(out, JSON.stringify(manifest, null, 2) + '\n'); return manifest;
}

export async function verifyV2Freeze(file = path.join(root, 'v2-delivery-freeze.json')) {
  const expected = loadJson(file); if (expected.version !== V2_PROTOCOL || expected.instructionHash !== sha256(V2_INSTRUCTION) || JSON.stringify(expected.contract) !== JSON.stringify(deliveryContract()) || expected.manifestSha256 !== sha256(expected.entries)) throw new Error('invalid V2 freeze manifest');
  const temp = path.join(path.dirname(file), `.v2-freeze-check-${process.pid}.json`); const actual = await freezeV2(temp); await fs.rm(temp, { force: true });
  if (sha256(expected.entries) !== sha256(actual.entries) || JSON.stringify(expected.taskHashes) !== JSON.stringify(actual.taskHashes) || JSON.stringify(expected.evaluatorHashes) !== JSON.stringify(actual.evaluatorHashes)) throw new Error('V2 frozen input mismatch'); return true;
}

export async function runV2Cell(cell, { out, adapter, timeoutMs = 120000 } = {}) {
  validateCell(cell); const task = loadDataset().find(t => t.id === cell.taskId); if (!task) throw new Error('unknown V2 task');
  const dir = path.join(path.resolve(out), `cells/${cell.cellId}`), workspace = path.join(dir, 'candidate'); await fs.mkdir(dir, { recursive: true }); await copyFixture(task, workspace); await writeDelivery(workspace, cell.arm);
  const init = await command('git', ['init', '-q'], workspace); if (init.code !== 0) throw new Error('candidate git init failed'); await command('git', ['config', 'user.email', 'aqb@example.invalid'], workspace); await command('git', ['config', 'user.name', 'AQB'], workspace); await command('git', ['add', '.'], workspace); await command('git', ['commit', '-qm', 'baseline'], workspace);
  const baselineGrader = await command(process.execPath, [path.resolve(root, task.grader), workspace], root); if (baselineGrader.code === 0 || !/AssertionError/.test(`${baselineGrader.stdout}\n${baselineGrader.stderr}`)) throw new Error(`V2 baseline for ${task.id} did not fail via AssertionError`);
  const prompt = armPrompt(task, cell.arm), promptFile = path.join(dir, 'prompt.txt'); await fs.writeFile(promptFile, prompt); if (forbidden.some(x => prompt.toLowerCase().includes(x))) throw new Error('candidate prompt contains forbidden evaluator material');
  const execution = await executeAdapter({ ...adapter, ...(adapter?.type === 'codex-luna' ? { useCandidateRules: cell.arm === 'A2' } : {}) }, { repoRoot: workspace, candidateRoot: workspace, runDir: dir, promptFile, taskId: task.id, protocolId: V2_PROTOCOL, arm: cell.arm, trial: String(cell.trial) }, { timeoutMs });
  const visible = await command('npm', ['test'], workspace), finalGrader = await command(process.execPath, [path.resolve(root, task.grader), workspace], root), files = await changedFiles(workspace), diff = await command('git', ['diff', '--binary', 'HEAD'], workspace);
  const contamination = files.some(f => /grader|evaluator/i.test(f)) || forbidden.some(x => prompt.toLowerCase().includes(x)); const infrastructureInvalid = Boolean(execution.infrastructureError || execution.timedOut || visible.error || finalGrader.error || contamination); const success = !infrastructureInvalid && visible.code === 0 && finalGrader.code === 0 && files.length === 1 && files[0] === task.allowedTarget;
  const failureClass = success ? null : infrastructureInvalid ? (contamination ? 'CONTAMINATION' : 'INFRASTRUCTURE_INVALID') : files.length > 0 && (files.length !== 1 || files[0] !== task.allowedTarget) ? 'SCOPE_VIOLATION' : visible.code !== 0 ? 'REGRESSION' : 'TASK_LOGIC';
  const metrics = { ...cell, taskHash: sha256(canonicalTask(task)), instructionHash: sha256(V2_INSTRUCTION), armSemanticsHash: cell.arm === 'A0' ? null : sha256(V2_INSTRUCTION), delivery: cell.arm, outcome: success ? 'success' : infrastructureInvalid ? 'infrastructure-invalid' : 'task-failure', success, infrastructureInvalid, failureClass, acceptance: { pass: finalGrader.code === 0, baselineFailed: true }, visibleTests: { code: visible.code, passed: visible.code === 0 }, scope: { allowedTarget: task.allowedTarget, changedFiles: files, compliant: files.length === 1 && files[0] === task.allowedTarget }, regressionFree: visible.code === 0, recovery: { attempts: 1, recovered: false }, modelProvenance: execution.provenance ?? null, tokens: execution.tokenUsage ?? null, latencyMs: execution.durationMs ?? null, toolCalls: null, retries: 0, diffBytes: Buffer.byteLength(diff.stdout), sanitized: true };
  await fs.writeFile(path.join(dir, 'metrics.json'), JSON.stringify(metrics, null, 2) + '\n'); await fs.writeFile(path.join(dir, 'diff.patch'), diff.stdout); await fs.writeFile(path.join(dir, 'visible-tests.txt'), `${visible.stdout}${visible.stderr}`); return metrics;
}

const validateMetric = metric => { for (const key of ['cellId', 'taskId', 'arm', 'trial', 'outcome', 'success', 'infrastructureInvalid', 'failureClass', 'visibleTests', 'scope', 'regressionFree', 'recovery', 'sanitized']) if (!(key in metric)) throw new Error(`invalid V2 evidence: missing ${key}`); if (!V2_ARMS.includes(metric.arm) || !Number.isInteger(metric.trial) || metric.trial < 1 || metric.trial > V2_TRIALS || typeof metric.success !== 'boolean' || typeof metric.infrastructureInvalid !== 'boolean' || metric.sanitized !== true) throw new Error('invalid V2 evidence'); return metric; };
async function collect(dir) { if (!existsSync(dir)) return []; const out = []; for (const e of await fs.readdir(dir, { withFileTypes: true })) { const f = path.join(dir, e.name); if (e.isDirectory()) out.push(...await collect(f)); else if (e.name === 'metrics.json') out.push(validateMetric(JSON.parse(await fs.readFile(f, 'utf8')))); } return out; }
export async function summarizeV2(out, write = true) { const entries = await collect(path.join(out, 'cells')); const arms = Object.fromEntries(V2_ARMS.map(arm => { const xs = entries.filter(x => x.arm === arm); const good = xs.filter(x => x.success); const avg = selector => { const ys = xs.map(selector).filter(Number.isFinite); return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : null; }; return [arm, { cells: xs.length, trials: new Set(xs.map(x => x.trial)).size, successes: good.length, successRate: xs.length ? good.length / xs.length : null, visibleTestRate: xs.length ? xs.filter(x => x.visibleTests?.passed).length / xs.length : null, meanTokens: avg(x => x.tokens?.totalTokens), meanLatencyMs: avg(x => x.latencyMs), meanDiffBytes: avg(x => x.diffBytes), meanToolCalls: avg(x => x.toolCalls), meanRetries: avg(x => x.retries), recoveryRate: xs.length ? xs.filter(x => x.recovery?.recovered).length / xs.length : null, failureClasses: Object.fromEntries([...new Set(xs.map(x => x.failureClass).filter(Boolean))].map(k => [k, xs.filter(x => x.failureClass === k).length])) }]; })); const result = { version: V2_PROTOCOL, cells: entries.length, arms, semantics: 'Three trials per task/arm; descriptive paired-block evidence only until the registered V2 confirmation design.', reliability: { completeCellCount: entries.length, expectedCellCount: 60, uniqueCellCount: new Set(entries.map(x => x.cellId)).size, trialCoverage: Object.fromEntries(V2_ARMS.map(arm => [arm, Object.fromEntries([...new Set(entries.filter(x => x.arm === arm).map(x => x.taskId))].sort().map(task => [task, entries.filter(x => x.arm === arm && x.taskId === task).length]))])) } }; if (write) await fs.writeFile(path.join(out, 'summary.json'), JSON.stringify(result, null, 2) + '\n'); return result; }

const cliArgs = argv => { const o = {}; for (let i = 2; i < argv.length; i++) if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[++i] ?? true; return o; };
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) { const a = cliArgs(process.argv), fail = e => { console.error(`ERROR: ${e.message}`); process.exitCode = 1; }; if (a.freeze) freezeV2(path.resolve(a.freeze)).then(x => console.log(JSON.stringify(x, null, 2))).catch(fail); else if (a.verify) verifyV2Freeze(path.resolve(a.verify)).then(() => console.log('V2 freeze verified')).catch(fail); else if (a.plan) { const cells = v2Plan(Number(a.seed ?? 20260917)); validateV2Plan(cells); fs.mkdir(path.resolve(a.plan), { recursive: true }).then(() => fs.writeFile(path.join(path.resolve(a.plan), 'plan.json'), JSON.stringify({ version: V2_PROTOCOL, seed: Number(a.seed ?? 20260917), cells, planHash: sha256(cells) }, null, 2) + '\n')).then(() => console.log(JSON.stringify({ version: V2_PROTOCOL, cells: cells.length }, null, 2))).catch(fail); } else if (a.run) { const out = path.resolve(a.run); verifyV2Freeze(path.resolve(a.freeze ?? 'v2-delivery-freeze.json')).then(async () => { if (existsSync(out) && (await fs.readdir(out)).length) throw new Error('V2 output already contains evidence; choose a new empty output directory'); await fs.mkdir(path.join(out, 'cells'), { recursive: true }); const cells = v2Plan(Number(a.seed ?? 20260917)); await fs.writeFile(path.join(out, 'plan.json'), JSON.stringify({ version: V2_PROTOCOL, seed: Number(a.seed ?? 20260917), cells, planHash: sha256(cells) }, null, 2)); const adapter = loadJson(path.resolve(a.adapter ?? 'config/adapter.codex-luna.vm.json')); for (const cell of cells) await runV2Cell(cell, { out, adapter }); }).then(() => console.log('V2 delivery run complete')).catch(fail); } else if (a.summary) summarizeV2(path.resolve(a.summary)).then(x => console.log(JSON.stringify(x, null, 2))).catch(fail); }
