import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { plan, run } from '../src/runner.mjs';
import { loadJson } from '../src/registry.mjs';
import { buildPrompt } from '../src/prompt.mjs';
const task=loadJson('examples/tasks/sample-task.json');
const protocol=loadJson('registry/protocols.json').protocols[0];
test('prompts use only the explicit user-visible task.task field', () => {
  const input={...task,evaluator:'EVALUATOR',answerKey:'ANSWER',expectedPatch:'PATCH',hidden:{secret:'HIDDEN'}};
  for (const arm of ['B0','B1','B2','FULL']) {
    const prompt=buildPrompt(input,protocol,arm);
    assert.equal(prompt.includes('EVALUATOR'),false); assert.equal(prompt.includes('ANSWER'),false);
    assert.equal(prompt.includes('PATCH'),false); assert.equal(prompt.includes('HIDDEN'),false);
    for (const field of ['evaluator', 'answerKey', 'expectedPatch', 'hidden']) assert.equal(prompt.includes(field),false);
    assert.equal(prompt.includes(task.task),true);
  }
});
test('missing, non-string, or blank task.task is rejected', () => {
  for (const invalid of [{...task,task:undefined},{...task,task:42},{...task,task:'  '}, {id:'bad',evaluator:'secret'}]) {
    assert.throws(() => buildPrompt(invalid,protocol,'B0'), /task prompt/);
  }
});
test('runner rejects invalid task.task before adapter loading or spawn', async () => {
  const out=await fs.mkdtemp(path.join(os.tmpdir(),'air-invalid-'));
  const file=path.join(out,'invalid.json'); await fs.writeFile(file,JSON.stringify({id:'invalid',task:' '}));
  await assert.rejects(() => run(['node','runner','--task',file,'--protocols','P01','--arms','B0','--trials','1','--out',out,'--adapter',path.join(out,'missing-adapter.json')]), /task prompt/);
});
test('same seed produces identical plan and dry-run makes no adapter call', async()=>{ const a=await plan(task,{protocols:'P01,P02',arms:'B0,FULL',trials:2,seed:77}); const b=await plan(task,{protocols:'P01,P02',arms:'B0,FULL',trials:2,seed:77}); assert.deepEqual(a,b); const out=await fs.mkdtemp(path.join(os.tmpdir(),'air-dry-')); await run(['node','runner','--task','examples/tasks/sample-task.json','--protocols','P01','--arms','B0','--trials','1','--seed','77','--out',out,'--dry-run']); assert.ok((await fs.stat(path.join(out,'plan.json'))).isFile()); });
test('stub run captures observable execution and manifest', async()=>{ const out=await fs.mkdtemp(path.join(os.tmpdir(),'air-run-')); await run(['node','runner','--task','examples/tasks/sample-task.json','--protocols','P01','--arms','FULL','--trials','1','--seed','4','--out',out,'--adapter','config/adapter.example.json']); const dirs=await fs.readdir(out); const dir=path.join(out,dirs.find(x=>x.includes('P01-FULL'))); const m=JSON.parse(await fs.readFile(path.join(dir,'manifest.json'))); const e=JSON.parse(await fs.readFile(path.join(dir,'execution.json'))); assert.equal(m.execution.classification,'valid-agent-result'); assert.equal(e.exitCode,0); assert.equal(e.stdout.includes('sample-task'),true); assert.match(m.promptHash,/^[a-f0-9]{64}$/); });
