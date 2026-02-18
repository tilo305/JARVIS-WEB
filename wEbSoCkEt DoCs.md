# WebSocket Implementation (MDN Reference)

Do comprehensive research at <https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API> for any issues or fixes involving WebSockets.

## Implemented (per MDN best practices)

### 1. bfcache compatibility

- **Source**: [Writing WebSocket client applications – Working with the bfcache](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications#working_with_the_bfcache)
- **Implementation**: `pagehide` listener in `app.js` calls `bridge.closeAllWebSocketsForBfcache()` so the browser can add the page to the back/forward cache.
- **Location**: `public/js/app.js` (pagehide), `public/js/cartesia-audio-bridge.js` (`closeAllWebSocketsForBfcache()`)

### 2. Security (mixed content)

- **Source**: [Writing WebSocket client applications – Security considerations](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications#security_considerations)
- **Implementation**: Cartesia STT/TTS use `wss://` only. Do not use `ws://` from HTTPS pages (mixed content is blocked by browsers).
- **Location**: `public/js/cartesia-audio-bridge.js` (TTS_ENDPOINT, STT_ENDPOINT)

### 3. Backpressure (bufferedAmount)

- **Source**: [WebSocket.bufferedAmount](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/bufferedAmount)
- **Implementation**: `_sendChunkToSTT()` checks `bufferedAmount` and skips chunks when buffer exceeds 256 KB to avoid memory/CPU issues.
- **Location**: `public/js/cartesia-audio-bridge.js` (`_sendChunkToSTT`)

### 4. Normal close codes

- **Source**: [WebSocket.close()](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close)
- **Implementation**: Use `close(1000, reason)` for normal client-initiated disconnects (code 1000 = normal closure).
- **Location**: `public/js/cartesia-audio-bridge.js` (stopSTT, disconnectTTS, closeAllWebSocketsForBfcache)

## Reference links

- [WebSockets API overview](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Writing WebSocket client applications](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
- [WebSocket interface](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [CloseEvent](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent)
- [MessageEvent](https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent)
