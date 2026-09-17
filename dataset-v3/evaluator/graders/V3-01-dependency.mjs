import assert from 'node:assert/strict';
const root=process.argv[2]; const {total}=await import(`file://${root}/src/order.mjs?grader=${Date.now()}`);
assert.equal(total({items:[{price:100,quantity:1}],member:true,taxRate:.2,taxExempt:false}),108);
assert.equal(total({items:[{price:100,quantity:1}],member:true,taxRate:.2,taxExempt:true}),90);
assert.equal(total({items:[{price:12.5,quantity:2}],member:false,taxRate:.1,taxExempt:false}),27.5);
assert.equal(total({items:[{price:19.99,quantity:3}],member:true,taxRate:.0825,taxExempt:false}),58.43);
