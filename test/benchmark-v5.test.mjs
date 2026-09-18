import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  V5_METHOD,V5_CALIBRATION_ARMS,V5_FORMAL_ARMS,loadV5Manifest,v5Tasks,
  validateV5Registry,validateV5Structure,validateV5Leakage,validateV5ExecutableConsistency,
  v5CalibrationPlan,validateV5CalibrationPlan,scopeCompliantV5,calibrationPrompt,
  selectFormalPairs,freezeV5,verifyV5Freeze
} from '../src/benchmark-v5.mjs';

test('V5 scaffold has exactly 8 distinct sibling pairs and shared delivery semantics',async()=>{
  const m=loadV5Manifest();
  assert.equal(m.pairs.length,8);
  assert.equal(v5Tasks().length,16);
  assert.equal(new Set(v5Tasks().map(x=>x.id)).size,16);
  assert.deepEqual(V5_CALIBRATION_ARMS,['A0','A1']);
  assert.deepEqual(V5_FORMAL_ARMS,['A0','A1','A2','A3']);
  assert.match(V5_METHOD,/verification checklist/);
  assert.equal(await validateV5Structure(),true);
  assert.equal(validateV5Registry().execution.formalAuthorized,false);
});

test('V5 calibration plan is exactly 16 unique A0/A1 calibration cells with no formal sibling',()=>{
  const cells=v5CalibrationPlan(20260919);
  assert.equal(validateV5CalibrationPlan(cells),true);
  assert.equal(cells.length,16);
  assert.equal(new Set(cells.map(x=>x.cellId)).size,16);
  const formal=new Set(loadV5Manifest().pairs.map(x=>x.formal.id));
  assert.equal(cells.some(x=>formal.has(x.taskId)),false);
  assert.deepEqual(cells,v5CalibrationPlan(20260919));
  assert.notDeepEqual(cells,v5CalibrationPlan(20260920));
});

test('V5 prompts isolate calibration treatment and scope uses permitted subsets',()=>{
  const t=loadV5Manifest().pairs[1].calibration;
  assert.doesNotMatch(calibrationPrompt(t,'A0'),/Engineering method/);
  assert.match(calibrationPrompt(t,'A1'),/Engineering method/);
  assert.equal(scopeCompliantV5(t,['src/solution.mjs']),true);
  assert.equal(scopeCompliantV5(t,['src/solution.mjs','src/journal.mjs']),true);
  assert.equal(scopeCompliantV5(t,[]),false);
  assert.equal(scopeCompliantV5(t,['test/public.mjs']),false);
});

test('V5 corpus has no leakage and executable reference/baseline/mutant gates pass',async()=>{
  assert.equal(await validateV5Leakage(),true);
  const r=await validateV5ExecutableConsistency();
  assert.deepEqual(r,{tasks:16,baselines:16,references:16,mutants:48});
});

test('V5 selection policy is deterministic and fails closed',()=>{
  const ids=loadV5Manifest().pairs.map(x=>x.id);
  const tooFew=Object.fromEntries(ids.map((id,i)=>[id,{A0:i<5?'pass':'pass',A1:i<5?'fail':'pass'}]));
  assert.equal(selectFormalPairs(tooFew).status,'stop');
  const enough=Object.fromEntries(ids.map((id,i)=>[id,{A0:i<7?'pass':'pass',A1:i<7?'fail':'pass'}]));
  const s=selectFormalPairs(enough);
  assert.equal(s.status,'selected');
  assert.deepEqual(s.selectedPairIds,ids.slice(0,6));
  assert.equal(s.formalTaskIds.length,6);
  const invalid={...enough,[ids[0]]:{A0:'invalid',A1:'fail'}};
  assert.deepEqual(selectFormalPairs(invalid).selectedPairIds,ids.slice(1,7));
});

test('V5 freeze verifies and malformed identity fails closed',async()=>{
  const d=await fs.mkdtemp(path.join(os.tmpdir(),'aqb-v5-freeze-'));
  const f=path.join(d,'freeze.json');
  const m=await freezeV5(f);
  assert.ok(m.entries.some(x=>x.file==='dataset-v5/manifest.json'));
  assert.ok(m.entries.some(x=>x.file==='docs/AGENT_QUALITY_BENCHMARK_V5.md'));
  assert.equal(m.validation.modelCalls,0);
  assert.equal(await verifyV5Freeze(f),true);
  const bad={...m,methodHash:'0'.repeat(64)};
  await fs.writeFile(f,JSON.stringify(bad));
  await assert.rejects(()=>verifyV5Freeze(f),/invalid V5 freeze manifest/);
});
