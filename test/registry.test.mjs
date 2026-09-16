import test from 'node:test';
import assert from 'node:assert/strict';
import { loadJson, validateRegistry, protocolFile, baselineFile } from '../src/registry.mjs';
test('registry has exactly 20 unique protocols and three baselines', () => { const r=validateRegistry(); assert.equal(r.protocols.length,20); assert.deepEqual(r.baselines.map(x=>x.id),['B0','B1','B2']); assert.equal(new Set(r.protocols.map(x=>x.trigger)).size,20); });
test('registry fails closed for duplicate trigger', () => { const p=loadJson(protocolFile); p.protocols[1].trigger=p.protocols[0].trigger; assert.throws(()=>validateRegistry(p,loadJson(baselineFile))); });
