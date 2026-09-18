export function normalizeItem(v){if(!v||typeof v!=='object')return null;return {sku:v.sku,qty:v.qty,enabled:v.enabled}}
