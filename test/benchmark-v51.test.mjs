import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  V51_METHOD,loadV51Manifest,v51Tasks,validateV51Registry,validateV51Structure,
  validateV51Leakage,validateV51ExecutableConsistency,validatePublicSchema,
  v51CalibrationPlan,validateV51CalibrationPlan,calibrationPromptV51,
  scopeCompliantV51,selectFormalPairsV51,freezeV51,verifyV51Freeze
} from '../src/benchmark-v51.mjs';

test('V5.1 is a fresh exact 8-pair / 16-sibling scaffold',async()=>{
  const m=loadV51Manifest();
  assert.equal(m.pairs.length,8);
  assert.equal(v51Tasks().length,16);
  assert.equal(new Set(v51Tasks().map(x=>x.id)).size,16);
  assert.ok(v51Tasks().every(x=>x.id.startsWith('V51-')));
  assert.equal(await validateV51Structure(),true);
  assert.equal(validateV51Registry().execution.formalAuthorized,false);
});

test('V5.1 strict public schema rejects wrong exact shapes and literals',()=>{
  const schema={type:'object',required:['allowed','reason'],properties:{allowed:{type:'boolean'},reason:{type:'string',enum:['role-default']}},additionalProperties:false};
  assert.deepEqual(validatePublicSchema({allowed:true,reason:'role-default'},schema),[]);
  assert.ok(validatePublicSchema({allowed:true,reason:'auditor-default'},schema).length);
  assert.ok(validatePublicSchema({allowed:true,reason:'role-default',extra:1},schema).length);
});

test('V5.1 calibration plan is 32 unique calibration-only cells',()=>{
  const cells=v51CalibrationPlan(20260920);
  assert.equal(validateV51CalibrationPlan(cells),true);
  assert.equal(cells.length,32);
  assert.equal(new Set(cells.map(x=>x.cellId)).size,32);
  const formal=new Set(loadV51Manifest().pairs.map(p=>p.formal.id));
  assert.equal(cells.some(x=>formal.has(x.taskId)),false);
  for(const p of loadV51Manifest().pairs)for(const arm of ['A0','A1'])assert.equal(cells.filter(x=>x.pairId===p.id&&x.arm===arm).length,2);
});

test('V5.1 prompt treatment and allowed-scope semantics are isolated',()=>{
  const t=loadV51Manifest().pairs[0].calibration;
  assert.doesNotMatch(calibrationPromptV51(t,'A0'),/Engineering method/);
  assert.match(calibrationPromptV51(t,'A1'),/Engineering method/);
  assert.match(V51_METHOD,/return schema/);
  assert.equal(scopeCompliantV51(t,['src/solution.mjs']),true);
  assert.equal(scopeCompliantV51(t,[]),false);
  assert.equal(scopeCompliantV51(t,['test/public.mjs']),false);
});

test('V5.1 candidate fixtures are leak-free and executable gates pass',async()=>{
  assert.equal(await validateV51Leakage(),true);
  assert.deepEqual(await validateV51ExecutableConsistency(),{tasks:16,baselines:16,references:16,mutants:48});
});

test('V5.1 selection is treatment-blind and fails closed',()=>{
  const ids=loadV51Manifest().pairs.map(p=>p.id);
  const make=(counts)=>Object.fromEntries(ids.map((id,i)=>{
    const n=counts[i],vals=Array.from({length:4},(_,j)=>j<n?'pass':'fail');
    return [id,{A0:{1:vals[0],2:vals[1]},A1:{1:vals[2],2:vals[3]}}];
  }));
  assert.equal(selectFormalPairsV51(make([2,2,2,2,2,0,4,4])).status,'stop');
  const s=selectFormalPairsV51(make([2,2,2,2,2,2,1,3]));
  assert.equal(s.status,'selected');
  assert.deepEqual(s.selectedPairIds,ids.slice(0,6));
  const flipped={};
  for(const [id,x] of Object.entries(make([2,2,2,2,2,2,1,3])))flipped[id]={A0:x.A1,A1:x.A0};
  assert.deepEqual(selectFormalPairsV51(flipped).selectedPairIds,s.selectedPairIds);
});

test('V5.1 freeze verifies and fails closed on drift',async()=>{
  const d=await fs.mkdtemp(path.join(os.tmpdir(),'aqb-v51-'));
  const f=path.join(d,'freeze.json'),m=await freezeV51(f);
  assert.equal(m.validation.modelCalls,0);
  assert.ok(m.entries.some(x=>x.file==='dataset-v51/manifest.json'));
  assert.ok(m.entries.some(x=>x.file==='scripts/v51-run-cases.mjs'));
  assert.equal(await verifyV51Freeze(f),true);
  const bad={...m,methodHash:'0'.repeat(64)};
  await fs.writeFile(f,JSON.stringify(bad));
  await assert.rejects(()=>verifyV51Freeze(f),/invalid V5.1 freeze manifest/);
});
