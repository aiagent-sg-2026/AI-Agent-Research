import fs from 'node:fs/promises';
import {existsSync,readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve('.');
const manifest=JSON.parse(await fs.readFile('dataset-v52/manifest.json','utf8'));
const registry=JSON.parse(await fs.readFile('registry/benchmark-v52.json','utf8'));
const registrySchema=JSON.parse(await fs.readFile('schemas/benchmark-v52.schema.json','utf8'));
const read=file=>JSON.parse(readFileSync(path.resolve(root,file),'utf8'));
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const forbidden=['hidden grader','answer key','expected patch','competitor output','prior trial outcome','dataset-v52/evaluator','reference implementation','mutant'];

async function walk(dir){
  const out=[];
  for(const entry of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...await walk(file));else out.push(file);
  }
  return out;
}

function logicalLoc(text){
  return text.split(/\r?\n/).filter(line=>line.trim()&&!line.trim().startsWith('//')).length;
}

function typeOk(value,type){
  if(Array.isArray(type))return type.some(t=>typeOk(value,t));
  if(type===undefined)return true;
  if(type==='null')return value===null;
  if(type==='array')return Array.isArray(value);
  if(type==='object')return value!==null&&typeof value==='object'&&!Array.isArray(value);
  if(type==='integer')return Number.isInteger(value);
  if(type==='number')return typeof value==='number'&&Number.isFinite(value);
  return typeof value===type;
}

function schemaErrors(value,schema,at='$'){
  if(!schema||Object.keys(schema).length===0)return [];
  if(Array.isArray(schema.anyOf)){
    if(schema.anyOf.some(branch=>schemaErrors(value,branch,at).length===0))return [];
    return [at+': no anyOf branch matched'];
  }
  if(Array.isArray(schema.enum)&&!schema.enum.some(x=>Object.is(x,value)))return [at+': enum'];
  if(!typeOk(value,schema.type))return [at+': type'];
  const errors=[];
  if(schema.type==='object'){
    const props=schema.properties??{};
    for(const key of schema.required??[])if(!Object.hasOwn(value,key))errors.push(at+'.'+key+': required');
    if(schema.additionalProperties===false)for(const key of Object.keys(value))if(!Object.hasOwn(props,key))errors.push(at+'.'+key+': additional');
    for(const [key,sub] of Object.entries(props))if(Object.hasOwn(value,key))errors.push(...schemaErrors(value[key],sub,at+'.'+key));
  }
  if(schema.type==='array'&&schema.items)for(let i=0;i<value.length;i++)errors.push(...schemaErrors(value[i],schema.items,at+'['+i+']'));
  if((schema.type==='integer'||schema.type==='number')&&Number.isFinite(schema.minimum)&&value<schema.minimum)errors.push(at+': minimum');
  return errors;
}

function assertClosedObjectSchema(schema,label){
  check(schema&&schema.type==='object',label+' must be object schema');
  check(schema.additionalProperties===false,label+' must be closed');
  const props=Object.keys(schema.properties??{}).sort();
  const req=[...(schema.required??[])].sort();
  check(JSON.stringify(props)===JSON.stringify(req),label+' required/properties mismatch');
}

function command(cwd,args,timeoutMs=5000){
  return new Promise(resolve=>{
    const child=spawn(process.execPath,args,{cwd,shell:false});
    let out='',err='',done=false,timedOut=false;
    const timer=setTimeout(()=>{timedOut=true;child.kill('SIGTERM');setTimeout(()=>child.kill('SIGKILL'),100)},timeoutMs);
    child.stdout.on('data',b=>out+=b);
    child.stderr.on('data',b=>err+=b);
    const finish=code=>{if(done)return;done=true;clearTimeout(timer);resolve({code,out,err,timedOut})};
    child.on('error',()=>finish(null));
    child.on('close',finish);
  });
}

async function visibleWithSource(task,source){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'aqb-v52-'));
  try{
    await fs.cp(path.resolve(task.fixture),dir,{recursive:true});
    if(source)await fs.copyFile(source,path.join(dir,'src/solution.mjs'));
    return await command(dir,['--test','test/public.mjs'],5000);
  }finally{
    await fs.rm(dir,{recursive:true,force:true});
  }
}

let moduleSeq=0;
async function loadModule(file,label){
  moduleSeq++;
  return import(pathToFileURL(path.resolve(file)).href+'?'+label+'='+moduleSeq);
}

