import { memberDiscount, roundCurrency } from './discount.mjs';
import { applyTax } from './tax.mjs';
export function total(order) { const subtotal = order.items.reduce((n,x)=>n+x.price*x.quantity,0); return roundCurrency(applyTax(subtotal, order.taxRate, order.taxExempt)); }
