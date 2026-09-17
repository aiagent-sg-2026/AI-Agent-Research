import assert from 'node:assert/strict';
const root=process.argv[2]; const {submitPayment}=await import(`file://${root}/src/payments.mjs?grader=${Date.now()}`);
const a={balance:10}; const x=submitPayment(a,{key:'same',amount:3}); const y=submitPayment(a,{key:'same',amount:3});
assert.strictEqual(y,x); assert.equal(a.balance,7); assert.deepEqual(a.payments,[x]); assert.strictEqual(a.payments[0],x);
assert.throws(()=>submitPayment(a,{key:'bad',amount:0}),RangeError); assert.equal(a.balance,7); assert.deepEqual(a.payments,[x]);
assert.throws(()=>submitPayment(a,{key:'too-much',amount:99}),RangeError); assert.equal(a.balance,7); assert.deepEqual(a.payments,[x]);
const b={balance:20}; const z=submitPayment(b,{key:'same',amount:4}); assert.equal(b.balance,16); assert.deepEqual(b.payments,[z]); assert.notStrictEqual(z,x);
