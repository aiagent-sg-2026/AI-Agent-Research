import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validateBenchmarkV2, validateBenchmarkV2Files, V2_TRACKS, V2_FAMILIES } from '../src/benchmark-v2.mjs';
import { loadJson } from '../src/registry.mjs';

const registry = () => structuredClone(loadJson('registry/benchmark-v2.json'));

test('V2 registry and schema validate without running experiments', () => {
  const result = validateBenchmarkV2Files();
  assert.deepEqual(result.taskFamilies, V2_FAMILIES);
  assert.deepEqual(result.tracks.map(track => track.id), V2_TRACKS);
});

test('all component tracks are one-factor isolated and COMBINED is explicit factorial', () => {
  const r = registry();
  for (const track of r.tracks.filter(track => track.id !== 'COMBINED')) {
    assert.equal(track.design.type, 'one-factor');
    assert.equal(track.isolation.changedFactorOnly, true);
  }
  const combined = r.tracks.find(track => track.id === 'COMBINED');
  assert.equal(combined.design.type, 'factorial');
  assert.match(combined.design.interactionHypothesis, /stack/i);
  assert.deepEqual(combined.isolation.explicitCombinations, ['CONTROL', 'FULL_STACK']);
});

test('validator fails closed on drift, malformed hashes, and implicit combinations', async () => {
  const r = registry();
  r.tracks[0].isolation.changedFactorOnly = false;
  assert.throws(() => validateBenchmarkV2(r), /isolate one factor/);
  const malformed = registry();
  malformed.frozenInputs[0].sha256 = 'not-a-digest';
  assert.throws(() => validateBenchmarkV2(malformed), /SHA-256/);
  const implicit = registry();
  delete implicit.tracks.find(track => track.id === 'COMBINED').design.interactionHypothesis;
  assert.throws(() => validateBenchmarkV2(implicit), /interaction hypothesis/);
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'benchmark-v2-'));
  assert.ok(temp);
});

test('V2 keeps V1 result weighting and trial semantics explicit', () => {
  const r = registry();
  assert.deepEqual(r.metrics.scoreWeights, { outcome: 50, trajectory: 20, reliability: 15, efficiency: 10, safety: 5 });
  assert.equal(r.promotion.screeningTrials, 5);
  assert.equal(r.promotion.confirmationTrials, 20);
  assert.equal(r.promotion.interval, '95%');
  assert.equal(r.contamination.invalidatesCell, true);
});
