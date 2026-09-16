import fs from 'node:fs/promises';
import path from 'node:path';
import { loadJson, validateRegistry, root, protocolFile, baselineFile } from './registry.mjs';
import { buildPrompt } from './prompt.mjs';
import { sha256 } from './hash.mjs';
import { executeAdapter, writeCapture } from './execute.mjs';

function prng(seed) { let x = (Number(seed) >>> 0) || 1; return () => (x = Math.imul(1664525, x) + 1013904223 >>> 0) / 2 ** 32; }
function shuffle(a, seed) { const r = prng(seed); for (let i=a.length-1;i>0;i--) { const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function args(argv) { const o={protocols:'all',arms:'B0,B1,B2,FULL',trials:3,seed:1,out:'out',adapter:'config/adapter.example.json'}; for(let i=2;i<argv.length;i++){const x=argv[i]; if(x==='--dry-run')o.dryRun=true; else if(x.startsWith('--'))o[x.slice(2)]=argv[++i];} return o; }
export async function plan(task, opts) {
  const reg=validateRegistry(), selected=opts.protocols==='all'?reg.protocols:String(opts.protocols).split(',').map(id=>reg.protocols.find(p=>p.id===id)).filter(Boolean), arms=String(opts.arms).split(',');
  if (arms.some(arm => !['B0','B1','B2','FULL'].includes(arm))) throw new Error('unknown arm');
  if (!selected.length || selected.length !== (opts.protocols==='all'?20:String(opts.protocols).split(',').length)) throw new Error('unknown protocol selection');
  const cells=[]; for(const p of selected) for(const arm of arms) for(let trial=1;trial<=Number(opts.trials);trial++) cells.push({taskId:task.id,protocolId:p.id,arm,trial,seed:Number(opts.seed)});
  return shuffle(cells, Number(opts.seed));
}
export async function run(argv=process.argv) {
  const opts=args(argv); if(!opts.task) throw new Error('--task is required');
  const task=loadJson(path.resolve(opts.task)), cells=await plan(task,opts), out=path.resolve(opts.out), config=loadJson(path.resolve(opts.adapter));
  await fs.mkdir(out,{recursive:true}); const hashes={taskHash:sha256(task),protocolHash:sha256(loadJson(protocolFile)),baselineHash:sha256(loadJson(baselineFile)),configHash:sha256(config)};
  if(opts.dryRun){const result={version:'0.1',seed:Number(opts.seed),cells,planHash:sha256(cells),hashes}; await fs.writeFile(path.join(out,'plan.json'),JSON.stringify(result,null,2)); console.log(JSON.stringify(result,null,2)); return result;}
  const reg=validateRegistry();
  for(let index=0; index<cells.length; index++){const c=cells[index], p=reg.protocols.find(x=>x.id===c.protocolId), dir=path.join(out,`${String(index+1).padStart(4,'0')}-${c.protocolId}-${c.arm}-trial${c.trial}`); await fs.mkdir(dir,{recursive:true}); const prompt=buildPrompt(task,p,c.arm), promptFile=path.join(dir,'prompt.txt'); await fs.writeFile(promptFile,prompt); const manifest={version:'0.1',taskId:task.id,protocolId:p.id,arm:c.arm,trial:c.trial,seed:c.seed,promptHash:sha256(prompt),taskHash:hashes.taskHash,protocolHash:hashes.protocolHash,configHash:hashes.configHash,startedAt:new Date().toISOString(),execution:{},forbiddenPromptInputs:['evaluator','hidden answer','expected patch','competitor output','prior trial outcomes']};
    const result=await executeAdapter(config,{repoRoot:root,runDir:dir,promptFile,taskFile:path.resolve(opts.task),taskId:task.id,protocolId:p.id,arm:c.arm,trial:String(c.trial)}); manifest.execution={...result,finishedAt:new Date().toISOString()}; await fs.writeFile(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)); await writeCapture(dir,result);
  } return {cells};
}
if (process.argv[1] && path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)) run().catch(e=>{console.error(`ERROR: ${e.message}`);process.exitCode=1;});
