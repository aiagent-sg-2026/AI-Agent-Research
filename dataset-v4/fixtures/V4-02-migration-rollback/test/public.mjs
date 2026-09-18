import test from 'node:test'; import assert from 'node:assert/strict'; import {applyMigration} from '../src/migration.mjs';
test('empty migration is successful',async()=>assert.deepEqual(await applyMigration([],{apply:async()=>{}}),{ok:true,applied:0}));
