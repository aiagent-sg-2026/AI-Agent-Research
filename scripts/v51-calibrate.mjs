import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {executeAdapter} from '../src/execute.mjs';
import {loadJson,root} from '../src/registry.mjs';
import {sha256} from '../src/hash.mjs';
import {
  V51_METHOD,loadV51Manifest,v51CalibrationPlan,validateV51CalibrationPlan,
  calibrationPromptV51,scopeCompliantV51,selectFormalPairsV51,verifyV51Freeze
} from '../src/benchmark-v51.mjs';

const PROTOCOL='AQB-V5.1-CALIBRATED-001',SEED=20260920;
const cmd=(exe,args,cwd,timeoutMs=15000)=>new Promise(resolve=>{
  const c=spawn(exe,args,{cwd,shell:false});let stdout='',stderr='',timedOut=false,done=false;
  const finish=x=>{if(done)return;done=true;clearTimeout(timer);resolve({...x,stdout,stderr,timedOut})};
  const timer=setTimeout(()=>{timedOut=true;c.kill('SIGTERM');setTimeout(()=>c.kill('SIGKILL'),150)},timeoutMs);
  c.stdout.on('data',b=>stdout+=b);c.stderr.on('data',b=>stderr+=b);
  c.on('error',e=>finish({code:null,error:e.message}));c.on('close',(code,signal)=>finish({code,signal}));
});
const changedFiles=async w=>(await cmd('git',['status','--short','--untracked-files=all'],w)).stdout
  .split('\n').filter(Boolean).map(x=>x.slice(3).replace(/ -> .*/,'').trim()).filter(Boolean).sort();
const tasks=()=>new Map(loadV51Manifest().pairs.map(p=>[p.calibration.id,p.calibration]));

async function runCell(cell,out,adapter){
  const task=tasks().get(cell.taskId);if(!task)throw Error('unknown V5.1 calibration task '+cell.taskId);
  const dir=path.join(out,'cells',cell.cellId),w=path.join(dir,'candidate');
  await fs.mkdir(dir,{recursive:true});await fs.cp(path.resolve(root,task.fixture),w,{recursive:true,errorOnExist:true});
  for(const args of [['init','-q'],['config','user.email','aqb@example.invalid'],['config','user.name','AQB'],['add','.'],['commit','-qm','baseline']])await cmd('git',args,w);
  const pf=path.join(dir,'prompt.txt');await fs.writeFile(pf,calibrationPromptV51(task,cell.arm));
  const ex=await executeAdapter(adapter,{repoRoot:w,candidateRoot:w,runDir:dir,promptFile:pf,taskId:task.id,protocolId:PROTOCOL,arm:cell.arm,trial:String(cell.trial)},{timeoutMs:120000});
  const vis=await cmd(process.execPath,['--test','test/public.mjs'],w,10000);
  const hid=await cmd(process.execPath,[path.join(root,'scripts/v51-run-cases.mjs'),path.resolve(root,task.driver),path.resolve(root,task.cases),w],root,5000);
  const files=await changedFiles(w),scope=scopeCompliantV51(task,files),diff=await cmd('git',['diff','--binary','HEAD'],w);
  const infra=Boolean(ex.infrastructureError||ex.timedOut||vis.timedOut||hid.timedOut);
  const hiddenAcceptance=!infra&&hid.code===0;
  const success=!infra&&vis.code===0&&hiddenAcceptance&&scope;
  const metric={...cell,success,hiddenAcceptance,infrastructureInvalid:infra,
    failureClass:success?null:infra?'INFRASTRUCTURE_INVALID':!scope?'SCOPE_VIOLATION':vis.code!==0?'REGRESSION':'TASK_LOGIC',
    visibleTests:{passed:vis.code===0,code:vis.code},allowedScope:{allowedTarget:task.allowedTarget,changedFiles:files,compliant:scope},
    regressionFree:vis.code===0,methodHash:cell.arm==='A1'?sha256(V51_METHOD):null,
    provenance:ex.provenance??null,tokens:ex.tokenUsage??null,latencyMs:ex.durationMs??null,retries:ex.retries??0,diffBytes:Buffer.byteLength(diff.stdout)};
  await fs.writeFile(path.join(dir,'metrics.json'),JSON.stringify(metric,null,2)+'\n');
  await fs.writeFile(path.join(dir,'diff.patch'),diff.stdout);
  console.log(JSON.stringify({cellId:cell.cellId,success,failureClass:metric.failureClass,tokens:metric.tokens?.totalTokens??null}));
  return metric;
}

const out=path.resolve(process.argv[2]??'v51-calibration-out');
await verifyV51Freeze(path.join(root,'v51-scaffold-freeze.json'));
if(existsSync(out)&&(await fs.readdir(out)).length)throw Error('V5.1 calibration output must be empty');
const plan=v51CalibrationPlan(SEED);validateV51CalibrationPlan(plan);
await fs.mkdir(path.join(out,'cells'),{recursive:true});
await fs.writeFile(path.join(out,'plan.json'),JSON.stringify({version:PROTOCOL,seed:SEED,cells:plan,planHash:sha256(plan)},null,2)+'\n');
const adapter=loadJson(path.join(root,'config/adapter.codex-luna.vm.json')),metrics=[];
for(const cell of plan)metrics.push(await runCell(cell,out,adapter));

const outcomes={};
for(const p of loadV51Manifest().pairs){
  outcomes[p.id]={A0:{},A1:{}};
  for(const arm of ['A0','A1'])for(const trial of [1,2]){
    const m=metrics.find(x=>x.pairId===p.id&&x.arm===arm&&x.trial===trial);
    outcomes[p.id][arm][trial]=m.infrastructureInvalid?'invalid':m.success?'pass':'fail';
  }
}
const selection=selectFormalPairsV51(outcomes);
const perPair=Object.fromEntries(loadV51Manifest().pairs.map(p=>{
  const cells=metrics.filter(x=>x.pairId===p.id),successes=cells.filter(x=>x.success).length;
  return [p.id,{successes,cells:4,difficultyBand:successes===0?'floor':successes===4?'ceiling':'middle',
    A0:cells.filter(x=>x.arm==='A0'&&x.success).length+'/2',A1:cells.filter(x=>x.arm==='A1'&&x.success).length+'/2'}];
}));
const summary={version:PROTOCOL,cells:metrics.length,uniqueCells:new Set(metrics.map(x=>x.cellId)).size,
  infrastructureInvalid:metrics.filter(x=>x.infrastructureInvalid).length,outcomes,perPair,selection,
  arms:Object.fromEntries(['A0','A1'].map(a=>[a,{successes:metrics.filter(x=>x.arm===a&&x.success).length,cells:16}])),
  provenanceComplete:metrics.filter(x=>!x.infrastructureInvalid).every(x=>x.provenance?.verified===true&&x.provenance?.model==='gpt-5.6-luna'&&x.provenance?.effort==='medium'&&x.provenance?.cliVersion==='0.153.4'),
  tokenTelemetryCount:metrics.filter(x=>Number.isFinite(x.tokens?.totalTokens)).length,
  observedTotalTokens:metrics.filter(x=>Number.isFinite(x.tokens?.totalTokens)).reduce((s,x)=>s+x.tokens.totalTokens,0)};
await fs.writeFile(path.join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