async function hiddenOutcomes(fn,driver,cases){
  const outcomes=[];
  for(const c of cases){
    try{
      const got=await driver.runCase(fn,c);
      outcomes.push({caseId:c.id,pass:JSON.stringify(got)===JSON.stringify(c.expected),got});
    }catch(error){
      outcomes.push({caseId:c.id,pass:false,error:error?.message??String(error)});
    }
  }
  return outcomes;
}

function validateRegistry(){
  check(registrySchema.$schema==='https://json-schema.org/draft/2020-12/schema','registry schema draft');
  check(registrySchema.properties?.version?.const==='benchmark-v5.2-tranche'&&registrySchema.properties?.protocol?.const==='AQB-V5.2-TRANCHE-001','registry schema identity');
  check(registry.version==='benchmark-v5.2-tranche','registry version');
  check(registry.protocol==='AQB-V5.2-TRANCHE-001','registry protocol');
  check(registry.pairCount===9&&registry.siblingCount===18,'registry tranche size');
  check(registry.tranche?.pairCount===9&&registry.tranche?.siblingCount===18&&registry.tranche?.calibrationCellsIfEverAuthorized===36,'registry tranche metadata');
  check(registry.fullDesign?.pairCount===12&&registry.fullDesign?.calibrationCells===48&&registry.fullDesign?.formalSelectedPairs===6&&registry.fullDesign?.formalCells===72,'registry full-design target');
  check(JSON.stringify(registry.calibration?.arms)===JSON.stringify(['A0','A1'])&&registry.calibration?.trials===2&&registry.calibration?.cells===36&&registry.calibration?.authorized===false,'registry calibration boundary');
  check(JSON.stringify(registry.formal?.arms)===JSON.stringify(['A0','A1','A2','A3'])&&registry.formal?.trials===3&&registry.formal?.cells===72&&registry.formal?.authorized===false,'registry formal boundary');
  check(registry.selectionPolicy?.principle==='treatment-blind aggregate difficulty'&&registry.selectionPolicy?.qualifyCombinedSuccessMin===1&&registry.selectionPolicy?.qualifyCombinedSuccessMax===3&&registry.selectionPolicy?.requiredQualifiedPairs===6&&registry.selectionPolicy?.ifInsufficient==='stop','registry selection policy');
  check(registry.execution?.calibrationAuthorized===false&&registry.execution?.formalAuthorized===false,'model execution must remain unauthorized');
}

