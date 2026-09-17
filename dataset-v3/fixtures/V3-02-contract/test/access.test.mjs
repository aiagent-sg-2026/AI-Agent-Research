import test from 'node:test'; import assert from 'node:assert/strict'; import { decideAccess } from '../src/access.mjs';
test('explicit allow', () => assert.deepEqual(decideAccess({decision:'allow'}), {allowed:true,reason:'decision'}));
