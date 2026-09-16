import assert from 'node:assert/strict'; const { reserve } = await import(new URL('file://' + process.argv[2] + '/src/inventory.mjs'));
assert.deepEqual(reserve({available:3}, 2), {ok:true,remaining:1});
const stock={available:3}; assert.deepEqual(reserve(stock,'2'),{ok:true,remaining:1}); assert.deepEqual(reserve(stock,'2'),{ok:false,reason:'insufficient-stock'}); console.log('PASS');
