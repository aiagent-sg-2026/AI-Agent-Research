import assert from 'node:assert/strict';
import { customerUrl } from '../src/query.mjs';
assert.equal(customerUrl('/customers','active'), '/customers?page=1&filter=active');
