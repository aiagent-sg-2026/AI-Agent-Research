import assert from 'node:assert/strict'; const { canApprove } = await import(new URL('file://' + process.argv[2] + '/src/approval.mjs'));
assert.equal(canApprove({departments:[{id:'finance',roles:['approver']}]},{type:'expense',department:'finance'}), true);
assert.equal(canApprove({departments:[{id:'sales',roles:['approver']}]},{type:'expense',department:'finance'}), false);
assert.equal(canApprove({departments:[],permissions:['approve:expense']},{type:'expense',department:'finance'}), true);
assert.equal(canApprove({departments:[{id:'finance',roles:['approver']}],permissions:[],denied:['approve']},{type:'expense',department:'finance'}), false); console.log('PASS');
