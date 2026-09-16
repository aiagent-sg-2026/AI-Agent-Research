import assert from 'node:assert/strict'; const { retryDelay } = await import(new URL('file://' + process.argv[2] + '/src/retry.mjs'));
assert.equal(retryDelay(1,100,2000),100); assert.equal(retryDelay(2,100,2000),200); assert.equal(retryDelay(5,100,250),250); assert.equal(typeof retryDelay(1), 'number');
assert.throws(() => retryDelay(0,100,2000), RangeError); console.log('PASS');
