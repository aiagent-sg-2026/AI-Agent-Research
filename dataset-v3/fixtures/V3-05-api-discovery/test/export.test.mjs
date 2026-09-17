import test from 'node:test'; import assert from 'node:assert/strict'; import { exportRows } from '../src/export.mjs';
test('exportRows remains exported', () => assert.equal(typeof exportRows, 'function'));
