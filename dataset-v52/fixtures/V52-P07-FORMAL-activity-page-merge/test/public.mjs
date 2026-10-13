import test from 'node:test';import assert from 'node:assert/strict';import {createActivityPageMerge} from '../src/solution.mjs';
test('one page keeps entry order',()=>{const x=createActivityPageMerge();x.acceptPage({cursor:'c1',nextCursor:null,entries:[{eventId:'a',payload:1},{eventId:'b',payload:2}]});assert.deepEqual(x.timeline(),[{eventId:'a',payload:1},{eventId:'b',payload:2}])});
