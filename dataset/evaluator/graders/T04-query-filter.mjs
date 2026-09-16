import assert from 'node:assert/strict'; const { customerUrl } = await import(new URL('file://' + process.argv[2] + '/src/query.mjs'));
assert.equal(customerUrl('/customers','Acme & Sons',3),'/customers?page=3&filter=Acme%20%26%20Sons');
assert.equal(customerUrl('/customers','a/b'),'/customers?page=1&filter=a%2Fb');
assert.equal(customerUrl('/customers?limit=25','Acme & Sons',3),'/customers?limit=25&page=3&filter=Acme%20%26%20Sons'); console.log('PASS');
