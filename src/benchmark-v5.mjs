import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import {loadJson,root} from './registry.mjs';
import {sha256} from './hash.mjs';
import {seededShuffle} from './pilot.mjs';
import {validateCodexLunaConfig} from './codex-luna-adapter.mjs';

export const V5_PROTOCOL='AQB-V5-CALIBRATED-001';
export const V5_CALIBRATION_ARMS=['A0','A1'];
export const V5_FORMAL_ARMS=['A0','A1','A2','A3'];
export const V5_PAIR_COUNT=8;
export const V5_SIBLING_COUNT=16;
export const V5_CALIBRATION_SEED=20260919;
export const V5_METHOD='Identify the authoritative current contract and ignore explicitly stale material. Convert every public rule into a verification checklist, inspect adjacent helpers before implementing, make the smallest allowed-scope change, run visible tests, locally exercise contract edge cases when practical, then re-check the public contract for defaults, ordering, cleanup, and compatibility before finishing.';
export const v5ManifestFile=path.join(root,'dataset-v5/manifest.json');
export const v5RegistryFile=path.join(root,'registry/benchmark-v5.json');
export const v5SchemaFile=path.join(root,'schemas/benchmark-v5.schema.json');
export const v5DesignFile=path.join(root,'docs/AGENT_QUALITY_BENCHMARK_V5.md');
const forbidden=['hidden grader','answer key','expected patch','competitor output','prior trial outcome','dataset-v5/evaluator','reference implementation','mutant'];
const targetList=t=>Array.isArray(t.allowedTarget)?t.allowedTarget:[t.allowedTarget];
const command=(exe,args,cwd,timeoutMs=5000)=>new Promise(resolve=>{const c=spawn(exe,args,{cwd,shell:false});let stdout='',stderr='',timedOut=false,settled=false;const finish=x=>{if(settled)return;settled=true;clearTimeout(timer);resolve({...x,stdout,stderr,timedOut})};const timer=setTimeout(()=>{timedOut=true;c.kill('SIGTERM');setTimeout(()=>c.kill('SIGKILL'),100)},timeoutMs);c.stdout.on('data',b=>stdout+=b);c.stderr.on('data',b=>stderr+=b);c.on('error',e=>finish({code:null,error:e.message}));c.on('close',(code,signal)=>finish({code,signal}))});
const walk=async d=>{const out=[];for(const e of(await fs.readdir(d,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const f=path.join(d,e.name);if(e.isDirectory())out.push(...await walk(f));else out.push(f)}return out};
const importFresh=async f=>import(pathToFileURL(f).href+`?v=${Date.now()}-${Math.random()}`);

export function loadV5Manifest(){return loadJson(v5ManifestFile);}
export function v5Tasks(){const m=loadV5Manifest();return m.pairs.flatMap(p=>[p.calibration,p.formal]);}
export function scopeCompliantV5(task,files){const allowed=targetList(task);return Array.isArray(files)&&files.length>0&&files.every(f=>allowed.includes(f));}

export function validateV5Registry(){
 const r=loadJson(v5RegistryFile),s=loadJson(v5SchemaFile),c=loadJson(path.join(root,'config/adapter.codex-luna.vm.json'));
 validateCodexLunaConfig(c);
 if(s.$schema!=='https://json-schema.org/draft/2020-12/schema')throw Error('invalid V5 schema');
 if(r.version!=='benchmark-v5-scaffold'||r.protocol!==V5_PROTOCOL||r.pairCount!==8||r.siblingCount!==16)throw Error('invalid V5 registry identity');
 if(JSON.stringify(r.calibration?.arms)!==JSON.stringify(V5_CALIBRATION_ARMS)||r.calibration?.trials!==1||r.calibration?.cells!==16||r.calibration?.seed!==V5_CALIBRATION_SEED||r.calibration?.randomization!=='seeded paired-blocked')throw Error('invalid V5 calibration registry');
 if(r.formal?.selectedPairs!==6||r.formal?.trials!==3||r.formal?.cells!==72||r.formal?.authorized!==false||JSON.stringify(r.formal?.arms)!==JSON.stringify(V5_FORMAL_ARMS))throw Error('invalid V5 formal boundary');
 if(r.execution?.calibrationAuthorized!==false||r.execution?.formalAuthorized!==false)throw Error('V5 model execution must remain unauthorized');
 if(r.selectionPolicy?.qualifyingPattern!=='exactly-one-of-A0-A1-passes'||r.selectionPolicy?.requiredQualifiedPairs!==6||r.selectionPolicy?.tieBreak!=='registry-pair-order'||r.selectionPolicy?.ifInsufficient!=='stop')throw Error('invalid V5 selection policy');
 if(r.adapter?.model!==c.model||r.adapter?.reasoningEffort!==c.reasoningEffort||r.adapter?.cliVersion!==c.cliVersion)throw Error('invalid V5 adapter pin');
 return r;
}

async function taskMetadata(task){
 if(!task||typeof task.id!=='string'||!['calibration','formal'].includes(task.role)||typeof task.fixture!=='string'||typeof task.grader!=='string'||typeof task.reference!=='string'||typeof task.mutants!=='string')throw Error('malformed V5 task');
 const allowed=targetList(task);if(!allowed.length||allowed.some(x=>typeof x!=='string'||!x.startsWith('src/')))throw Error(`invalid allowedTarget ${task.id}`);
 if(!task.fixture.startsWith('dataset-v5/fixtures/')||!task.grader.startsWith('dataset-v5/evaluator/')||!task.reference.startsWith('dataset-v5/evaluator/')||!task.mutants.startsWith('dataset-v5/evaluator/'))throw Error(`invalid V5 path boundary ${task.id}`);
 const contract=loadJson(path.resolve(root,task.contract));
 if(contract.taskId!==task.id||!Array.isArray(contract.rules)||contract.rules.length<4)throw Error(`invalid contract ${task.id}`);
 const ruleIds=contract.rules.map(x=>x.id);
 if(new Set(ruleIds).size!==ruleIds.length||ruleIds.some(x=>!/^C[1-9][0-9]*$/.test(x)))throw Error(`invalid public rule ids ${task.id}`);
 const grader=await importFresh(path.resolve(root,task.grader));
 if(typeof grader.grade!=='function'||!Array.isArray(grader.assertions)||grader.assertions.length<3||!Array.isArray(grader.coveredRuleIds))throw Error(`invalid hidden grader metadata ${task.id}`);
 for(const a of grader.assertions){if(typeof a.id!=='string'||!Array.isArray(a.ruleIds)||!a.ruleIds.length||a.ruleIds.some(x=>!ruleIds.includes(x)))throw Error(`untraceable hidden assertion ${task.id}`)}
 const union=[...new Set(grader.assertions.flatMap(x=>x.ruleIds))].sort();
 if(JSON.stringify(union)!==JSON.stringify([...grader.coveredRuleIds].sort())||union.some(x=>!ruleIds.includes(x)))throw Error(`coveredRuleIds mismatch ${task.id}`);
 const mm=loadJson(path.resolve(root,task.mutants));
 if(!Array.isArray(mm.mutants)||mm.mutants.length<3)throw Error(`V5 requires >=3 mutants ${task.id}`);
 for(const mu of mm.mutants){if(typeof mu.file!=='string'||!Array.isArray(mu.targetRuleIds)||!mu.targetRuleIds.length||mu.targetRuleIds.some(x=>!ruleIds.includes(x)))throw Error(`invalid mutant metadata ${task.id}`);const f=path.resolve(path.dirname(path.resolve(root,task.mutants)),mu.file);if(!existsSync(f))throw Error(`missing mutant ${task.id}`)}
 return {contract,ruleIds,grader,mutants:mm.mutants};
}

export async function validateV5Structure(){
 const m=loadV5Manifest();
 if(m.version!=='benchmark-v5-scaffold'||!Array.isArray(m.pairs)||m.pairs.length!==V5_PAIR_COUNT)throw Error('V5 manifest must contain exactly 8 pairs');
 const pairIds=m.pairs.map(p=>p.id),tasks=v5Tasks();
 if(new Set(pairIds).size!==8||tasks.length!==V5_SIBLING_COUNT||new Set(tasks.map(t=>t.id)).size!==16)throw Error('V5 pair/sibling IDs must be unique');
 for(const p of m.pairs){
  if(p.calibration?.role!=='calibration'||p.formal?.role!=='formal'||p.calibration?.pairId!==p.id||p.formal?.pairId!==p.id||p.calibration?.family!==p.family||p.formal?.family!==p.family)throw Error(`invalid sibling roles ${p.id}`);
  if(p.calibration.id===p.formal.id||sha256(loadJson(path.resolve(root,p.calibration.contract)))===sha256(loadJson(path.resolve(root,p.formal.contract))))throw Error(`siblings must be materially distinct ${p.id}`);
  await taskMetadata(p.calibration);await taskMetadata(p.formal);
 }
 return true;
}

export async function validateV5Leakage(){
 for(const t of v5Tasks()){
  for(const f of await walk(path.resolve(root,t.fixture))){
   const rel=path.relative(path.resolve(root,t.fixture),f);if(/evaluator|grader|reference|mutant/i.test(rel))throw Error(`evaluator material in fixture ${t.id}`);
   const txt=await fs.readFile(f,'utf8');if(forbidden.some(x=>txt.toLowerCase().includes(x)))throw Error(`candidate leakage ${t.id}`);
  }
 }
 return true;
}

async function hiddenResult(task,dir){const r=await command(process.execPath,[path.join(root,'scripts/v5-run-grader.mjs'),path.resolve(root,task.grader),dir],root,3000);return {pass:r.code===0&&!r.timedOut,assertionFailure:/AssertionError/.test(r.stdout+r.stderr),timedOut:r.timedOut,detail:(r.stderr||r.stdout).slice(-1000)}}
async function variantWorkspace(task,source){
 const d=await fs.mkdtemp(path.join(os.tmpdir(),'aqb-v5-'));
 await fs.cp(path.resolve(root,task.fixture),d,{recursive:true});
 if(source)await fs.copyFile(source,path.join(d,'src/solution.mjs'));
 return d;
}
async function validateV5TaskExecutable(t){
 if(process.env.V5_VALIDATION_PROGRESS==='1')console.error('V5 validate '+t.id);
 const meta=await taskMetadata(t),base=path.dirname(path.resolve(root,t.mutants));
 const variants=[
  {kind:'baseline',source:null,label:'baseline'},
  {kind:'reference',source:path.resolve(root,t.reference),label:'reference'},
  ...meta.mutants.map(mu=>({kind:'mutant',source:path.resolve(base,mu.file),label:mu.file}))
 ];
 await Promise.all(variants.map(async v=>{
  const w=await variantWorkspace(t,v.source);
  try{
   const vis=await command(process.execPath,['--test','test/public.mjs'],w);
   if(vis.code!==0)throw Error(v.kind+' visible test failed '+t.id+':'+v.label);
   const hid=await hiddenResult(t,w);
   if(v.kind==='reference'){
    if(!hid.pass)throw Error('reference hidden acceptance failed '+t.id+': '+hid.detail);
   }else{
    if(hid.pass||hid.timedOut)throw Error(v.kind+' hidden grader must reject without timeout '+t.id+':'+v.label);
   }
  }finally{await fs.rm(w,{recursive:true,force:true})}
 }));
 return {tasks:1,baselines:1,references:1,mutants:meta.mutants.length};
}
export async function validateV5ExecutableConsistency(){
 const summary={tasks:0,baselines:0,references:0,mutants:0},tasks=v5Tasks();
 for(let i=0;i<tasks.length;i+=4){
  const batch=await Promise.all(tasks.slice(i,i+4).map(validateV5TaskExecutable));
  for(const r of batch)for(const k of Object.keys(summary))summary[k]+=r[k];
 }
 if(summary.tasks!==16||summary.baselines!==16||summary.references!==16||summary.mutants<48)throw Error('incomplete V5 executable validation');
 return summary;
}

export async function validateV5Corpus(){
 validateV5Registry();
 await validateV5Structure();
 await validateV5Leakage();
 const executable=await validateV5ExecutableConsistency();
 return {version:V5_PROTOCOL,pairs:8,siblings:16,...executable,modelCalls:0};
}

export function deliveryContractV5(){
 const h=sha256(V5_METHOD);
 return {version:V5_PROTOCOL,methodHash:h,arms:V5_FORMAL_ARMS.map(id=>({id,semantics:id==='A0'?null:h,channel:id==='A0'?'plain task prompt':id==='A1'?'user prompt':id==='A2'?'candidate AGENTS.md':'candidate-visible skill plus explicit invocation directive'}))};
}
export function calibrationPrompt(task,arm){
 if(!V5_CALIBRATION_ARMS.includes(arm))throw Error('V5 calibration allows A0/A1 only');
 const scope=`\n\nVisible scope: edit only ${targetList(task).join(' and ')}.`;
 return arm==='A0'?task.task+scope:`${task.task}${scope}\n\nEngineering method:\n${V5_METHOD}`;
}
export function v5CalibrationPlan(seed=V5_CALIBRATION_SEED){
 const cells=loadV5Manifest().pairs.flatMap(p=>V5_CALIBRATION_ARMS.map(arm=>({version:V5_PROTOCOL,pairId:p.id,taskId:p.calibration.id,siblingRole:'calibration',arm,trial:1,seed:Number(seed)})));
 return seededShuffle(cells,Number(seed)).map((c,i)=>({...c,ordinal:i+1,cellId:`${String(i+1).padStart(3,'0')}-${c.taskId}-${c.arm}`}));
}
export function validateV5CalibrationPlan(cells){
 if(!Array.isArray(cells)||cells.length!==16)throw Error('V5 calibration plan must contain exactly 16 cells');
 const calIds=new Set(loadV5Manifest().pairs.map(p=>p.calibration.id)),formalIds=new Set(loadV5Manifest().pairs.map(p=>p.formal.id));
 const keys=cells.map(c=>`${c.taskId}|${c.arm}|${c.trial}`);
 if(new Set(keys).size!==16||new Set(cells.map(c=>c.cellId)).size!==16)throw Error('duplicate V5 calibration cells');
 if(cells.some(c=>!calIds.has(c.taskId)||formalIds.has(c.taskId)||c.siblingRole!=='calibration'||!V5_CALIBRATION_ARMS.includes(c.arm)||c.trial!==1))throw Error('formal sibling leaked into calibration plan');
 return true;
}

export function selectFormalPairs(outcomes){
 const registry=validateV5Registry(),pairs=loadV5Manifest().pairs,qualified=[];
 for(const p of pairs){
  const x=outcomes?.[p.id],a0=x?.A0,a1=x?.A1;
  if(!['pass','fail'].includes(a0)||!['pass','fail'].includes(a1))continue;
  if(a0!==a1)qualified.push(p);
 }
 if(qualified.length<registry.selectionPolicy.requiredQualifiedPairs)return {status:'stop',reason:'insufficient-qualified-pairs',qualifiedPairIds:qualified.map(p=>p.id),selectedPairIds:[],formalTaskIds:[]};
 const selected=qualified.slice(0,registry.selectionPolicy.requiredQualifiedPairs);
 return {status:'selected',reason:'preregistered-policy',qualifiedPairIds:qualified.map(p=>p.id),selectedPairIds:selected.map(p=>p.id),formalTaskIds:selected.map(p=>p.formal.id)};
}

async function hashFile(f){return sha256(await fs.readFile(f));}
export async function freezeV5(out=path.join(root,'v5-scaffold-freeze.json')){
 const validation=await validateV5Corpus(),configFile='config/adapter.codex-luna.vm.json',config=loadJson(path.resolve(root,configFile));
 const files=['dataset-v5/manifest.json','registry/benchmark-v5.json','schemas/benchmark-v5.schema.json','docs/AGENT_QUALITY_BENCHMARK_V5.md','docs/BENCHMARK_PROTOCOL.md','package.json','src/benchmark-v5.mjs','src/hash.mjs','src/pilot.mjs','src/registry.mjs','src/codex-luna-adapter.mjs','src/execute.mjs','scripts/v5-run-grader.mjs','scripts/v5-calibrate.mjs',configFile];
 files.push(...(await walk(path.join(root,'dataset-v5'))).map(f=>path.relative(root,f)));
 const entries=[];for(const f of [...new Set(files)].sort())entries.push({file:f,sha256:await hashFile(path.resolve(root,f))});
 const manifest={version:V5_PROTOCOL,pairs:loadV5Manifest().pairs.map(p=>p.id),siblings:v5Tasks().map(t=>t.id),methodHash:sha256(V5_METHOD),delivery:deliveryContractV5(),selectionPolicy:loadJson(v5RegistryFile).selectionPolicy,adapter:{file:configFile,sha256:await hashFile(path.resolve(root,configFile)),model:config.model,reasoningEffort:config.reasoningEffort,cliVersion:config.cliVersion},validation,entries,manifestSha256:sha256(entries)};
 await fs.writeFile(out,JSON.stringify(manifest,null,2)+'\n');return manifest;
}
export async function verifyV5Freeze(file=path.join(root,'v5-scaffold-freeze.json')){
 const expected=loadJson(file);
 if(expected.version!==V5_PROTOCOL||expected.methodHash!==sha256(V5_METHOD)||expected.manifestSha256!==sha256(expected.entries)||JSON.stringify(expected.delivery)!==JSON.stringify(deliveryContractV5()))throw Error('invalid V5 freeze manifest');
 const tmp=path.join(path.dirname(file),`.v5-freeze-${process.pid}.json`),actual=await freezeV5(tmp);await fs.rm(tmp,{force:true});
 if(sha256(expected.entries)!==sha256(actual.entries)||JSON.stringify(expected.selectionPolicy)!==JSON.stringify(actual.selectionPolicy))throw Error('V5 frozen input mismatch');
 return true;
}

const args=argv=>{const o={};for(let i=2;i<argv.length;i++)if(argv[i].startsWith('--'))o[argv[i].slice(2)]=argv[++i]??true;return o};
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 const a=args(process.argv),fail=e=>{console.error(`ERROR: ${e.message}`);process.exitCode=1};
 if(a.validate)validateV5Corpus().then(x=>console.log(JSON.stringify(x,null,2))).catch(fail);
 else if(a.plan){const cells=v5CalibrationPlan(Number(a.seed??V5_CALIBRATION_SEED));validateV5CalibrationPlan(cells);const d=path.resolve(a.plan);fs.mkdir(d,{recursive:true}).then(()=>fs.writeFile(path.join(d,'plan.json'),JSON.stringify({version:V5_PROTOCOL,seed:Number(a.seed??V5_CALIBRATION_SEED),cells,planHash:sha256(cells)},null,2)+'\n')).then(()=>console.log(JSON.stringify({version:V5_PROTOCOL,cells:16,modelCalls:0},null,2))).catch(fail)}
 else if(a.freeze)freezeV5(path.resolve(a.freeze)).then(x=>console.log(JSON.stringify({version:x.version,entries:x.entries.length,manifestSha256:x.manifestSha256,modelCalls:0},null,2))).catch(fail);
 else if(a.verify)verifyV5Freeze(path.resolve(a.verify)).then(()=>console.log('V5 scaffold freeze verified; model calls: 0')).catch(fail);
}
