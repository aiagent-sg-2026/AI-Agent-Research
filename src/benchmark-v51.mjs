import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import {loadJson,root} from './registry.mjs';
import {sha256} from './hash.mjs';
import {seededShuffle} from './pilot.mjs';
import {validateCodexLunaConfig} from './codex-luna-adapter.mjs';

export const V51_PROTOCOL='AQB-V5.1-CALIBRATED-001';
export const V51_CALIBRATION_ARMS=['A0','A1'];
export const V51_FORMAL_ARMS=['A0','A1','A2','A3'];
export const V51_TRIALS=2;
export const V51_SEED=20260920;
export const V51_METHOD='Read the candidate-visible contract before editing. Treat every rule ID, return schema, observation schema, exact enum literal, and error variant as normative. Make a checklist of those obligations, inspect adjacent implementation helpers, make the smallest allowed-scope change, run visible tests, exercise edge combinations when practical, then re-check exact keys, types, literals, ordering, cleanup, and error representation before finishing.';
export const v51ManifestFile=path.join(root,'dataset-v51/manifest.json');
export const v51RegistryFile=path.join(root,'registry/benchmark-v51.json');
export const v51SchemaFile=path.join(root,'schemas/benchmark-v51.schema.json');
export const v51DesignFile=path.join(root,'docs/AGENT_QUALITY_BENCHMARK_V5_1.md');
const forbidden=['hidden grader','answer key','expected patch','competitor output','prior trial outcome','dataset-v51/evaluator','reference implementation','mutant'];

