export async function postLedgerBatch(entries,driver){for(const e of entries)await driver.post(e);return {status:'posted',count:entries.length}}
