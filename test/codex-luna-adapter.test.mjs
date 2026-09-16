import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseSessionMetadata, locateSession, threadIdFromEvents, validateCodexLunaConfig, buildCodexExecArgs } from '../src/codex-luna-adapter.mjs';

const good = (overrides = {}) => ({
  session_id: 'thread-good', id: 'thread-good', cli_version: '0.153.4', model_provider: 'openai',
  ...overrides
});
async function fixture(meta = {}, turn = {}) {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-luna-'));
  const dir = path.join(home, 'sessions', '2026', '09', '16'); await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, 'rollout-thread-good.jsonl');
  await fs.writeFile(file, [
    JSON.stringify({ type: 'session_meta', payload: good(meta) }),
    JSON.stringify({ type: 'turn_context', payload: { effort: 'medium', collaboration_mode: { settings: { model: 'gpt-5.6-luna', reasoning_effort: 'medium' } }, ...turn } }),
    JSON.stringify({ type: 'response_item', payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'PRIVATE PROMPT' }] } })
  ].join('\n'));
  return { home, file };
}
test('Codex provenance parser reads only required metadata and verifies a good session', async () => {
  const { home, file } = await fixture();
  assert.deepEqual(await parseSessionMetadata(file, 'thread-good'), { threadId: 'thread-good', model: 'gpt-5.6-luna', effort: 'medium', modelProvider: 'openai', cliVersion: '0.153.4' });
  assert.equal(await locateSession(home, 'thread-good'), file);
});
for (const [name, meta, turn] of [
  ['model mismatch', {}, { collaboration_mode: { settings: { model: 'other-model', reasoning_effort: 'medium' } } }],
  ['effort mismatch', {}, { effort: 'high' }],
  ['version mismatch', { cli_version: '0.153.3' }, {}],
  ['missing metadata', { model_provider: undefined }, {}]
]) test(`fails closed for ${name}`, async () => {
  const { file } = await fixture(meta, turn);
  await assert.rejects(() => parseSessionMetadata(file, 'thread-good'), /provenance mismatch/);
});
test('thread id must come from a JSON event', () => {
  assert.equal(threadIdFromEvents('{"type":"thread.started","thread_id":"thread-good"}'), 'thread-good');
  assert.throws(() => threadIdFromEvents('{"type":"turn.started"}'), /thread id/);
});

test('VM adapter config pins absolute executable, Luna, medium effort, and CLI version', async () => {
  const config=JSON.parse(await fs.readFile('config/adapter.codex-luna.vm.json','utf8'));
  assert.equal(path.isAbsolute(config.executable), true);
  assert.equal(config.model, 'gpt-5.6-luna');
  assert.equal(config.reasoningEffort, 'medium');
  assert.equal(config.cliVersion, '0.153.4');
  assert.equal(validateCodexLunaConfig(config), config);
  for (const bad of [
    {...config, model:'gpt-5.6-sol'},
    {...config, reasoningEffort:'high'},
    {...config, cliVersion:'0.153.3'},
    {...config, executable:'codex'}
  ]) assert.throws(() => validateCodexLunaConfig(bad));
});

test('Codex invocation contract ignores user config and explicitly pins Luna medium', async () => {
  const config=JSON.parse(await fs.readFile('config/adapter.codex-luna.vm.json','utf8'));
  const args=buildCodexExecArgs(config, '/benchmark/repo');
  assert.deepEqual(args, [
    'exec','--json','--ignore-user-config','--ignore-rules','--sandbox','workspace-write','--model','gpt-5.6-luna','-c','model_reasoning_effort="medium"','-C','/benchmark/repo','-'
  ]);
});
