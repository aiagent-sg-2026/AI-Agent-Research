export async function connectPeer(peer,transport){if(peer?.versions?.includes('v1'))return transport.open('v1');throw Error('No compatible protocol version')}
