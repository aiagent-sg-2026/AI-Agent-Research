import test from 'node:test'; import assert from 'node:assert/strict'; import { summarizeReport } from '../src/report.mjs';
test('legacy report remains supported', () => assert.deepEqual(summarizeReport({title:'x',values:[1,2]}),{title:'x',lines:['summary: 3']}));
