export async function runUpgrade(steps,driver){
  const seen=new Set(),done=[];
  try{
    for(const s of steps){if(seen.has(s.key))continue;seen.add(s.key);await driver.execute(s);done.push(s)}
    return {status:'committed',completed:done.length};
  }catch(e){
    const undoErrors=[];
    for(const s of [...done].reverse()) {
      try { await driver.undo(s); } catch(x) { throw x; }
    }
    return {status:'rolled-back',completed:done.length,cause:String(e.message??e),undoErrors};
  }
}
