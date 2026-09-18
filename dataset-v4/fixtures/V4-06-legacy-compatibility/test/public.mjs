import test from 'node:test'; import assert from 'node:assert/strict'; import {normalize} from '../src/compat.mjs';
test('current input remains available',()=>assert.deepEqual(normalize({name:'x',count:2,active:true}),{name:'x',count:2,active:true}));
