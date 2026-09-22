import test from 'node:test';import assert from 'node:assert/strict';import {createReportPermission} from '../src/solution.mjs';
test('local grant permits active subject',()=>{const x=createReportPermission();x.grant('alice','sales');assert.deepEqual(x.check('alice','sales'),{value:'ALLOW',reason:'allow:sales'})});
