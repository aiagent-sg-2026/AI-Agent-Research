import assert from 'node:assert/strict';
const root=process.argv[2]; const {summarizeReport}=await import(`file://${root}/src/report.mjs?grader=${Date.now()}`);
assert.deepEqual(summarizeReport({title:'q',sections:[{name:'b',values:[4]},{name:'a',values:[1,2]},{name:'empty',values:[]}]}),{title:'q',lines:['b: 4','a: 3','empty: 0']});
assert.deepEqual(summarizeReport({title:'x',values:[1,2]}),{title:'x',lines:['summary: 3']});
assert.deepEqual(summarizeReport({title:'zero',values:[]}),{title:'zero',lines:['summary: 0']});
