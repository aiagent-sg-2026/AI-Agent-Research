import test from 'node:test';import assert from 'node:assert/strict';import {createCatalogPageMerge} from '../src/solution.mjs';
test('one page keeps item order',()=>{const x=createCatalogPageMerge();x.mergePage({cursor:'c1',nextCursor:null,items:[{id:'a',value:1},{id:'b',value:2}]});assert.deepEqual(x.items(),[{id:'a',value:1},{id:'b',value:2}])});
