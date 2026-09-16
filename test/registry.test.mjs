import test from 'node:test';
import assert from 'node:assert/strict';
import { loadJson, validateRegistry, protocolFile, baselineFile } from '../src/registry.mjs';
test('registry has exactly 20 unique protocols and three baselines', () => { const r=validateRegistry(); assert.equal(r.protocols.length,20); assert.deepEqual(r.baselines.map(x=>x.id),['B0','B1','B2']); assert.equal(new Set(r.protocols.map(x=>x.trigger)).size,20); });
test('registry fails closed for duplicate trigger', () => { const p=loadJson(protocolFile); p.protocols[1].trigger=p.protocols[0].trigger; assert.throws(()=>validateRegistry(p,loadJson(baselineFile))); });
test('registry fails closed for malformed protocol shapes', () => {
  const p=loadJson(protocolFile), b=loadJson(baselineFile);
  p.protocols[0].contract='not-an-array'; assert.throws(()=>validateRegistry(p,b));
  const p2=loadJson(protocolFile); p2.protocols[0].observableSignals=['']; assert.throws(()=>validateRegistry(p2,b));
  const p3=loadJson(protocolFile); p3.protocols[0].purpose=42; assert.throws(()=>validateRegistry(p3,b));
});
test('registry requires the exact protocol ID set', () => {
  const p=loadJson(protocolFile), b=loadJson(baselineFile);
  p.protocols[19].id='P21'; assert.throws(()=>validateRegistry(p,b));
  const p2=loadJson(protocolFile); p2.protocols[19].id='P19'; assert.throws(()=>validateRegistry(p2,b));
});
test('registry fails closed for malformed, duplicate, or missing baselines', () => {
  const p=loadJson(protocolFile), b=loadJson(baselineFile);
  b.baselines[0].template=[]; assert.throws(()=>validateRegistry(p,b));
  const b2=loadJson(baselineFile); b2.baselines[1].id='B0'; assert.throws(()=>validateRegistry(p,b2));
  const b3=loadJson(baselineFile); b3.baselines[2].id='B9'; assert.throws(()=>validateRegistry(p,b3));
  const b4=loadJson(baselineFile); b4.baselines[0].purpose=42; assert.throws(()=>validateRegistry(p,b4));
});
