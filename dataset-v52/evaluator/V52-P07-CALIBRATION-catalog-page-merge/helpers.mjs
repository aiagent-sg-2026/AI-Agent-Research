export const copy=xs=>xs.map(x=>typeof x==='object'&&x!==null?{...x}:x);
