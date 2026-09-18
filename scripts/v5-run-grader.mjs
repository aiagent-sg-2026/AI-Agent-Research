import {pathToFileURL} from 'node:url';
const [graderFile,candidateRoot]=process.argv.slice(2);
if(!graderFile||!candidateRoot)throw Error('grader file and candidate root are required');
const grader=await import(pathToFileURL(graderFile).href+'?run='+Date.now());
await grader.grade(candidateRoot);