async function validateTask(task,oldHashes){
  check(task.id?.startsWith('V52-'),'task identity '+task.id);
  check(['calibration','formal'].includes(task.role),'task role '+task.id);
  check(Array.isArray(task.allowedTarget)&&task.allowedTarget.length>=1&&task.allowedTarget.length<=3,'scope count '+task.id);
  check(task.allowedTarget.every(x=>x.startsWith('src/')),'scope path '+task.id);

  const fixtureRoot=path.resolve(task.fixture);
  const files=await walk(fixtureRoot);
  check(files.length>=6&&files.length<=12,'candidate file count '+task.id);
  for(const rel of ['docs/contract.json','docs/usage.md','package.json','src/helpers.mjs','src/solution.mjs','test/public.mjs'])check(existsSync(path.join(fixtureRoot,rel)),'missing candidate file '+task.id+':'+rel);

  const baselineText=await fs.readFile(path.join(fixtureRoot,'src/solution.mjs'),'utf8');
  const loc=logicalLoc(baselineText);
  check(loc>=25&&loc<=80,'baseline LOC '+task.id+':'+loc);

  for(const file of files){
    const rel=path.relative(fixtureRoot,file);
    const text=(await fs.readFile(file,'utf8')).toLowerCase();
    check(!/evaluator|reference|mutant/i.test(rel),'candidate leakage filename '+task.id+':'+rel);
    for(const word of forbidden)check(!text.includes(word),'candidate leakage content '+task.id+':'+word);
  }

  const contract=read(task.contract);
  const casesDoc=read(task.cases);
  const mutantDoc=read(task.mutants);
  check(contract.version==='v5.2-contract-1'&&contract.taskId===task.id,'contract identity '+task.id);
  check(Array.isArray(contract.rules)&&contract.rules.length>=6&&contract.rules.length<=9,'rule count '+task.id);
  const ruleIds=contract.rules.map(x=>x.id);
  check(new Set(ruleIds).size===ruleIds.length&&ruleIds.every(x=>/^C[1-9][0-9]*$/.test(x)),'rule ids '+task.id);
  for(const field of ['callableSurface','stateModel','eventOrdering','abortErrorPrecedence','identityMutation','traceSchema'])check(contract[field]!==undefined,'protocol field '+task.id+':'+field);
  check(typeof contract.callableSurface.factory==='string'&&Array.isArray(contract.callableSurface.methods)&&contract.callableSurface.methods.length>=3&&typeof contract.callableSurface.ownership==='string','callable surface '+task.id);
  check(Array.isArray(contract.stateModel.states)&&contract.stateModel.states.length>=3&&Array.isArray(contract.stateModel.transitions)&&contract.stateModel.transitions.length>=3,'state model '+task.id);
  check(Array.isArray(contract.eventOrdering)&&contract.eventOrdering.length>=3,'event ordering '+task.id);
  check(typeof contract.abortErrorPrecedence==='string'&&contract.abortErrorPrecedence.length>0,'precedence '+task.id);
  check(contract.identityMutation&&Object.keys(contract.identityMutation).length>=2,'identity/mutation '+task.id);
  assertClosedObjectSchema(contract.observationSchema,task.id+'.observationSchema');
  if(contract.returnSchema?.type==='object')assertClosedObjectSchema(contract.returnSchema,task.id+'.returnSchema');

  check(Array.isArray(casesDoc.cases)&&casesDoc.cases.length>=6&&casesDoc.cases.length<=10,'hidden case count '+task.id);
  check(new Set(casesDoc.cases.map(x=>x.id)).size===casesDoc.cases.length,'hidden case ids '+task.id);
  check(casesDoc.cases.filter(x=>x.ruleIds?.length>=3).length>=2,'multi-rule cases '+task.id);
  const covered=new Set();
  const publicEvents=new Set(contract.traceSchema?.items?.properties?.type?.enum??[]);
  for(const c of casesDoc.cases){
    check(Array.isArray(c.ruleIds)&&c.ruleIds.length>0&&c.ruleIds.every(x=>ruleIds.includes(x)),'untraceable case '+task.id+':'+c.id);
    c.ruleIds.forEach(x=>covered.add(x));
    check(c.expected&&Object.hasOwn(c.expected,'return')&&Object.hasOwn(c.expected,'observations'),'expected shape '+task.id+':'+c.id);
    const retErrors=schemaErrors(c.expected.return,contract.returnSchema);
    const obsErrors=schemaErrors(c.expected.observations,contract.observationSchema);
    check(retErrors.length===0,'return schema '+task.id+':'+c.id+':'+retErrors.join(','));
    check(obsErrors.length===0,'observation schema '+task.id+':'+c.id+':'+obsErrors.join(','));
    const trace=c.expected.observations.trace??c.expected.observations.events;
    if(Array.isArray(trace)){
      check(c.ruleIds.includes('C6'),'trace assertion missing C6 '+task.id+':'+c.id);
      check(trace.every(x=>publicEvents.has(x)),'undeclared trace event '+task.id+':'+c.id);
    }
  }
  check(ruleIds.every(x=>covered.has(x)),'uncovered public rule '+task.id);

  check(Array.isArray(mutantDoc.mutants)&&mutantDoc.mutants.length>=5,'mutant count '+task.id);
  for(const mutant of mutantDoc.mutants){
    check(Array.isArray(mutant.targetRuleIds)&&mutant.targetRuleIds.length>0&&mutant.targetRuleIds.every(x=>ruleIds.includes(x)),'mutant target '+task.id);
    check(existsSync(path.resolve(path.dirname(task.mutants),mutant.file)),'mutant file '+task.id+':'+mutant.file);
  }

  const driverText=await fs.readFile(path.resolve(task.driver),'utf8');
  check(!/\bexpected\b|assert\./i.test(driverText),'driver embeds answers '+task.id);

  const freshHashes=[
    hash(await fs.readFile(path.resolve(task.contract))),
    hash(await fs.readFile(path.join(fixtureRoot,'src/solution.mjs')))
  ];
  check(freshHashes.every(x=>!oldHashes.has(x)),'V5.2 reuses V5.1 artifact '+task.id);

  const baseVisible=await visibleWithSource(task,null);
  check(baseVisible.code===0&&!baseVisible.timedOut,'baseline visible failed '+task.id);

  const driver=await loadModule(task.driver,'driver');
  const baseModule=await loadModule(path.join(fixtureRoot,'src/solution.mjs'),'base');
  const refModule=await loadModule(task.reference,'reference');
  const exportName=casesDoc.exportName;
  check(typeof baseModule[exportName]==='function'&&typeof refModule[exportName]==='function','export missing '+task.id);

  const baseHidden=await hiddenOutcomes(baseModule[exportName],driver,casesDoc.cases);
  check(baseHidden.some(x=>!x.pass),'baseline hidden unexpectedly passes '+task.id);

  const refVisible=await visibleWithSource(task,path.resolve(task.reference));
  check(refVisible.code===0&&!refVisible.timedOut,'reference visible failed '+task.id);
  const refHidden=await hiddenOutcomes(refModule[exportName],driver,casesDoc.cases);
  check(refHidden.every(x=>x.pass),'reference hidden failed '+task.id+':'+refHidden.filter(x=>!x.pass).map(x=>x.caseId).join(','));

  for(let i=0;i<mutantDoc.mutants.length;i++){
    const mutant=mutantDoc.mutants[i];
    const source=path.resolve(path.dirname(task.mutants),mutant.file);
    const visible=await visibleWithSource(task,source);
    check(visible.code===0&&!visible.timedOut,'mutant visible failed '+task.id+':'+mutant.file);
    const mod=await loadModule(source,'mutant'+i);
    check(typeof mod[exportName]==='function','mutant export missing '+task.id+':'+mutant.file);
    const outcomes=await hiddenOutcomes(mod[exportName],driver,casesDoc.cases);
    const failed=outcomes.filter(x=>!x.pass);
    check(failed.length>0,'mutant hidden unexpectedly passes '+task.id+':'+mutant.file);
    check(failed.some(o=>{
      const c=casesDoc.cases.find(x=>x.id===o.caseId);
      return c.ruleIds.some(r=>mutant.targetRuleIds.includes(r));
    }),'mutant not rejected on target rule '+task.id+':'+mutant.file);
  }

  return {task:task.id,files:files.length,baselineLOC:loc,rules:ruleIds.length,hidden:casesDoc.cases.length,multiRuleCases:casesDoc.cases.filter(x=>x.ruleIds.length>=3).length,mutants:mutantDoc.mutants.length};
}

