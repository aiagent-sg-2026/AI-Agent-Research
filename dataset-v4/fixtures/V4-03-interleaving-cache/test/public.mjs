import test from 'node:test'; import assert from 'node:assert/strict'; import {readThrough} from '../src/cache.mjs';
test('cache hit',async()=>assert.equal(await readThrough(new Map([['x',2]]),'x',async()=>3),2));
