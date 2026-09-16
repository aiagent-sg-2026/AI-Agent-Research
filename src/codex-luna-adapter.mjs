import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import readline from 'node:readline';

export const CODEX_MODEL = 'gpt-5.6-luna';
export const CODEX_EFFORT = 'medium';
export const CODEX_PROVIDER = 'openai';
export const CODEX_VERSION = '0.153.4';

export function validateCodexLunaConfig(config) {
  if (!config || config.type !== 'codex-luna') throw new Error('Codex Luna adapter config type must be codex-luna');
  if (config.model !== CODEX_MODEL) throw new Error(`Codex Luna adapter config model must be ${CODEX_MODEL}`);
  if (config.reasoningEffort !== CODEX_EFFORT) throw new Error(`Codex Luna adapter config reasoningEffort must be ${CODEX_EFFORT}`);
  if (config.cliVersion !== CODEX_VERSION) throw new Error(`Codex Luna adapter config cliVersion must be ${CODEX_VERSION}`);
  if (typeof config.executable !== 'string' || !path.isAbsolute(config.executable)) throw new Error('Codex Luna adapter executable must be an absolute path');
  return config;
}

export function buildCodexExecArgs(config, repoRoot) {
  validateCodexLunaConfig(config);
  return ['exec', '--json', '--ignore-user-config', '--model', config.model, '-c', `model_reasoning_effort="${config.reasoningEffort}"`, '-C', repoRoot, '-'];
}

const jsonLines = text => text.split(/\r?\n/).filter(Boolean).flatMap(line => {
  try { return [JSON.parse(line)]; } catch { return []; }
});

export function threadIdFromEvents(stdout) {
  for (const event of jsonLines(stdout)) {
    if (event?.type === 'thread.started' && typeof event.thread_id === 'string' && event.thread_id) return event.thread_id;
  }
  throw new Error('Codex JSON events did not contain a thread id');
}

async function findSession(dir, threadId) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return null; }
  for (const entry of entries) {
    const candidate = path.join(dir, entry.name);
    if (entry.isDirectory()) { const found = await findSession(candidate, threadId); if (found) return found; }
    else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
      const input = readline.createInterface({ input: createReadStream(candidate), crlfDelay: Infinity });
      let first;
      for await (const line of input) { first = line; break; }
      input.close();
      try { const event = JSON.parse(first); if (event?.type === 'session_meta' && (event.payload?.session_id === threadId || event.payload?.id === threadId)) return candidate; } catch { /* not a session metadata record */ }
    }
  }
  return null;
}

export async function locateSession(codexHome, threadId) {
  if (!codexHome || !threadId) throw new Error('CODEX_HOME and thread id are required');
  const found = await findSession(path.join(codexHome, 'sessions'), threadId);
  if (!found) throw new Error(`Codex session ${threadId} was not found under CODEX_HOME sessions`);
  return found;
}

export async function parseSessionMetadata(file, threadId) {
  let sessionId, cliVersion, provider, model, effort;
  const input = readline.createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  try {
    for await (const line of input) {
      if (!line) continue;
      let event; try { event = JSON.parse(line); } catch { continue; }
      if (event?.type === 'session_meta') {
        const p = event.payload ?? {};
        sessionId = p.session_id ?? p.id;
        cliVersion = p.cli_version;
        provider = p.model_provider;
      } else if (event?.type === 'turn_context') {
        const p = event.payload ?? {};
        model = p.model ?? p.collaboration_mode?.settings?.model;
        effort = p.effort ?? p.reasoning_effort ?? p.collaboration_mode?.settings?.reasoning_effort;
      }
      if (sessionId && cliVersion && provider && model && effort) break;
    }
  } finally { input.close(); }
  const provenance = { threadId: sessionId, model, effort, modelProvider: provider, cliVersion };
  if (sessionId !== threadId) throw new Error('Codex session metadata id mismatch');
  for (const [key, expected] of [['model', CODEX_MODEL], ['effort', CODEX_EFFORT], ['modelProvider', CODEX_PROVIDER], ['cliVersion', CODEX_VERSION]]) {
    if (provenance[key] !== expected) throw new Error(`Codex provenance mismatch: ${key}`);
  }
  return provenance;
}

