import assert from 'node:assert/strict'; const { calculateInvoiceTotal } = await import(new URL('file://' + process.argv[2] + '/src/invoice.mjs'));
assert.equal(calculateInvoiceTotal([{quantity:1,unitPrice:0.05},{quantity:1,unitPrice:0.05}], .1), .12);
assert.equal(calculateInvoiceTotal([{quantity:1,unitPrice:10}], .1, 1), 10); console.log('PASS');
