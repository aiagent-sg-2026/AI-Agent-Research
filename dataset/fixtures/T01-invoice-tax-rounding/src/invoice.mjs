export function calculateInvoiceTotal(lines, taxRate, discount = 0) {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const tax = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * taxRate, 0);
  return Number((subtotal - discount + tax).toFixed(2));
}