function command(executable, argv, input, { timeoutMs, maxOutputBytes, cwd, env }) {
  return new Promise(resolve => {
    const child = spawn(executable, argv, { shell: false, cwd, env });
    let stdout = '', stderr = '', timedOut = false, settled = false;
    const finish = result => { if (settled) return; settled = true; clearTimeout(timer); resolve({ ...result, stdout, stderr, timedOut }); };
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, timeoutMs);
    child.stdout.on('data', b => { stdout += b; if (Buffer.byteLength(stdout) > maxOutputBytes) child.kill('SIGTERM'); });
    child.stderr.on('data', b => { stderr += b; if (Buffer.byteLength(stderr) > maxOutputBytes) child.kill('SIGTERM'); });
    child.on('error', e => finish({ error: e.message }));
    child.on('close', (code, signal) => finish({ code, signal }));
    child.stdin.end(input);
  });
}

function publicAgentOutput(events) {
  return jsonLines(events).flatMap(event => {
    const item = event?.item;
    if (event?.type !== 'item.completed' || item?.type !== 'agent_message') return [];
    if (typeof item.text === 'string') return [item.text];
    return Array.isArray(item.content) ? item.content.filter(x => x?.type === 'output_text' && typeof x.text === 'string').map(x => x.text) : [];
  }).join('\n');
}

export async function runCodexLunaAdapter(config, vars, { timeoutMs = 30000, maxOutputBytes = 1000000 } = {}) {
  const started = Date.now();
  let provenance, stdout = '', stderr = '', exitCode = null, signal = null, infrastructureError;
  try { validateCodexLunaConfig(config); } catch (error) { infrastructureError = error.message; }
  const executable = config?.executable;
  const env = { ...process.env, AI_AGENT_PROMPT_FILE: vars.promptFile, AI_AGENT_RUN_DIR: vars.runDir };
  const codexHome = env.CODEX_HOME || (env.HOME ? path.join(env.HOME, '.codex') : null);
  if (!infrastructureError) {
    const version = await command(executable, ['--version'], '', { timeoutMs, maxOutputBytes, cwd: vars.runDir, env });
    if (version.error || version.code !== 0 || version.stdout.trim() !== `codex-cli ${config.cliVersion}`) infrastructureError = `Codex CLI version is not exactly ${config.cliVersion}`;
  }
  if (!infrastructureError) {
    const result = await command(executable, buildCodexExecArgs(config, vars.repoRoot), await fs.readFile(vars.promptFile, 'utf8'), { timeoutMs, maxOutputBytes, cwd: vars.runDir, env });
    const eventOutput = result.stdout;
    ({ stderr, code: exitCode, signal } = result);
    try {
      const threadId = threadIdFromEvents(eventOutput);
      const session = await locateSession(codexHome, threadId);
      const observed = await parseSessionMetadata(session, threadId);
      provenance = {
        verified: true,
        requestedModel: config.model,
        requestedEffort: config.reasoningEffort,
        requestedCliVersion: config.cliVersion,
        ...observed
      };
      stdout = publicAgentOutput(eventOutput);
    } catch (error) { infrastructureError = error.message; }
  }
  if (provenance) await fs.writeFile(path.join(vars.runDir, 'codex-provenance.json'), JSON.stringify(provenance, null, 2));
  const classification = infrastructureError ? 'infrastructure-error' : exitCode === 0 ? 'valid-agent-result' : 'agent-failure';
  return { infrastructureError, exitCode, signal, classification, stdout, stderr, durationMs: Date.now() - started, provenance };
}
