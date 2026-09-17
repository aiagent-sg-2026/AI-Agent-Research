import test from 'node:test'; import assert from 'node:assert/strict'; import { total } from '../src/order.mjs';
test('basic total remains supported', () => assert.equal(total({items:[{price:10,quantity:2}],taxRate:.1,taxExempt:false}),22));
