import assert from 'node:assert/strict';
import { calculateInvoiceTotal } from '../src/invoice.mjs';
assert.equal(typeof calculateInvoiceTotal([{quantity:1,unitPrice:10}], .1), 'number');
