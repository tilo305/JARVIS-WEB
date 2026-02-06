# Wake Word Troubleshooting (OpenWakeWord)

## "Wake word unavailable" / connection failed

**What you see:**  
Wake word fails to initialize, or "Is the OpenWakeWord server running?"

**Meaning:** The browser cannot connect to the OpenWakeWord Python WebSocket server.

| Check | What to do |
|-------|------------|
| **Server not running** | Run: `python scripts/openwakeword-server.py` (or `npm run openwakeword`). The server must be running before you load the app. |
| **Wrong URL** | Ensure `VITE_OPENWAKEWORD_WS_URL=ws://localhost:8765/ws` in `.env` (or `ws://your-host:8765/ws` if remote). Restart the dev server after changing `.env`. |
| **Port in use** | If port 8765 is taken, run: `python scripts/openwakeword-server.py --port 8766` and set `VITE_OPENWAKEWORD_WS_URL=ws://localhost:8766/ws`. |
| **Firewall/CORS** | WebSocket connections are same-origin from the browser; ensure the app and server URLs match. |

You can keep using the app via the **microphone button** while the wake word is unavailable.

---

## See wake word errors in the console

All wake word errors are logged with a fixed tag so you can filter:

1. Open DevTools → **Console** (F12).
2. In the filter box, type: **`JARVIS Wake Word Error`**.

Every error from the wake word (WebSocket, OpenWakeWord server, STT-after-wake-word, etc.) will appear with that prefix.

---

## See exactly where the pipeline stops

1. Open the app (e.g. `http://localhost:3000`).
2. Open DevTools → **Console** (F12).
3. Filter by: **`JARVIS OpenWakeWord`** or **`JARVIS Wake Word`**.

**Expected sequence when everything works:**

| Step | Log you should see |
|------|--------------------|
| 1. Connection | `[JARVIS OpenWakeWord] WebSocket connected` |
| 2. Sample rate sent | `[JARVIS OpenWakeWord] Sent sample rate payload` |
| 3. Audio flowing | `[JARVIS OpenWakeWord] Forwarding audio frame to client` |
| 4. You say "Hey Jarvis" | `[JARVIS OpenWakeWord] Received activation from server` |
| 5. STT active | `[JARVIS] onTranscript: sending voice payload to n8n` |
| 6. Reply + TTS | `[JARVIS Wake Word] Agent reply received — playing TTS` |

**If you never see step 1:** Server not running or wrong URL. Start `python scripts/openwakeword-server.py`.

**If you see step 1–3 but never step 4:** OpenWakeWord is getting audio but not recognizing "Hey Jarvis". Speak clearly, a bit louder.

---

## Quick checklist

- [ ] OpenWakeWord server running: `python scripts/openwakeword-server.py`
- [ ] `VITE_USE_OPENWAKEWORD=true` and `VITE_OPENWAKEWORD_WS_URL=ws://localhost:8765/ws` in `.env`
- [ ] Dev server restarted after changing `.env`
- [ ] Using the microphone button if wake word is unavailable
- [ ] Console filter `JARVIS OpenWakeWord` to see where the pipeline stops
