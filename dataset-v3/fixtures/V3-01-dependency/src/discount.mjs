export function memberDiscount(subtotal, member) { return member ? subtotal * 0.9 : subtotal; }
export function roundCurrency(amount) { return Math.round((amount + Number.EPSILON) * 100) / 100; }
