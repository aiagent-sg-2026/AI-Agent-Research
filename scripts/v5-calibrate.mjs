import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {executeAdapter} from '../src/execute.mjs';
import {loadJson,root} from '../src/registry.mjs';
import {sha256} from '../src/hash.mjs';
import {loadV5Manifest,v5CalibrationPlan,validateV5CalibrationPlan,calibrationPrompt,scopeCompliantV5,selectFormalPairs,verifyV5Freeze,V5_METHOD} from '../src/benchmark-v5.mjs';

const cmd=(exe,args,cwd,timeoutMs=15000)=>new Promise(resolve=>{const c=spawn(exe,args,{cwd,shell:false});let stdout='',stderr='',timedOut=false;const timer=setTimeout(()=>{timedOut=true;c.kill('SIGTERM');setTimeout(()=>c.kill('SIGKILL'),100)},timeoutMs);c.stdout.on('data',b=>stdout+=b);c.stderr.on('data',b=>stderr+=b);c.on('error',e=>resolve({code:null,error:e.message,stdout,stderr,timedOut}));c.on('close',code=>{clearTimeout(timer);resolve({code,stdout,stderr,timedOut})})});
const changedFiles=async w=>(await cmd('git',['status','--short','--untracked-files=all'],w)).stdout.split('\n').filter(Boolean).map(x=>x.slice(3).replace(/ -> .*/,'').trim()).filter(Boolean).sort();
const taskMap=()=>new Map(loadV5Manifest().pairs.map(p=>[p.calibration.id,p.calibration]));

async function runCell(cell,out,adapter){
 const task=taskMap().get(cell.taskId);if(!task)throw Error('unknown calibration task '+cell.taskId);
 const dir=path.join(out,'cells',cell.cellId),w=path.join(dir,'candidate');await fs.mkdir(dir,{recursive:true});await fs.cp(path.resolve(root,task.fixture),w,{recursive:true,errorOnExist:true});
 await cmd('git',['init','-q'],w);await cmd('git',['config','user.email','aqb@example.invalid'],w);await cmd('git',['config','user.name','AQB'],w);await cmd('git',['add','.'],w);await cmd('git',['commit','-qm','baseline'],w);
 const pf=path.join(dir,'prompt.txt');await fs.writeFile(pf,calibrationPrompt(task,cell.arm));
 const ex=await executeAdapter(adapter,{repoRoot:w,candidateRoot:w,runDir:dir,promptFile:pf,taskId:task.id,protocolId:'AQB-V5-CALIBRATED-001',arm:cell.arm,trial:'1'},{timeoutMs:120000});
 const vis=await cmd(process.execPath,['--test','test/public.mjs'],w);
 const hid=await cmd(process.execPath,[path.join(root,'scripts/v5-run-grader.mjs'),path.resolve(root,task.grader),w],root,5000);
 const files=await changedFiles(w),scope=scopeCompliantV5(task,files),diff=await cmd('git',['diff','--binary','HEAD'],w);
 const infra=Boolean(ex.infrastructureError||ex.timedOut||vis.timedOut||hid.timedOut),hiddenAcceptance=!infra&&hid.code===0,success=!infra&&vis.code===0&&hiddenAcceptance&&scope;
 const metric={...cell,success,hiddenAcceptance,infrastructureInvalid:infra,failureClass:success?null:infra?'INFRASTRUCTURE_INVALID':!scope?'SCOPE_VIOLATION':vis.code!==0?'REGRESSION':'TASK_LOGIC',visibleTests:{passed:vis.code===0,code:vis.code},allowedScope:{allowedTarget:task.allowedTarget,changedFiles:files,compliant:scope},regressionFree:vis.code===0,methodHash:cell.arm==='A1'?sha256(V5_METHOD):null,provenance:ex.provenance??null,tokens:ex.tokenUsage??null,latencyMs:ex.durationMs??null,retries:ex.retries??0,diffBytes:Buffer.byteLength(diff.stdout)};
 await fs.writeFile(path.join(dir,'metrics.json'),JSON.stringify(metric,null,2)+'\n');await fs.writeFile(path.join(dir,'diff.patch'),diff.stdout);console.log(JSON.stringify({cellId:cell.cellId,success,failureClass:metric.failureClass}));return metric;
}

const out=path.resolve(process.argv[2]??'v5-calibration-out');
await verifyV5Freeze(path.join(root,'v5-scaffold-freeze.json'));
if(existsSync(out)&&(await fs.readdir(out)).length)throw Error('calibration output must be empty');
const plan=v5CalibrationPlan(20260919);validateV5CalibrationPlan(plan);await fs.mkdir(path.join(out,'cells'),{recursive:true});await fs.writeFile(path.join(out,'plan.json'),JSON.stringify({version:'AQB-V5-CALIBRATED-001',seed:20260919,cells:plan,planHash:sha256(plan)},null,2)+'\n');
const adapter=loadJson(path.join(root,'config/adapter.codex-luna.vm.json')),metrics=[];for(const cell of plan)metrics.push(await runCell(cell,out,adapter));
const outcomes={};for(const p of loadV5Manifest().pairs){outcomes[p.id]={};for(const arm of ['A0','A1']){const m=metrics.find(x=>x.pairId===p.id&&x.arm===arm);outcomes[p.id][arm]=m.infrastructureInvalid?'invalid':m.success?'pass':'fail'}}
const selection=selectFormalPairs(outcomes),summary={version:'AQB-V5-CALIBRATED-001',cells:metrics.length,uniqueCells:new Set(metrics.map(x=>x.cellId)).size,infrastructureInvalid:metrics.filter(x=>x.infrastructureInvalid).length,outcomes,selection,arms:Object.fromEntries(['A0','A1'].map(a=>[a,{successes:metrics.filter(x=>x.arm===a&&x.success).length,cells:8}])),tokenTelemetryCount:metrics.filter(x=>Number.isFinite(x.tokens?.totalTokens)).length};
await fs.writeFile(path.join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
