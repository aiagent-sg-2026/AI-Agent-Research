import { adapter } from './adapter.mjs';
export async function exportRows() {
  const handle = await adapter.open();
  await handle.close();
  return { rows: [] };
}
