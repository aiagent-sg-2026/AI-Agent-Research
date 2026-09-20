export async function openCodec(peer,transport){if(peer?.versions?.includes('c2'))return transport.open('c2');const e=Error('No compatible codec');e.name='NoCompatibleCodec';throw e}
