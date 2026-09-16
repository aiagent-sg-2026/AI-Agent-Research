import fs from 'node:fs';
import path from 'node:path';
import { root, loadJson } from './registry.mjs';

export const V2_TRACKS = ['PROMPT', 'AGENTS', 'SKILLS', 'CONTEXT', 'HARNESS', 'COMBINED'];
export const V2_FAMILIES = ['BUGFIX', 'FEATURE', 'REFACTOR', 'DATA_WORKFLOW', 'TOOL_USE', 'SAFETY_BOUNDARY'];
export const v2RegistryFile = path.join(root, 'registry/benchmark-v2.json');
export const v2SchemaFile = path.join(root, 'schemas/benchmark-v2.schema.json');

const hex64 = /^[a-f0-9]{64}$/;
const fail = message => { throw new Error(`invalid benchmark-v2 registry: ${message}`); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const requireFields = (value, fields, where) => {
  if (!object(value)) fail(`${where} must be an object`);
  for (const field of fields) if (!(field in value)) fail(`${where}.${field} is required`);
};

export function validateBenchmarkV2(input = loadJson(v2RegistryFile)) {
  requireFields(input, ['version', 'control', 'tracks', 'taskFamilies', 'pins', 'metrics', 'promotion', 'contamination', 'frozenInputs'], 'root');
  if (input.version !== 'benchmark-v2' || input.control !== 'CONTROL') fail('wrong version or control');
  if (JSON.stringify(input.taskFamilies) !== JSON.stringify(V2_FAMILIES)) fail('task families are not the registered ordered set');
  if (!Array.isArray(input.tracks) || input.tracks.length !== V2_TRACKS.length) fail('exactly six tracks are required');
  if (new Set(input.tracks.map(track => track.id)).size !== 6 || !V2_TRACKS.every(id => input.tracks.some(track => track.id === id))) fail('track IDs are not exact and unique');

  requireFields(input.pins, ['model', 'tools', 'context', 'harness'], 'pins');
  requireFields(input.pins.model, ['id', 'provider', 'reasoning', 'cli'], 'pins.model');
  requireFields(input.pins.tools, ['policy', 'versions'], 'pins.tools');
  requireFields(input.pins.context, ['policy', 'tokenBudget'], 'pins.context');
  requireFields(input.pins.harness, ['version', 'digest'], 'pins.harness');
  if (!Number.isInteger(input.pins.context.tokenBudget) || input.pins.context.tokenBudget < 1 || !hex64.test(input.pins.harness.digest)) fail('invalid pin');

  const weights = input.metrics?.scoreWeights;
  if (!object(weights) || JSON.stringify(weights) !== JSON.stringify({ outcome: 50, trajectory: 20, reliability: 15, efficiency: 10, safety: 5 })) fail('V1-compatible score weights are required');
  for (const metric of ['outcome', 'trajectory', 'reliability', 'efficiency', 'safety']) if (!Array.isArray(input.metrics[metric]) || input.metrics[metric].length === 0) fail(`metrics.${metric} must be non-empty`);
  const p = input.promotion;
  requireFields(p, ['screeningTrials', 'confirmationTrials', 'minDeltaPoints', 'maxInvalidRate', 'criticalSafetyViolations', 'interval', 'bootstrapUnit'], 'promotion');
  if (p.screeningTrials !== 5 || p.confirmationTrials !== 20 || p.minDeltaPoints !== 5 || p.maxInvalidRate !== 0.02 || p.criticalSafetyViolations !== 0 || p.interval !== '95%' || p.bootstrapUnit !== 'task-block') fail('promotion gate is not the registered gate');
  requireFields(input.contamination, ['forbidden', 'invalidatesCell'], 'contamination');
  if (!Array.isArray(input.contamination.forbidden) || input.contamination.forbidden.length === 0 || input.contamination.invalidatesCell !== true) fail('contamination policy is incomplete');
  if (!Array.isArray(input.frozenInputs) || input.frozenInputs.length === 0) fail('frozenInputs must be non-empty');
  for (const [i, frozen] of input.frozenInputs.entries()) { requireFields(frozen, ['id', 'sha256'], `frozenInputs[${i}]`); if (!hex64.test(frozen.sha256)) fail(`frozenInputs[${i}].sha256 is not a SHA-256 digest`); }

  for (const track of input.tracks) {
    requireFields(track, ['id', 'factor', 'design', 'levels', 'isolation', 'trials'], `track ${track.id}`);
    requireFields(track.design, ['type', 'seed', 'randomization'], `track ${track.id}.design`);
    if (!Number.isInteger(track.design.seed) || track.design.randomization !== 'paired-blocked') fail(`track ${track.id} must have an integer seed and paired-blocked randomization`);
    if (!['one-factor', 'factorial'].includes(track.design.type)) fail(`track ${track.id} has an unknown design`);
    if (track.id !== 'COMBINED' && (track.design.type !== 'one-factor' || track.isolation.changedFactorOnly !== true)) fail(`track ${track.id} must isolate one factor`);
    if (track.id === 'COMBINED' && (track.design.type !== 'factorial' || track.isolation.changedFactorOnly !== false || track.design.interactionHypothesis === undefined)) fail('COMBINED must declare a factorial interaction hypothesis');
    if (!Array.isArray(track.levels) || track.levels.length < 2 || !track.levels.some(level => level.id === 'CONTROL')) fail(`track ${track.id} needs CONTROL and treatment levels`);
    for (const level of track.levels) { requireFields(level, ['id', 'changes', 'check'], `track ${track.id}.level`); if (!Array.isArray(level.changes) || level.changes.length === 0 || typeof level.check !== 'string' || !level.check) fail(`track ${track.id} has malformed level`); }
    requireFields(track.isolation, ['changedFactorOnly', 'explicitCombinations'], `track ${track.id}.isolation`);
    if (!Array.isArray(track.isolation.explicitCombinations)) fail(`track ${track.id} combinations must be explicit`);
    requireFields(track.trials, ['screening', 'confirmation', 'freshWorkspace'], `track ${track.id}.trials`);
    if (track.trials.screening !== 5 || track.trials.confirmation !== 20 || track.trials.freshWorkspace !== true) fail(`track ${track.id} has invalid trial policy`);
  }
  return input;
}

export function validateBenchmarkV2Files() {
  if (!fs.existsSync(v2SchemaFile)) fail('schema file is missing');
  const schema = loadJson(v2SchemaFile);
  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('unsupported schema draft');
  return validateBenchmarkV2();
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try { validateBenchmarkV2Files(); console.log('benchmark-v2 registry validated'); } catch (error) { console.error(`ERROR: ${error.message}`); process.exitCode = 1; }
}
