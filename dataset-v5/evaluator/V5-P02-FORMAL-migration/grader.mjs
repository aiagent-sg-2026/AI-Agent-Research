import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export const assertions=[{"id": "H1", "ruleIds": ["C1", "C2"]}, {"id": "H2", "ruleIds": ["C3", "C4"]}, {"id": "H3", "ruleIds": ["C3", "C5"]}];
export const coveredRuleIds=["C1", "C2", "C3", "C4", "C5"];
export async function grade(root){const u=pathToFileURL(root+'/src/solution.mjs');u.searchParams.set('v',String(Date.now())+Math.random());const m=await import(u.href);
let ran=[],undone=[];let d={execute:async s=>ran.push(s.key),undo:async s=>undone.push(s.key)};assert.deepEqual(await m.runUpgrade([{key:'a'},{key:'a'},{key:'b'}],d),{status:'committed',completed:2});assert.deepEqual(ran,['a','b']);ran=[];undone=[];d={execute:async s=>{ran.push(s.key);if(s.key==='c')throw Error('stop')},undo:async s=>undone.push(s.key)};assert.deepEqual(await m.runUpgrade([{key:'a'},{key:'b'},{key:'c'},{key:'d'}],d),{status:'rolled-back',completed:2,cause:'stop',undoErrors:[]});assert.deepEqual(undone,['b','a']);d={execute:async s=>{if(s.key==='b')throw Error('exec')},undo:async()=>{throw Error('undo2')}};assert.deepEqual(await m.runUpgrade([{key:'a'},{key:'b'}],d),{status:'rolled-back',completed:1,cause:'exec',undoErrors:['undo2']});
}
