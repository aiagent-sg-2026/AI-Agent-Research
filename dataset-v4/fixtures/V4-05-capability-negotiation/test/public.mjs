import test from 'node:test'; import assert from 'node:assert/strict'; import {connect} from '../src/capability.mjs';
test('legacy peer connects',async()=>assert.equal(await connect({versions:['v1'],capabilities:[]},{open:async v=>v}),'v1'));
