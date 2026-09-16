import assert from 'node:assert/strict';
import { canApprove } from '../src/approval.mjs';
assert.equal(canApprove({permissions:['approve:expense']},{type:'expense'}), true);
