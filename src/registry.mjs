import fs from 'node:fs';
import path from 'node:path';

export const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const protocolFile = path.join(root, 'registry/protocols.json');
export const baselineFile = path.join(root, 'registry/baselines.json');
export function loadJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
export function validateRegistry(protocols = loadJson(protocolFile), baselines = loadJson(baselineFile)) {
  if (!protocols || protocols.version !== '0.1' || !Array.isArray(protocols.protocols) || protocols.protocols.length !== 20) throw new Error('registry must contain exactly 20 protocols');
  const ids = new Set(), triggers = new Set();
  for (const p of protocols.protocols) {
    for (const k of ['id','trigger','purpose','contract','primaryMetric','observableSignals']) if (!p[k]) throw new Error(`protocol missing ${k}`);
    if (!/^P\d{2}$/.test(p.id) || ids.has(p.id) || triggers.has(p.trigger)) throw new Error(`duplicate or malformed protocol ${p.id}`);
    if (!Array.isArray(p.observableSignals) || !p.observableSignals.length) throw new Error(`signals missing for ${p.id}`);
    ids.add(p.id); triggers.add(p.trigger);
  }
  if (!baselines || baselines.version !== '0.1' || !Array.isArray(baselines.baselines) || baselines.baselines.length !== 3) throw new Error('registry must contain exactly 3 baselines');
  const bids = new Set(baselines.baselines.map(b => b.id));
  if (bids.size !== 3 || !['B0','B1','B2'].every(x => bids.has(x))) throw new Error('baselines must be B0, B1, B2');
  return { protocols: protocols.protocols, baselines: baselines.baselines };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  validateRegistry(); console.log('registry valid: 20 protocols, B0/B1/B2');
}
