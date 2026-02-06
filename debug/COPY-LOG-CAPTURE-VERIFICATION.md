# Copy Log (Errors + Warnings) Verification

Per **zEn DeBuGgEr.md**: debug, test, check for errors, fix until 0 errors.

## Scope

The Copy log button on the main UI (`public/index.html`) captures **both** `console.error` and `console.warn` so you can copy all captured errors and warnings to the clipboard.

## Implementation

- **Location**: `public/index.html` — inline script (console capture + Copy log button).
- **Storage**: `window.__JARVIS_CAPTURED_ERRORS` (legacy name; holds both errors and warnings).
- **Limit**: Last 200 entries (`maxEntries`); older entries are shifted out.
- **Filter**: The "Multi-threading is not supported" warning is not added to the log (noise reduction).
- **Stack**: When you pass an `Error` (or any object with `.stack`) to `console.error` or `console.warn`, the stack is included in the copied text.

## Automated Tests

- **Unit**: `tests/unit/copy-log-capture.test.js` — asserts that index.html contains:
  - Comment and code for "errors and warnings" capture
  - Override of both `console.error` and `console.warn` with `send('error'|'warn', ...)`
  - `argsToMessageAndStack` for message + stack extraction
  - Button aria-label and title mentioning "errors and warnings"
  - Header and entry format (type shown as ERROR/WARN)

Run: `npx jest tests/unit/copy-log-capture.test.js`

## Manual Verification Checklist

1. Open the app (e.g. `npm run serve` or `npm run vite`), load the main page.
2. Confirm the **Copy log (0)** button is visible (bottom-right).
3. In DevTools Console run:
   - `console.error('test error')`
   - `console.warn('test warning')`
4. Button label should show **Copy log (2)**.
5. Hover: tooltip should say "Copy captured errors and warnings (2) to clipboard".
6. Click the button; paste elsewhere. You should see:
   - Header: "JARVIS captured errors/warnings from this page."
   - Two entries: one `[time] ERROR` and one `[time] WARN` with the test messages.

## Status

- Unit tests: **pass**
- Lint: **no errors**
- Manual: run the checklist above to confirm in-browser.
