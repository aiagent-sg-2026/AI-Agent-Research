import test from 'node:test';import assert from 'node:assert/strict';import {createInventoryVersionUpdate} from '../src/solution.mjs';
test('matching revision updates quantity',()=>{const x=createInventoryVersionUpdate({sku:'A',qty:5},1);const r=x.commit({expectedVersion:1,patch:{qty:6}});assert.equal(r.ok,true);assert.deepEqual(x.read(),{version:2,data:{sku:'A',qty:6}})});
