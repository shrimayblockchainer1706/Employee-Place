/*
 * Browser shim for `isomorphic-ws`: the real `WebSocket` is a global in every
 * supported browser. The indexer public data provider imports it as a module
 * namespace (`import * as ws` then `ws.WebSocket`), so expose it as both the
 * default and a named export.
 */
const WebSocketImpl = globalThis.WebSocket;

export { WebSocketImpl as WebSocket };
export default WebSocketImpl;