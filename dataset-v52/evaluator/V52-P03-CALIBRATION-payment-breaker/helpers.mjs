export const copy=xs=>xs.map(x=>({...x}));
export const error=(name,message)=>Object.assign(Error(message),{name});
