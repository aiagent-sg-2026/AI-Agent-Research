import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const [driverFile,casesFile,candidateRoot]=process.argv.slice(2);
if(!driverFile||!casesFile||!candidateRoot) throw Error('driver, cases and candidate root are required');

const driver=await import(pathToFileURL(driverFile).href+'?driver='+Date.now());
const spec=JSON.parse(await fs.readFile(casesFile,'utf8'));
const solutionUrl=pathToFileURL(candidateRoot+'/src/solution.mjs');
solutionUrl.searchParams.set('candidate',String(Date.now())+Math.random());
const mod=await import(solutionUrl.href);
const fn=mod[spec.exportName];
assert.equal(typeof fn,'function','candidate export missing');

for(const c of spec.cases){
  const actual=await driver.runCase(fn,c);
  if(Object.prototype.hasOwnProperty.call(c.expected,'return')){
    assert.deepEqual(actual.return,c.expected.return,c.id+' return mismatch');
    assert.equal(actual.error,undefined,c.id+' unexpected error');
  }else{
    assert.equal(actual.return,undefined,c.id+' unexpected return');
    assert.deepEqual(actual.error,{name:c.expected.error.name,message:c.expected.error.message},c.id+' error mismatch');
  }
  assert.deepEqual(actual.observations,c.expected.observations,c.id+' observations mismatch');
}
