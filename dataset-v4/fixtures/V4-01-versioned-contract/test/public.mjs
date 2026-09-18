import test from 'node:test'; import assert from 'node:assert/strict'; import {resolvePolicy} from '../src/policy.mjs';
test('basic policy shape',()=>assert.deepEqual(resolvePolicy({},'xx'),{mode:'safe',limits:{burst:1,windowMs:1000}}));
