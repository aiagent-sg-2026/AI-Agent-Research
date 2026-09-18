export function createJournal() { const ids=[]; return {seen:id=>ids.includes(id),record:id=>ids.push(id),count:()=>ids.length,reverse:()=>ids.slice().reverse()}; }
