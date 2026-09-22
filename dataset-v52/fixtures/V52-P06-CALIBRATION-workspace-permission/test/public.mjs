import test from 'node:test';import assert from 'node:assert/strict';import {createWorkspacePermission} from '../src/solution.mjs';
test('local allow permits active subject',()=>{const x=createWorkspacePermission();x.allow('alice','team');assert.deepEqual(x.decide('alice','team'),{value:'ALLOW',reason:'allow:team'})});
