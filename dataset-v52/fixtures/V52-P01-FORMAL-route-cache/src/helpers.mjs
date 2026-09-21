export const routeKey=(route,revision)=>`${route}@${revision}`;
export const copy=(xs)=>xs.map(x=>({...x}));
