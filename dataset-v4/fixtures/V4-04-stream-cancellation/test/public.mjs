import test from 'node:test'; import assert from 'node:assert/strict'; import {consume} from '../src/stream.mjs';
test('consumes values',async()=>{const a=[]; const r=await consume([1,2],x=>a.push(x)); assert.deepEqual(a,[1,2]); assert.deepEqual(r,{closed:false});});
