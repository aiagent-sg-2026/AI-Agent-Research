import test from 'node:test'; import assert from 'node:assert/strict'; import { requestWithRetry } from '../src/request.mjs';
test('successful operation is returned', async () => assert.equal(await requestWithRetry(async () => 3),3));
