import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { runCodexLunaAdapter } from './codex-luna-adapter.mjs';
const substitute = (s, vars) => s.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (_, k) => vars[k] ?? `{${k}}`);
export async function executeAdapter(config, vars, { timeoutMs = 30000, maxOutputBytes = 1000000 } = {}) {
  if (config?.type === 'codex-luna') return runCodexLunaAdapter(config, vars, { timeoutMs, maxOutputBytes });
  const executable = config.executable, argv = (config.argv ?? []).map(x => substitute(x, vars));
  if (!executable || !Array.isArray(config.argv)) return { infrastructureError: 'adapter requires executable and argv array' };
  const started = Date.now();
  return await new Promise(resolve => {
    let out = '', err = '', timedOut = false, settled = false;
    const child = spawn(executable, argv, { shell: false, cwd: vars.runDir, env: { ...process.env, AI_AGENT_PROMPT_FILE: vars.promptFile, AI_AGENT_RUN_DIR: vars.runDir } });
    const finish = result => { if (settled) return; settled = true; clearTimeout(timer); resolve({ ...result, stdout: out, stderr: err, durationMs: Date.now() - started }); };
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); setTimeout(() => child.kill('SIGKILL'), 250); }, timeoutMs);
    child.stdout.on('data', b => { out += b; if (Buffer.byteLength(out) > maxOutputBytes) { child.kill('SIGTERM'); err += '\noutput limit exceeded'; } });
    child.stderr.on('data', b => { err += b; if (Buffer.byteLength(err) > maxOutputBytes) { child.kill('SIGTERM'); err = err.slice(0, maxOutputBytes) + '\nstderr limit exceeded'; } });
    child.on('error', e => finish({ infrastructureError: e.message }));
    child.on('close', (code, signal) => finish({ exitCode: code, signal, timedOut, classification: timedOut ? 'infrastructure-error' : code === 0 ? 'valid-agent-result' : 'agent-failure' }));
  });
}
export async function writeCapture(dir, result) { await fs.writeFile(path.join(dir, 'execution.json'), JSON.stringify(result, null, 2)); }
