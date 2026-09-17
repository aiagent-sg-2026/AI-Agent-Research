import assert from 'node:assert/strict';
const root=process.argv[2]; const {requestWithRetry}=await import(`file://${root}/src/request.mjs?grader=${Date.now()}`);
let calls=[],delays=[]; const value=await requestWithRetry(async attempt=>{calls.push(attempt); if(attempt<3) throw Object.assign(new Error('busy'),{transient:true}); return 9;},{attempts:3,delay:async a=>delays.push(a)});
assert.equal(value,9); assert.deepEqual(calls,[1,2,3]); assert.deepEqual(delays,[1,2]);
let fatalCalls=0; const fatal=new Error('fatal'); await assert.rejects(()=>requestWithRetry(async()=>{fatalCalls++; throw fatal;},{attempts:3,delay:async()=>assert.fail('must not delay')}),e=>e===fatal); assert.equal(fatalCalls,1);
const pre={aborted:true}; let preCalls=0; await assert.rejects(()=>requestWithRetry(async()=>{preCalls++; return 1;},{signal:pre}),/cancel/i); assert.equal(preCalls,0);
const during={aborted:false}; let duringCalls=0; await assert.rejects(()=>requestWithRetry(async()=>{duringCalls++; throw Object.assign(new Error('again'),{transient:true});},{attempts:3,signal:during,delay:async()=>{during.aborted=true;}}),/cancel/i); assert.equal(duringCalls,1);
const finalErr=Object.assign(new Error('last'),{transient:true}); let finalCalls=0; await assert.rejects(()=>requestWithRetry(async()=>{finalCalls++; throw finalErr;},{attempts:2}),e=>e===finalErr); assert.equal(finalCalls,2);
