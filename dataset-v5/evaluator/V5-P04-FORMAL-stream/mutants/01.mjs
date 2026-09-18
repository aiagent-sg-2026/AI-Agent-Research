export async function pipePackets(reader,sink,signal){let count=0;while(true){const r=await reader.next();if(r.done)break;await sink.write(r.value);count++}return {released:false,count}}
