import assert from 'node:assert/strict';
const root=process.argv[2]; const {adapter}=await import(`file://${root}/src/adapter.mjs`); const {exportRows}=await import(`file://${root}/src/export.mjs?grader=${Date.now()}`);
let closeSuccess=0; adapter.open=async()=>({rows:(async function*(){yield {user_id:1,display_name:'Ada'};yield {user_id:2,display_name:'Lin'};})(),close:async()=>{closeSuccess++;}});
assert.deepEqual(await exportRows(),{rows:[{id:1,name:'Ada'},{id:2,name:'Lin'}]}); assert.equal(closeSuccess,1);
let closeFailure=0; const boom=new Error('row-failed'); adapter.open=async()=>({rows:(async function*(){yield {user_id:1,display_name:'Ada'};throw boom;})(),close:async()=>{closeFailure++;}});
await assert.rejects(()=>exportRows(),e=>e===boom); assert.equal(closeFailure,1);