const targetList=t=>Array.isArray(t.allowedTarget)?t.allowedTarget:[t.allowedTarget];
const walk=async d=>{const out=[];for(const e of(await fs.readdir(d,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const f=path.join(d,e.name);if(e.isDirectory())out.push(...await walk(f));else out.push(f)}return out};
const command=(exe,args,cwd,timeoutMs=5000)=>new Promise(resolve=>{const c=spawn(exe,args,{cwd,shell:false});let stdout='',stderr='',timedOut=false,settled=false;const finish=x=>{if(settled)return;settled=true;clearTimeout(timer);resolve({...x,stdout,stderr,timedOut})};const timer=setTimeout(()=>{timedOut=true;c.kill('SIGTERM');setTimeout(()=>c.kill('SIGKILL'),100)},timeoutMs);c.stdout.on('data',b=>stdout+=b);c.stderr.on('data',b=>stderr+=b);c.on('error',e=>finish({code:null,error:e.message}));c.on('close',(code,signal)=>finish({code,signal}))});
const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);

export function loadV51Manifest(){return loadJson(v51ManifestFile);}
export function v51Tasks(){return loadV51Manifest().pairs.flatMap(p=>[p.calibration,p.formal]);}
export function scopeCompliantV51(task,files){const allowed=targetList(task);return Array.isArray(files)&&files.length>0&&files.every(f=>allowed.includes(f));}

function typeOk(value,type){
 if(type==='null')return value===null;
 if(type==='array')return Array.isArray(value);
 if(type==='object')return value!==null&&typeof value==='object'&&!Array.isArray(value);
 if(type==='integer')return Number.isInteger(value);
 if(type==='number')return typeof value==='number'&&Number.isFinite(value);
 return typeof value===type;
}
export function validatePublicSchema(value,schema,at='$'){
 if(!schema||typeof schema!=='object')return [`${at}: missing schema`];
 if(Array.isArray(schema.anyOf)){
  const branches=schema.anyOf.map(s=>validatePublicSchema(value,s,at));
  if(branches.some(x=>x.length===0))return [];
  return [`${at}: no anyOf branch matched`];
 }
 if(Array.isArray(schema.enum)&&!schema.enum.some(x=>Object.is(x,value)))return [`${at}: value outside enum`];
 if(schema.type&&!typeOk(value,schema.type))return [`${at}: expected ${schema.type}`];
 const errors=[];
 if(schema.type==='string'&&Number.isInteger(schema.minLength)&&value.length<schema.minLength)errors.push(`${at}: minLength`);
 if((schema.type==='integer'||schema.type==='number')&&Number.isFinite(schema.minimum)&&value<schema.minimum)errors.push(`${at}: minimum`);
 if(schema.type==='array'&&schema.items)for(let i=0;i<value.length;i++)errors.push(...validatePublicSchema(value[i],schema.items,`${at}[${i}]`));
 if(schema.type==='object'){
  const props=schema.properties??{},req=schema.required??[];
  for(const k of req)if(!hasOwn(value,k))errors.push(`${at}.${k}: required`);
  if(schema.additionalProperties===false)for(const k of Object.keys(value))if(!hasOwn(props,k))errors.push(`${at}.${k}: additional property`);
  for(const [k,s] of Object.entries(props))if(hasOwn(value,k))errors.push(...validatePublicSchema(value[k],s,`${at}.${k}`));
 }
 return errors;
}
function assertClosedSchema(schema,label){
 if(Array.isArray(schema?.anyOf)){for(const s of schema.anyOf)assertClosedSchema(s,label);return}
 if(schema?.type==='object'){
  if(schema.additionalProperties!==false)throw Error(`${label}: object schema must set additionalProperties=false`);
  const props=Object.keys(schema.properties??{}).sort(),req=[...(schema.required??[])].sort();
  if(JSON.stringify(props)!==JSON.stringify(req))throw Error(`${label}: object schema required keys must equal property keys`);
  for(const [k,s] of Object.entries(schema.properties??{}))assertClosedSchema(s,`${label}.${k}`);
 } else if(schema?.type==='array'&&schema.items) assertClosedSchema(schema.items,`${label}[]`);
}

export function validateV51Registry(){
 const r=loadJson(v51RegistryFile),s=loadJson(v51SchemaFile),c=loadJson(path.join(root,'config/adapter.codex-luna.vm.json'));
 validateCodexLunaConfig(c);
 if(s.$schema!=='https://json-schema.org/draft/2020-12/schema'||r.version!=='benchmark-v5.1-scaffold'||r.protocol!==V51_PROTOCOL)throw Error('invalid V5.1 registry identity');
 if(r.pairCount!==8||r.siblingCount!==16||JSON.stringify(r.calibration?.arms)!==JSON.stringify(V51_CALIBRATION_ARMS)||r.calibration?.trials!==2||r.calibration?.cells!==32||r.calibration?.seed!==V51_SEED)throw Error('invalid V5.1 calibration registry');
 if(r.formal?.selectedPairs!==6||r.formal?.cells!==72||r.formal?.trials!==3||r.formal?.authorized!==false||JSON.stringify(r.formal?.arms)!==JSON.stringify(V51_FORMAL_ARMS))throw Error('invalid V5.1 formal boundary');
 const p=r.selectionPolicy;
 if(p?.principle!=='treatment-blind aggregate difficulty'||p.qualifyCombinedSuccessMin!==1||p.qualifyCombinedSuccessMax!==3||p.cellsPerPair!==4||p.requiredQualifiedPairs!==6||p.ifInsufficient!=='stop')throw Error('invalid V5.1 selection policy');
 if(r.execution?.calibrationAuthorized!==false||r.execution?.formalAuthorized!==false)throw Error('V5.1 model execution must remain unauthorized');
 if(r.adapter?.model!==c.model||r.adapter?.reasoningEffort!==c.reasoningEffort||r.adapter?.cliVersion!==c.cliVersion)throw Error('invalid V5.1 adapter pin');
 return r;
}

async function metadata(task){
 if(!task?.id?.startsWith('V51-')||!['calibration','formal'].includes(task.role)||!task.fixture?.startsWith('dataset-v51/fixtures/')||!task.driver?.startsWith('dataset-v51/evaluator/')||!task.cases?.startsWith('dataset-v51/evaluator/'))throw Error('malformed V5.1 task');
 const allowed=targetList(task);if(!allowed.length||allowed.some(x=>typeof x!=='string'||!x.startsWith('src/')))throw Error(`invalid allowedTarget ${task.id}`);
 const contract=loadJson(path.resolve(root,task.contract)),cases=loadJson(path.resolve(root,task.cases)),mutants=loadJson(path.resolve(root,task.mutants));
 if(contract.version!=='v5.1-contract-1'||contract.taskId!==task.id||!Array.isArray(contract.rules)||contract.rules.length<4)throw Error(`invalid contract ${task.id}`);
 assertClosedSchema(contract.returnSchema,`${task.id}.returnSchema`);
 assertClosedSchema(contract.observationSchema,`${task.id}.observationSchema`);
 const ruleIds=contract.rules.map(x=>x.id);
 if(new Set(ruleIds).size!==ruleIds.length||ruleIds.some(x=>!/^C[1-9][0-9]*$/.test(x)))throw Error(`invalid rule ids ${task.id}`);
 const errors=contract.errorVariants??[],errorIds=new Set();
 for(const e of errors){if(typeof e.id!=='string'||typeof e.name!=='string'||typeof e.message!=='string'||errorIds.has(e.id))throw Error(`invalid error variant ${task.id}`);errorIds.add(e.id)}
 if(typeof cases.exportName!=='string'||!Array.isArray(cases.cases)||cases.cases.length<3)throw Error(`invalid cases ${task.id}`);
 const covered=new Set();
 for(const c of cases.cases){
  if(typeof c.id!=='string'||!Array.isArray(c.ruleIds)||!c.ruleIds.length||c.ruleIds.some(x=>!ruleIds.includes(x)))throw Error(`untraceable case ${task.id}:${c.id}`);
  c.ruleIds.forEach(x=>covered.add(x));
  if(!c.expected||!hasOwn(c.expected,'observations'))throw Error(`missing expected observations ${task.id}:${c.id}`);
  const obsErrors=validatePublicSchema(c.expected.observations,contract.observationSchema);
  if(obsErrors.length)throw Error(`hidden observation outside public schema ${task.id}:${c.id}: ${obsErrors.join('; ')}`);
  const hasReturn=hasOwn(c.expected,'return'),hasError=hasOwn(c.expected,'error');
  if(hasReturn===hasError)throw Error(`case must have exactly one return/error ${task.id}:${c.id}`);
  if(hasReturn){
   const errs=validatePublicSchema(c.expected.return,contract.returnSchema);if(errs.length)throw Error(`hidden return outside public schema ${task.id}:${c.id}: ${errs.join('; ')}`);
  }else{
   const e=c.expected.error,decl=errors.find(x=>x.id===e.variant);
   if(!decl||e.name!==decl.name||e.message!==decl.message)throw Error(`hidden error not exactly public ${task.id}:${c.id}`);
  }
 }
 if(ruleIds.some(x=>!covered.has(x)))throw Error(`public rule lacks hidden coverage ${task.id}`);
 if(!Array.isArray(mutants.mutants)||mutants.mutants.length<3)throw Error(`V5.1 requires >=3 mutants ${task.id}`);
 for(const m of mutants.mutants){if(!Array.isArray(m.targetRuleIds)||!m.targetRuleIds.length||m.targetRuleIds.some(x=>!ruleIds.includes(x))||!existsSync(path.resolve(path.dirname(path.resolve(root,task.mutants)),m.file)))throw Error(`invalid mutant metadata ${task.id}`)}
 const driverText=await fs.readFile(path.resolve(root,task.driver),'utf8');
 if(/\bexpected\b|assert\./i.test(driverText))throw Error(`driver may not contain expected values/assertions ${task.id}`);
 return {contract,cases,mutants:mutants.mutants};
}

export async function validateV51Structure(){
 const m=loadV51Manifest();if(m.version!=='benchmark-v5.1-scaffold'||!Array.isArray(m.pairs)||m.pairs.length!==8)throw Error('V5.1 must contain exactly 8 pairs');
 const tasks=v51Tasks();
 if(tasks.length!==16||new Set(tasks.map(x=>x.id)).size!==16||new Set(m.pairs.map(x=>x.id)).size!==8)throw Error('V5.1 IDs must be exact/unique');
 const oldHashes=new Set();
 if(existsSync(path.join(root,'dataset-v5/manifest.json'))){for(const f of await walk(path.join(root,'dataset-v5/fixtures')))if(f.endsWith('/docs/contract.json')||f.endsWith('/src/solution.mjs'))oldHashes.add(sha256(await fs.readFile(f)))}
 for(const p of m.pairs){
  if(p.calibration?.role!=='calibration'||p.formal?.role!=='formal'||p.calibration?.pairId!==p.id||p.formal?.pairId!==p.id||p.calibration?.family!==p.family||p.formal?.family!==p.family)throw Error(`invalid siblings ${p.id}`);
  for(const t of [p.calibration,p.formal]){await metadata(t);for(const f of [t.contract,path.join(t.fixture,'src/solution.mjs')])if(oldHashes.has(sha256(await fs.readFile(path.resolve(root,f)))))throw Error(`V5.1 corpus reuses V5 artifact ${t.id}`)}
 }
 return true;
}
export async function validateV51Leakage(){
 for(const t of v51Tasks())for(const f of await walk(path.resolve(root,t.fixture))){
  const rel=path.relative(path.resolve(root,t.fixture),f),txt=await fs.readFile(f,'utf8');
  if(/evaluator|driver|cases|reference|mutant/i.test(rel)||forbidden.some(x=>txt.toLowerCase().includes(x)))throw Error(`candidate leakage ${t.id}`);
 }
 return true;
}
async function workspace(task,source){
 const d=await fs.mkdtemp(path.join(os.tmpdir(),'aqb-v51-'));await fs.cp(path.resolve(root,task.fixture),d,{recursive:true});
 if(source)await fs.copyFile(source,path.join(d,'src/solution.mjs'));return d;
}
async function hidden(task,w){
 return command(process.execPath,[path.join(root,'scripts/v51-run-cases.mjs'),path.resolve(root,task.driver),path.resolve(root,task.cases),w],root,4000);
}
async function validateTaskExecutable(task){
 const meta=await metadata(task),base=path.dirname(path.resolve(root,task.mutants));
 const vars=[{kind:'baseline',source:null,label:'baseline'},{kind:'reference',source:path.resolve(root,task.reference),label:'reference'},...meta.mutants.map(m=>({kind:'mutant',source:path.resolve(base,m.file),label:m.file}))];
 await Promise.all(vars.map(async v=>{
  const w=await workspace(task,v.source);
  try{
   const vis=await command(process.execPath,['--test','test/public.mjs'],w,4000);if(vis.code!==0||vis.timedOut)throw Error(`${v.kind} visible failed ${task.id}:${v.label}`);
   const hid=await hidden(task,w);
   if(v.kind==='reference'){if(hid.code!==0||hid.timedOut)throw Error(`reference hidden failed ${task.id}: ${(hid.stderr||hid.stdout).slice(-600)}`)}
   else {if(hid.code===0||hid.timedOut)throw Error(`${v.kind} not cleanly rejected ${task.id}:${v.label}`);if(v.kind==='baseline'&&!/AssertionError/.test(hid.stdout+hid.stderr))throw Error(`baseline hidden failure must be AssertionError ${task.id}`)}
  }finally{await fs.rm(w,{recursive:true,force:true})}
 }));
 return {tasks:1,baselines:1,references:1,mutants:meta.mutants.length};
}
export async function validateV51ExecutableConsistency(){
 const sum={tasks:0,baselines:0,references:0,mutants:0},tasks=v51Tasks();
 for(let i=0;i<tasks.length;i+=4){const batch=await Promise.all(tasks.slice(i,i+4).map(validateTaskExecutable));for(const r of batch)for(const k of Object.keys(sum))sum[k]+=r[k]}
 if(sum.tasks!==16||sum.baselines!==16||sum.references!==16||sum.mutants<48)throw Error('incomplete V5.1 executable validation');return sum;
}
export async function validateV51Corpus(){
 validateV51Registry();await validateV51Structure();await validateV51Leakage();const x=await validateV51ExecutableConsistency();
 return {version:V51_PROTOCOL,pairs:8,siblings:16,...x,modelCalls:0};
}

export function deliveryContractV51(){
 const h=sha256(V51_METHOD);return {version:V51_PROTOCOL,methodHash:h,arms:V51_FORMAL_ARMS.map(id=>({id,semantics:id==='A0'?null:h,channel:id==='A0'?'plain task prompt':id==='A1'?'user prompt':id==='A2'?'candidate AGENTS.md':'candidate-visible skill plus explicit invocation directive'}))};
}
export function calibrationPromptV51(task,arm){
 if(!V51_CALIBRATION_ARMS.includes(arm))throw Error('V5.1 calibration allows A0/A1 only');
 const scope=`\n\nVisible scope: edit only ${targetList(task).join(' and ')}.`;
 return arm==='A0'?task.task+scope:`${task.task}${scope}\n\nEngineering method:\n${V51_METHOD}`;
}
export function v51CalibrationPlan(seed=V51_SEED){
 const cells=loadV51Manifest().pairs.flatMap(p=>V51_CALIBRATION_ARMS.flatMap(arm=>Array.from({length:V51_TRIALS},(_,i)=>({version:V51_PROTOCOL,pairId:p.id,taskId:p.calibration.id,siblingRole:'calibration',arm,trial:i+1,seed:Number(seed)}))));
 return seededShuffle(cells,Number(seed)).map((c,i)=>({...c,ordinal:i+1,cellId:`${String(i+1).padStart(3,'0')}-${c.taskId}-${c.arm}-trial-${c.trial}`}));
}
export function validateV51CalibrationPlan(cells){
 if(!Array.isArray(cells)||cells.length!==32)throw Error('V5.1 calibration plan must contain exactly 32 cells');
 const cal=new Set(loadV51Manifest().pairs.map(p=>p.calibration.id)),formal=new Set(loadV51Manifest().pairs.map(p=>p.formal.id));
 const keys=cells.map(c=>`${c.taskId}|${c.arm}|${c.trial}`);
 if(new Set(keys).size!==32||new Set(cells.map(c=>c.cellId)).size!==32)throw Error('duplicate V5.1 calibration cells');
 if(cells.some(c=>!cal.has(c.taskId)||formal.has(c.taskId)||c.siblingRole!=='calibration'||!V51_CALIBRATION_ARMS.includes(c.arm)||![1,2].includes(c.trial)))throw Error('formal/invalid cell in V5.1 calibration');
 return true;
}
export function selectFormalPairsV51(outcomes){
 const reg=validateV51Registry(),ranked=[];
 for(const [index,p] of loadV51Manifest().pairs.entries()){
  const vals=['A0','A1'].flatMap(a=>[1,2].map(t=>outcomes?.[p.id]?.[a]?.[t]));
  if(vals.some(x=>!['pass','fail'].includes(x)))continue;
  const successes=vals.filter(x=>x==='pass').length;
  if(successes>=reg.selectionPolicy.qualifyCombinedSuccessMin&&successes<=reg.selectionPolicy.qualifyCombinedSuccessMax)ranked.push({pair:p,index,successes,distance:Math.abs(successes-2)});
 }
 ranked.sort((a,b)=>a.distance-b.distance||a.index-b.index);
 if(ranked.length<reg.selectionPolicy.requiredQualifiedPairs)return {status:'stop',reason:'insufficient-qualified-pairs',qualifiedPairIds:ranked.map(x=>x.pair.id),selectedPairIds:[],formalTaskIds:[]};
 const selected=ranked.slice(0,6);return {status:'selected',reason:'treatment-blind-difficulty-policy',qualifiedPairIds:ranked.map(x=>x.pair.id),selectedPairIds:selected.map(x=>x.pair.id),formalTaskIds:selected.map(x=>x.pair.formal.id)};
}

async function hashFile(f){return sha256(await fs.readFile(f));}
export async function freezeV51(out=path.join(root,'v51-scaffold-freeze.json')){
 const validation=await validateV51Corpus(),configFile='config/adapter.codex-luna.vm.json',config=loadJson(path.resolve(root,configFile));
 const files=['dataset-v51/manifest.json','registry/benchmark-v51.json','schemas/benchmark-v51.schema.json','docs/AGENT_QUALITY_BENCHMARK_V5_1.md','docs/experiments/V5-calibration-retrospective.md','docs/BENCHMARK_PROTOCOL.md','package.json','src/benchmark-v51.mjs','src/hash.mjs','src/pilot.mjs','src/registry.mjs','src/codex-luna-adapter.mjs','src/execute.mjs','scripts/v51-run-cases.mjs','scripts/v51-calibrate.mjs',configFile];
 files.push(...(await walk(path.join(root,'dataset-v51'))).map(f=>path.relative(root,f)));
 const entries=[];for(const f of [...new Set(files)].sort())entries.push({file:f,sha256:await hashFile(path.resolve(root,f))});
 const m={version:V51_PROTOCOL,pairs:loadV51Manifest().pairs.map(p=>p.id),siblings:v51Tasks().map(t=>t.id),methodHash:sha256(V51_METHOD),delivery:deliveryContractV51(),selectionPolicy:loadJson(v51RegistryFile).selectionPolicy,adapter:{file:configFile,sha256:await hashFile(path.resolve(root,configFile)),model:config.model,reasoningEffort:config.reasoningEffort,cliVersion:config.cliVersion},validation,entries,manifestSha256:sha256(entries)};
 await fs.writeFile(out,JSON.stringify(m,null,2)+'\n');return m;
}
export async function verifyV51Freeze(file=path.join(root,'v51-scaffold-freeze.json')){
 const e=loadJson(file);if(e.version!==V51_PROTOCOL||e.methodHash!==sha256(V51_METHOD)||e.manifestSha256!==sha256(e.entries)||JSON.stringify(e.delivery)!==JSON.stringify(deliveryContractV51()))throw Error('invalid V5.1 freeze manifest');
 const tmp=path.join(path.dirname(file),`.v51-freeze-${process.pid}.json`),a=await freezeV51(tmp);await fs.rm(tmp,{force:true});
 if(sha256(e.entries)!==sha256(a.entries)||JSON.stringify(e.selectionPolicy)!==JSON.stringify(a.selectionPolicy))throw Error('V5.1 frozen input mismatch');return true;
}

const args=argv=>{const o={};for(let i=2;i<argv.length;i++)if(argv[i].startsWith('--'))o[argv[i].slice(2)]=argv[++i]??true;return o};
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 const a=args(process.argv),fail=e=>{console.error(`ERROR: ${e.message}`);process.exitCode=1};
 if(a.validate)validateV51Corpus().then(x=>console.log(JSON.stringify(x,null,2))).catch(fail);
 else if(a.plan){const cells=v51CalibrationPlan(Number(a.seed??V51_SEED));validateV51CalibrationPlan(cells);const d=path.resolve(a.plan);fs.mkdir(d,{recursive:true}).then(()=>fs.writeFile(path.join(d,'plan.json'),JSON.stringify({version:V51_PROTOCOL,seed:Number(a.seed??V51_SEED),cells,planHash:sha256(cells)},null,2)+'\n')).then(()=>console.log(JSON.stringify({version:V51_PROTOCOL,cells:32,modelCalls:0},null,2))).catch(fail)}
 else if(a.freeze)freezeV51(path.resolve(a.freeze)).then(x=>console.log(JSON.stringify({version:x.version,entries:x.entries.length,manifestSha256:x.manifestSha256,modelCalls:0},null,2))).catch(fail);
 else if(a.verify)verifyV51Freeze(path.resolve(a.verify)).then(()=>console.log('V5.1 scaffold freeze verified; model calls: 0')).catch(fail);
}
