import test from 'node:test'; import assert from 'node:assert/strict'; import { submitPayment } from '../src/payments.mjs';
test('first payment commits', () => { const a={balance:10}; assert.equal(submitPayment(a,{key:'a',amount:2}).status,'committed'); });
