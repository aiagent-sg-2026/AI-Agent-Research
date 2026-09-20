export async function negotiatePeer(peer,transport){if(peer?.versions?.includes('v2'))return transport.open('v2');const e=Error('No compatible version');e.name='NoCompatibleVersion';throw e}
