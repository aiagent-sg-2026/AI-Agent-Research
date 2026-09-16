import assert from 'node:assert/strict';
import { reserve } from '../src/inventory.mjs';
assert.deepEqual(reserve({available:3}, 1), {ok:true, remaining:2});
