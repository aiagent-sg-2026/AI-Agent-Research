import assert from 'node:assert/strict';
const root=process.argv[2]; const {decideAccess}=await import(`file://${root}/src/access.mjs?grader=${Date.now()}`);
assert.deepEqual(decideAccess({active:true}),{allowed:true,reason:'default'});
assert.deepEqual(decideAccess({active:false,decision:'allow',role:'auditor'}),{allowed:false,reason:'inactive'});
assert.deepEqual(decideAccess({active:true,decision:'deny',role:'auditor'}),{allowed:false,reason:'explicit-deny'});
assert.deepEqual(decideAccess({active:true,decision:'allow',role:'guest'}),{allowed:false,reason:'role-deny'});
assert.deepEqual(decideAccess({active:true,role:'auditor'}),{allowed:true,reason:'role-allow'});
assert.deepEqual(decideAccess({active:true,decision:'allow'}),{allowed:true,reason:'decision'});
assert.deepEqual(decideAccess({active:true,decision:'mystery'}),{allowed:false,reason:'unknown-decision'});
