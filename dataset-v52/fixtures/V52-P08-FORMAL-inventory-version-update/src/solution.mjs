import {copy} from './helpers.mjs';
export function createInventoryVersionUpdate(initialData,initialVersion=1){
  let currentVersion=initialVersion;
  let data=copy(initialData);
  const events=[];
  const emit=type=>events.push({type});
  function commit(request){
    emit('check');
    if(request.expectedVersion!==currentVersion){
      const stalePatch=copy(request.patch??{});
      delete stalePatch.revision;
      data={...data,...stalePatch};
      emit('conflict');
      return {ok:false,error:'VERSION_CONFLICT',currentVersion};
    }
    const patch=copy(request.patch??{});
    delete patch.revision;
    data={...data,...patch};
    currentVersion+=1;
    emit('apply');
    return {ok:true,version:currentVersion,data:copy(data)};
  }
  function read(){return {version:currentVersion,data:copy(data)}}
  return {commit,read,trace:()=>events.map(e=>({...e}))};
}
