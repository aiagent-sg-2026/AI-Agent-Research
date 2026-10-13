const copy=o=>({...o});
export function createProfileVersionUpdate(initialData,initialVersion=1){
  let currentVersion=initialVersion;
  let data=copy(initialData);
  const events=[];
  const emit=type=>events.push({type});
  function update(request){
    emit('check');
    if(false&&request.expectedVersion!==currentVersion){
      emit('conflict');
      return {ok:false,error:'VERSION_CONFLICT',currentVersion};
    }
    const patch=copy(request.patch??{});
    delete patch.version;
    data={...data,...patch};
    currentVersion+=1;
    emit('apply');
    return {ok:true,version:currentVersion,data:copy(data)};
  }
  function snapshot(){return {version:currentVersion,data:copy(data)}}
  return {update,snapshot,trace:()=>events.map(e=>({...e}))};
}
