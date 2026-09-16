import { createHash } from 'node:crypto';

export function stable(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
}
export function sha256(value) { return createHash('sha256').update(typeof value === 'string' ? value : stable(value)).digest('hex'); }