validateRegistry();
check(manifest.version==='benchmark-v5.2-tranche'&&manifest.protocol==='AQB-V5.2-TRANCHE-001','manifest identity');
check(Array.isArray(manifest.pairs)&&manifest.pairs.length===9,'manifest pair count');
check(manifest.tranche?.pairCount===9&&manifest.fullDesign?.pairCount===12&&manifest.fullDesign?.calibrationCells===48,'manifest tranche/full design');
check(manifest.execution?.calibrationAuthorized===false&&manifest.execution?.formalAuthorized===false,'manifest execution boundary');

const oldHashes=new Set();
for(const prior of ['dataset-v5','dataset-v51']){
  if(!existsSync(prior+'/manifest.json'))continue;
  for(const file of await walk(path.resolve(prior,'fixtures'))){
    if(file.endsWith('/docs/contract.json')||file.endsWith('/src/solution.mjs'))oldHashes.add(hash(await fs.readFile(file)));
  }
}

const results=[];
const ids=new Set();
const v52ArtifactHashes=new Map();
for(const pair of manifest.pairs){
  check(!ids.has(pair.id),'duplicate pair '+pair.id);ids.add(pair.id);
  check(pair.calibration?.role==='calibration'&&pair.formal?.role==='formal','sibling roles '+pair.id);
  check(pair.calibration?.pairId===pair.id&&pair.formal?.pairId===pair.id,'sibling pairId '+pair.id);
  check(pair.calibration?.family===pair.family&&pair.formal?.family===pair.family,'sibling family '+pair.id);
  for(const task of [pair.calibration,pair.formal]){
    for(const file of [task.contract,path.join(task.fixture,'src/solution.mjs')]){
      const digest=hash(await fs.readFile(file));
      check(!v52ArtifactHashes.has(digest),'duplicate V5.2 candidate artifact '+task.id+' matches '+v52ArtifactHashes.get(digest));
      v52ArtifactHashes.set(digest,task.id);
    }
  }
  const a=await validateTask(pair.calibration,oldHashes);
  const b=await validateTask(pair.formal,oldHashes);
  check(Math.abs(a.baselineLOC-b.baselineLOC)<=15,'sibling complexity LOC mismatch '+pair.id);
  check(a.hidden===b.hidden&&a.rules===b.rules&&a.mutants===b.mutants,'sibling structural mismatch '+pair.id);
  check(hash(await fs.readFile(pair.calibration.contract))!==hash(await fs.readFile(pair.formal.contract)),'sibling contracts identical '+pair.id);
  results.push(a,b);
}

console.log(JSON.stringify({
  version:manifest.protocol,
  pairs:manifest.pairs.length,
  siblings:results.length,
  structuralGate:true,
  protocolGate:true,
  visibleMutationGate:true,
  intraV52FreshnessGate:true,
  modelCalls:0,
  formalExecuted:false,
  results
},null,2));
