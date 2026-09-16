import assert from 'node:assert/strict';
import { retryDelay } from '../src/retry.mjs';
assert.equal(retryDelay(0), 100);
