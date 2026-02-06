do comprehensive research at https://devdocs.io/vite/ for all issues and fixes

## Picovoice / env vars not read when root is a subdirectory

When `root: 'public'`, Vite's default **envDir** would be that root. This project loads `.env` from the repo root only:

- `loadEnvEverywhere(__dirname)` then `const envDir = __dirname;` and `loadEnv(mode, envDir, '');`
- Returned config includes `envDir` so `.env` at repo root is used.

`.env` lives only at project root; `VITE_PICOVOICE_ACCESS_KEY` and other `VITE_*` are available to the app.
