# Debug System Status

**Last updated:** 2026-02-07  
**Status:** Streamlined; only active tools and scripts documented.

## Tools kept

| Category | Tool | Status |
|----------|------|--------|
| Runner | `run-debug-suite.mjs` | ✅ |
| Static check | `check-console-errors.js` | ✅ |
| Tests | Jest tests in `debug/tests/` | ✅ |
| Browser pages | `public/debug/*.html` (4 pages) | ✅ |

## Scripts

```bash
npm run debug            # Lint, test, build, vite
npm test                 # All Jest tests
npm run test:integration # Cartesia integration (debug/tests/integration)
```

## Removed

- **debug:live** — `debug/live/` removed; script removed from package.json
- Wake word tools and pages (feature removed)
- References to **check-n8n-webhook.js**, **validate-config.js**, **check-env.js** — those files are not in the repo; docs updated

See `ORPHANED-DUPLICATE-OLD-CODE.md` for full audit.
