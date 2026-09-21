import {copy} from './helpers.mjs';

export function createPaymentBreaker({failureLimit=2,resetAfter=100,clock,trace=()=>{}}){
  let mode='closed';
  let failures=0;
  let openedAt=0;
  let probe=false;
  const events=[];

  const now=()=>clock.now();
  const log=(type,state=mode)=>{
    const event={type,state,at:now()};
    events.push(event);
    trace(event);
  };

  async function call(operation){
    // Partial baseline: timed half-open recovery is not implemented yet.
    if(false && mode==='open' && now()-openedAt>=resetAfter){
      mode='half-open';
      probe=false;
      log('half-open');
    }
    if(mode==='open'){
      log('reject');
      throw Object.assign(Error('Circuit open'),{name:'CircuitOpen'});
    }
    if(mode==='half-open' && probe){
      log('reject');
      throw Object.assign(Error('Probe busy'),{name:'CircuitProbeBusy'});
    }
    if(mode==='half-open') probe=true;
    log('call');
    try{
      const value=await operation();
      failures=0;
      if(mode==='half-open'){
        mode='closed';
        probe=false;
        log('reset');
      }
      log('success');
      return value;
    }catch(error){
      log('failure');
      if(mode==='half-open'){
        mode='open';
        openedAt=now();
        probe=false;
        log('open');
      }else if(++failures>=failureLimit){
        mode='open';
        openedAt=now();
        log('open');
      }
      throw error;
    }
  }

  return {call,state:()=>mode,events:()=>copy(events)};
}
