export function applyTax(amount, rate, exempt = false) { return exempt ? amount : amount * (1 + rate); }
