import fs from 'node:fs';
import path from 'node:path';

export const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const protocolFile = path.join(root, 'registry/protocols.json');
export const baselineFile = path.join(root, 'registry/baselines.json');
export function loadJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
export function validateRegistry(protocols = loadJson(protocolFile), baselines = loadJson(baselineFile)) {
  if (!protocols || protocols.version !== '0.1' || !Array.isArray(protocols.protocols) || protocols.protocols.length !== 20) throw new Error('registry must contain exactly 20 protocols');
  const ids = new Set(), triggers = new Set();
  const expectedIds = new Set(Array.from({ length: 20 }, (_, i) => `P${String(i + 1).padStart(2, '0')}`));
  const nonEmptyString = (value) => typeof value === 'string' && Boolean(value.trim());
  for (const p of protocols.protocols) {
    if (!p || typeof p !== 'object' || Array.isArray(p) || !nonEmptyString(p.id) || !expectedIds.has(p.id) || ids.has(p.id)) throw new Error(`duplicate or malformed protocol ${p?.id}`);
    for (const k of ['trigger', 'purpose', 'primaryMetric']) if (!nonEmptyString(p[k])) throw new Error(`protocol ${p.id} has invalid ${k}`);
    for (const k of ['contract', 'observableSignals']) if (!Array.isArray(p[k]) || !p[k].length || p[k].some(item => !nonEmptyString(item))) throw new Error(`protocol ${p.id} has invalid ${k}`);
    if (triggers.has(p.trigger)) throw new Error(`duplicate protocol trigger ${p.trigger}`);
    ids.add(p.id); triggers.add(p.trigger);
  }
  if (ids.size !== expectedIds.size || [...expectedIds].some(id => !ids.has(id))) throw new Error('protocols must contain exactly P01 through P20');
  if (!baselines || baselines.version !== '0.1' || !Array.isArray(baselines.baselines) || baselines.baselines.length !== 3) throw new Error('registry must contain exactly 3 baselines');
  const bids = new Set();
  for (const b of baselines.baselines) {
    if (!b || typeof b !== 'object' || Array.isArray(b) || !nonEmptyString(b.id) || !['B0', 'B1', 'B2'].includes(b.id) || bids.has(b.id)) throw new Error(`duplicate or malformed baseline ${b?.id}`);
    for (const k of ['name', 'template']) if (!nonEmptyString(b[k])) throw new Error(`baseline ${b.id} has invalid ${k}`);
    if (b.purpose !== undefined && !nonEmptyString(b.purpose)) throw new Error(`baseline ${b.id} has invalid purpose`);
    bids.add(b.id);
  }
  if (bids.size !== 3 || !['B0','B1','B2'].every(x => bids.has(x))) throw new Error('baselines must be B0, B1, B2');
  return { protocols: protocols.protocols, baselines: baselines.baselines };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  validateRegistry(); console.log('registry valid: 20 protocols, B0/B1/B2');
}
