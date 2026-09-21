import test from 'node:test';import assert from 'node:assert/strict';import {createManifestCache} from '../src/solution.mjs';
test('hit preserves value identity',async()=>{const c=createManifestCache(),value={id:7};assert.strictEqual(await c.get('home',1,async()=>value),value);assert.strictEqual(await c.get('home',1,async()=>({id:8})),value);assert.equal(c.trace()[0].type,'get')});
