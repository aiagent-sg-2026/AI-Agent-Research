export function requiredCapabilities(version) { return version==='v2'?['stream']:[]; }
export async function closeQuietly(resource) { try { if(resource?.close) await resource.close(); } catch {} }
