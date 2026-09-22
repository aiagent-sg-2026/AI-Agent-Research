export async function runCase(factory,c){const x=factory(),states=[],errors=[];const tr=()=>x.trace().map(e=>e.type);const cfg={failStage:null,failSend:null,failRollback:null};const transport={stage:async i=>{if(cfg.failStage===i.id)throw Error('STAGE_FAIL')},send:async i=>{if(cfg.failSend===i.id)throw Error('SEND_FAIL')},rollback:async i=>{if(cfg.failRollback===i.id)throw Error('ROLLBACK_FAIL')}};let value='ok';
const snap=()=>states.push(x.pending().length?x.pending().join(','):'empty');
if(c.kind==='dedupe'){x.enqueue('a',1);x.enqueue('a',2);snap();value='dedupe'}
else if(c.kind==='success'){x.enqueue('a',1);x.enqueue('b',2);await x.flush(transport);snap()}
else if(c.kind==='stage-fail'){x.enqueue('a',1);x.enqueue('b',2);cfg.failStage='b';try{await x.flush(transport)}catch(e){errors.push(e.message,...(e.rollbackErrors||[]))}snap();value='ERR'}
else if(c.kind==='send-fail'){x.enqueue('a',1);x.enqueue('b',2);cfg.failSend='b';try{await x.flush(transport)}catch(e){errors.push(e.message,...(e.rollbackErrors||[]))}snap();value='ERR'}
else if(c.kind==='rollback-fail'){x.enqueue('a',1);x.enqueue('b',2);cfg.failSend='a';cfg.failRollback='b';try{await x.flush(transport)}catch(e){errors.push(e.message,...(e.rollbackErrors||[]))}snap();value='ERR'}
else{x.enqueue('a',1);cfg.failSend='a';try{await x.flush(transport)}catch(e){errors.push(e.message)}cfg.failSend=null;await x.flush(transport);snap()}
return {return:{value},observations:{states,errors,trace:tr()}}}
