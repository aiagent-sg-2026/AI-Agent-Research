import fs from 'node:fs';
const promptFile=process.argv[2];
if (!promptFile) { console.error('missing prompt file'); process.exit(2); }
const prompt=fs.readFileSync(promptFile,'utf8');
console.log(JSON.stringify({ok:true, observed:prompt.includes('sample-task')?'sample-task':'prompt-read'}));
