import test from 'node:test';import assert from 'node:assert/strict';import {createProfileVersionUpdate} from '../src/solution.mjs';
test('matching version updates city',()=>{const x=createProfileVersionUpdate({name:'Ada',city:'SG'},1);const r=x.update({expectedVersion:1,patch:{city:'KL'}});assert.equal(r.ok,true);assert.deepEqual(x.snapshot(),{version:2,data:{name:'Ada',city:'KL'}})});
