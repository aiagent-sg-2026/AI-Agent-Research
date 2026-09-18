export async function openCodec(peer,transport){if(peer?.codecs?.includes('c2'))return transport.open('c2');throw Error('No usable codec')}
