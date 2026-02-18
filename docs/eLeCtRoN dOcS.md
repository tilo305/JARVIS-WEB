# eLeCtRoN dOcS

**Comprehensive research on Electron (electronjs.org) and electron-builder (electron.build)**  
Tailored for the JARVIS-WEB project.

- **Part A:** Electron framework docs (electronjs.org) — process model, security, APIs.
- **Part B:** electron-builder (electron.build) — packaging, configuration, and distribution.

---

# Part B: electron-builder (electron.build)

**Source:** [electron-builder | electron.build](https://www.electron.build/index.html)

electron-builder is a complete solution to **package and build** a ready-for-distribution Electron app for macOS, Windows, and Linux, with optional **auto update** support. It is the tool this project uses to produce installers and portable builds (e.g. NSIS, portable on Windows; DMG on macOS; AppImage on Linux).

## B.1 Overview

| Topic | Details |
|-------|---------|
| **Purpose** | Package and build distributable Electron apps (installers, portable, archives) |
| **Docs** | [electron.build](https://www.electron.build/) |
| **Install** | `npm install electron-builder --save-dev` (or yarn, pnpm, bun) |
| **Config** | `build` key in `package.json`, or `--config <file>` (e.g. `electron-builder.yml`) |
| **Config formats** | `json`, json5, toml, or `js`/`ts` (do not name config file `electron-builder.js` — [conflict with package](https://github.com/electron-userland/electron-builder/issues/6227)) |

### B.1.1 Features (from electron.build)

- **NPM / package management:** Two package.json structure supported; dev dependencies never included; native dependency compilation (including Yarn).
- **Target formats:**  
  - **Windows:** `nsis`, `nsis-web`, `portable`, AppX, MSI, Squirrel.Windows  
  - **macOS:** `dmg`, `pkg`, `mas`  
  - **Linux:** AppImage, snap, `deb`, `rpm`, freebsd, pacman, etc.  
  - **All platforms:** `7z`, `zip`, `tar.xz`, `tar.7z`, `tar.lz`, `tar.gz`, `tar.bz2`, `dir` (unpacked).
- **Code signing** on CI or dev machine (macOS/Windows).
- **Auto update** ready (electron-updater).
- **Advanced:** Separate build steps, parallel builds with hard links on CI, pack already-packaged app; Docker images for Linux/Windows on any host.
- **Tools:** Required tools (e.g. for Windows code signing, AppX) are downloaded on demand.

---

## B.2 Installation & Quick Setup

### Installation

```bash
npm install electron-builder --save-dev
# or: yarn add electron-builder --dev
```

**Yarn 3:** PnP is default but electron-builder needs node_modules. In `.yarnrc.yaml` set:

```yaml
nodeLinker: "node-modules"
```

### Quick Setup (from electron.build)

1. **Standard fields in `package.json`:** `name`, `description`, `version`, `author`.
2. **Build config** in `package.json` under `"build"` (or separate config file):

   ```json
   "build": {
     "appId": "your.id",
     "mac": { "category": "your.app.category.type" }
   }
   ```

3. **Files:** Use [files](https://www.electron.build/contents#files) to control what is packed (entry file, app dir). Defaults exist; override if needed.
4. **Icons:** Add [icons](https://www.electron.build/icons) per platform.
5. **Scripts:**

   ```json
   "scripts": {
     "app:dir": "electron-builder --dir",
     "app:dist": "electron-builder"
   }
   ```

   - `app:dir` — unpacked app directory only (faster, good for testing).
   - `app:dist` — full distributable (e.g. dmg, NSIS, deb).
6. **Native deps:** `"postinstall": "electron-builder install-app-deps"` to match native deps to Electron version.
7. **Own native addons:** Set `nodeGypRebuild: true` if you have in-app native addons.

**Note:** App is packaged into an **asar** archive by default. For production, configure [code signing](https://www.electron.build/code-signing).

---

## B.3 Configuration (relevant to JARVIS-WEB)

**Full options:** [electron.build/configuration](https://www.electron.build/configuration)

### Common options

| Option | Type | Description |
|--------|------|-------------|
| **appId** | string | Application id (CFBundleIdentifier on macOS; AUMID on Windows NSIS). Default `com.electron.${name}`. Strongly recommend explicit. |
| **productName** | string | Human-readable name for executable (can contain spaces). Falls back to top-level `package.json` `productName`, then `name`. |
| **directories** | object | e.g. `output` (build output dir), `buildResources` (icons, etc.). |
| **files** | string \| array | [Glob patterns](https://www.electron.build/file-patterns) relative to **app directory** for what to include. `package.json` and production `node_modules` are always included; dev deps never. |
| **asar** | boolean \| [AsarOptions](https://www.electron.build/configuration) | Package app into asar. Default `true`. Use `asarUnpack` for files that must be unpacked. |
| **asarUnpack** | string \| string[] | Glob patterns for files to unpack from asar. |
| **extraResources** / **extraFiles** | array | Copy files into app resources or content dir (e.g. binaries, data). |
| **nodeGypRebuild** | boolean | Run `node-gyp rebuild` before packaging. Default `false`. Set `true` if you have own native addons. |
| **npmRebuild** | boolean | Rebuild native deps before pack. Default `true`. |
| **win** / **mac** / **linux** | object | Platform-specific options and **targets** (e.g. `nsis`, `portable`, `dmg`, `AppImage`). |

### This project’s `package.json` build block

```json
"build": {
  "appId": "com.jarvis.web",
  "productName": "JARVIS",
  "directories": { "output": "release" },
  "files": [
    "electron/**/*",
    "dist-public/**/*",
    "scripts/**/*",
    "package.json",
    "node_modules/**/*"
  ],
  "win":  { "target": ["nsis", "portable"] },
  "mac":  { "target": ["dmg"], "category": "public.app-category.productivity" },
  "linux": { "target": ["AppImage"] }
}
```

- **appId:** `com.jarvis.web` — used for macOS bundle ID and Windows AUMID.
- **productName:** `JARVIS` — name shown in OS and installers.
- **output:** Build artifacts go to `release/`.
- **files:** Explicit list so only `electron/`, Vite output `dist-public/`, `scripts/`, `package.json`, and `node_modules` are packed (no server-only or dev-only roots).
- **Targets:** Windows → NSIS installer + portable; macOS → DMG; Linux → AppImage.

---

## B.4 Application contents (files)

**Ref:** [Application Contents | electron.build](https://www.electron.build/contents)

- **files:** Glob patterns relative to the [app directory](https://www.electron.build/configuration#directories). Default includes `**/*` with many exclusions (docs, tests, lockfiles, etc.). Dev dependencies are never included.
- If you specify custom **files**, `package.json` and production `**/node_modules/**/*` are still added; default ignore rules apply unless you set `disableDefaultIgnoredFiles`.
- **FileSet:** Use objects `{ "from": "...", "to": "...", "filter": ["..."] }` for custom source/destination and renaming.
- **extraResources:** Copied to `Contents/Resources` (macOS) or `resources` (Windows/Linux).
- **extraFiles:** Copied into app content directory (e.g. `Contents` on macOS).

---

## B.5 Platform targets (JARVIS-WEB)

| Platform | This project’s targets | Notes |
|----------|-------------------------|--------|
| **Windows** | `nsis`, `portable` | NSIS = installer; portable = single exe, no install. |
| **macOS** | `dmg` | Disk image. `category` = `public.app-category.productivity`. |
| **Linux** | `AppImage` | Single-file app image. |

Other options (not used here): `nsis-web`, AppX, MSI, Squirrel.Windows; `pkg`, `mas` on macOS; `snap`, `deb`, `rpm`, etc. on Linux.

---

## B.6 Asar archive

- By default the app is packed into one **asar** archive (Electron’s format). Faster load, single file.
- **asarUnpack:** List glob patterns for files that must be **unpacked** (e.g. native binaries, runtimes). electron-builder can auto-detect some native modules.
- **Compression:** Option `compression` — e.g. `store` for faster builds (no compression), `maximum` for smaller size, longer build.

---

## B.7 Code signing

**Ref:** [Code Signing | electron.build](https://www.electron.build/code-signing)

- Supported on **macOS** and **Windows**. If config and env are set, signing runs as part of the build.
- **Environment variables (typical):**
  - `CSC_LINK` — certificate file (HTTPS link, base64, or `file://` path); `.p12` / `.pfx`.
  - `CSC_KEY_PASSWORD` — certificate password.
  - `CSC_NAME` — (macOS) certificate name when multiple identities.
  - `CSC_IDENTITY_AUTO_DISCOVERY` — `true`/`false`; default `true` on macOS to pick identity from keychain.
  - `WIN_CSC_*` — use different cert/password when building Windows on macOS.
- **CI:** Encode cert as base64, set `CSC_LINK` and `CSC_KEY_PASSWORD` in CI secrets (not in repo). See [electron.build/code-signing](https://www.electron.build/code-signing) for Travis/AppVeyor.
- **Where to buy:** [Windows](https://msdn.microsoft.com/windows/hardware/drivers/dashboard/get-a-code-signing-certificate); macOS needs [Apple certificates](https://www.electron.build/code-signing#where-to-buy-code-signing-certificate) for Gatekeeper.

---

## B.8 CLI and scripts (JARVIS-WEB)

| Command / script | Purpose |
|------------------|----------|
| `electron-builder` | Build for current platform using `package.json` `build` config. |
| `electron-builder --dir` | Build unpacked app directory only (no installer). |
| `electron-builder --win` | Build Windows targets only. |
| `electron-builder --mac` | Build macOS targets only. |
| `electron-builder --linux` | Build Linux targets only. |
| **Project scripts** | |
| `npm run app:dir` | electron-builder —dir only (unpacked app; run after `vite:build` if needed). |
| `npm run app:dist` | electron-builder only (run after `vite:build` or use `npm run dist` for full pipeline). |
| `npm run electron:build` | Run `vite:build`, validate Electron paths, then run Electron with `USE_BUILT=1` (smoke run). |
| `npm run dist` | `electron:build` then `electron-builder` (full distributable for current OS). |
| `npm run dist:win` | Same but `electron-builder --win`. |
| `npm run dist:mac` | Same but `electron-builder --mac`. |
| `npm run dist:linux` | Same but `electron-builder --linux`. |

Output directory for built installers/portables: **release/** (from `directories.output`).

### Implemented from electron.build Quick Setup

- **Standard fields:** `name`, `description`, `version`, `author` in `package.json`.
- **Build config:** `appId`, `productName`, `directories.output`, `directories.buildResources`, `files`, `win`/`mac`/`linux` targets.
- **Icons:** `build/` directory as `buildResources`; see `build/README.md` for icon file names and sizes.
- **Scripts:** `app:dir`, `app:dist`, `postinstall: "electron-builder install-app-deps"`.
- **Code signing:** Optional env vars in `.env.example`; `electron-builder.env.example` for CLI-only use.

---

## B.9 Programmatic API

**Ref:** [Programmatic API | electron.build](https://www.electron.build/programmatic-usage)  
Typings: `node_modules/electron-builder/out/index.d.ts` or [electron.build/electron-builder/globals](https://www.electron.build/electron-builder/globals).

```js
const builder = require("electron-builder");
const Platform = builder.Platform;

builder
  .build({
    targets: Platform.MAC.createTarget(),
    config: { /* build options, see https://www.electron.build/ */ }
  })
  .then(() => { /* success */ })
  .catch((err) => { /* error */ });
```

Useful for CI or custom build scripts that need to choose targets or config dynamically.

---

## B.10 Debug

Set env to get verbose electron-builder logs:

- **General:** `DEBUG=electron-builder`  
  - Windows CMD: `set DEBUG=electron-builder`  
  - PowerShell: `$env:DEBUG = "electron-builder"`
- **Linux (FPM):** `FPM_DEBUG=1`
- **macOS DMG:** `DEBUG_DMG=true` (more `hdiutil` output)

---

## B.11 References (electron-builder)

| Link | Description |
|------|--------------|
| [electron.build](https://www.electron.build/) | Main docs |
| [Configuration](https://www.electron.build/configuration) | All build options |
| [Application Contents (files)](https://www.electron.build/contents) | What gets packed |
| [File patterns](https://www.electron.build/file-patterns) | Glob and macros |
| [Code signing](https://www.electron.build/code-signing) | Certificates and env vars |
| [Windows targets](https://www.electron.build/win) | NSIS, portable, etc. |
| [macOS targets](https://www.electron.build/mac) | DMG, PKG, MAS |
| [Linux targets](https://www.electron.build/linux) | AppImage, snap, deb, etc. |
| [Programmatic API](https://www.electron.build/programmatic-usage) | `builder.build()` |
| [GitHub issues](https://github.com/electron-userland/electron-builder/issues) | Bugs and questions |

---

# Part A: Electron (electronjs.org)

**Comprehensive research on Electron documentation (electronjs.org)**  
Based on [Electron Documentation | Electron (blog)](https://www.electronjs.org/blog/electron-doumentation), tailored for the JARVIS-WEB project.

---

## 1. Overview

Electron is a framework for building desktop applications using JavaScript, HTML, and CSS. By embedding **Chromium** and **Node.js** into its binary, Electron allows you to maintain one JavaScript codebase and create cross-platform apps that work on Windows, macOS, and Linux — no native development experience required.

Electron's documentation lives on **electronjs.org**. The blog post describes how docs are hosted, versioned, and built (script, Jekyll, front matter). This doc summarizes that content and points to where to find and use Electron docs when working on this project's `electron/` desktop app.

- **Source (blog):** [Electron Documentation](https://www.electronjs.org/blog/electron-doumentation) (June 4, 2015)
- **Current docs:** [electronjs.org/docs](https://www.electronjs.org/docs)
- **Docs source (upstream):** [electron/electron – docs](https://github.com/electron/electron/tree/main/docs)
- **Site repo:** [electron/electronjs.org](https://github.com/electron/electronjs.org)

---

## 2. Where to Find Electron Docs

| Purpose | URL |
|--------|-----|
| Latest docs | [electronjs.org/docs/latest](https://www.electronjs.org/docs/latest) |
| All versions | [electronjs.org/docs](https://www.electronjs.org/docs) |
| Version-specific (e.g. v40) | `https://www.electronjs.org/docs/vX.XX.X` |
| Single-page (search with Ctrl+F) | [electronjs.org/docs/all](https://www.electronjs.org/docs/all) |

Contributions to doc content are made in the **Electron core repo** ([electron/electron](https://github.com/electron/electron)); the website repo (electronjs.org) fetches and publishes them for each minor release.

### Doc Categories (from electronjs.org)

- **Contributing:** Compiling Electron and making contributions
- **References:** Links to understand how the Electron project works
- **Testing And Debugging:** Debugging, tests, quality tools
- **Distribution:** Distributing apps to end users
- **Development:** Miscellaneous development guides
- **Examples:** Quick references for features
- **Best Practices:** Security and performance checklists
- **Processes in Electron:** Main vs renderer, process model
- **Tutorial:** End-to-end guide to create and publish an app

---

## 3. How the Docs Are Built (Technical Bits)

Documentation is kept in the **Electron core repository** as-is. On each release, it's copied into the **Electron website repository** (electronjs.org), which is a **Jekyll** site.

### 3.1 script/docs

- **CLI:** `script/docs vX.XX.X` with optional `--latest`.
- **Behavior:** Fetches the release tarball, extracts it, streams and processes only the `/docs` directory, then outputs files suitable for the Jekyll site.
- **Node modules used:**
  - **nugget** – download release tarball to a temp directory
  - **gunzip-maybe** – decompress the tarball
  - **tar-fs** – stream only `/docs` from the tarball and run filtering/processing (with **through2**)
- Tests in the site repo verify that the fetched docs land correctly.

### 3.2 Jekyll Structure

```
electron.atom.io (now electronjs.org)
└── _docs
    ├── latest
    ├── vX.XX.X
    └── ...
```

### 3.3 Front matter

Every doc page has Jekyll front matter. Example for a normal page:

```yaml
---
version: v0.27.0
category: Tutorial
title: 'Quick Start'
source_url: 'https://github.com/electron/electron/blob/master/docs/tutorial/quick-start.md'
---
```

The `README.md` gets an additional `permalink: /docs/vX.XX.X/index.html`.

### 3.4 Config and redirects

- In `_config.yml`: `latest_version` and `available_versions` list
- Collections: `docs: { output: true, permalink: '/docs/:path/' }`
- `latest.md` redirects `/docs/latest/` to the current release

---

## 4. Process Model

Electron inherits its multi-process architecture from Chromium. As an app developer, you control two types of processes: **main** and **renderer**.

### 4.1 Main Process

- **Single instance** per app; acts as the application's entry point
- Runs in a **Node.js environment** — can `require` modules and use all Node.js APIs
- **Primary purpose:** Create and manage application windows with `BrowserWindow`
- Controls **application lifecycle** via the `app` module (quit, dock, About panel)
- Exposes **native APIs** (menus, dialogs, tray icons)

### 4.2 Renderer Process

- **One per** `BrowserWindow` (and per web embed)
- Responsible for **rendering web content**
- Code should behave according to **web standards**
- User interfaces and app functionality should use the same tools and paradigms as the web

### 4.3 Why Multi-Process?

A single process would mean one tab crash affects the entire app. Chromium (and Electron) isolate each window in its own process to limit harm from buggy or malicious code.

---

## 5. Security

> **Source:** [Electron Security | electronjs.org](https://www.electronjs.org/docs/latest/tutorial/security)

Electron is **not a web browser**. Your code has greater power (filesystem, shell, etc.), so security risks scale with that power. Displaying arbitrary content from untrusted sources poses a severe security risk — popular Electron apps (Atom, Slack, VS Code) display primarily local or trusted remote content without Node integration.

### 5.1 General Guidelines

- **Keep Electron up-to-date** — vulnerabilities in Chromium/Node affect your app; critical issues (e.g. nodeIntegration bypasses) are patched in newer releases
- **Evaluate dependencies** — choose trusted 3rd-party libraries; outdated or poorly maintained code can jeopardize security
- **Adopt secure coding practices** — XSS has higher impact in Electron apps; perform security testing

### 5.2 Isolation for Untrusted Content

- **Never** load and execute remote code with Node.js integration enabled
- Use only **local files** (packaged with your app) for Node.js code
- For remote content: use `<webview>` or `WebContentsView` with `nodeIntegration` disabled and `contextIsolation` enabled
- Security warnings appear in the dev console when the binary name is "Electron"; control via `ELECTRON_ENABLE_SECURITY_WARNINGS` or `ELECTRON_DISABLE_SECURITY_WARNINGS`

### 5.3 Recommended webPreferences

- `nodeIntegration: false` — renderer cannot use Node.js directly (default since 5.0.0)
- `contextIsolation: true` — preload runs in isolated world; prevents global object tampering (default since 12.0.0)
- `sandbox: true` — renderer runs in Chromium sandbox (default since 20.0.0)
- `webSecurity: true` — enforce same-origin policy (required for getUserMedia, WebSockets, etc.)
- Use `preload` + `contextBridge` to expose a minimal API instead of raw Node/Electron APIs

### 5.4 Security Checklist (20 Recommendations)

From the [official Electron security tutorial](https://www.electronjs.org/docs/latest/tutorial/security):

| # | Recommendation | Notes |
|---|----------------|-------|
| 1 | **Only load secure content** | Use HTTPS, WSS, FTPS — never HTTP for remote resources |
| 2 | **Do not enable Node.js integration for remote content** | Use preload + contextBridge; never `nodeIntegration: true` for remote URLs |
| 3 | **Enable context isolation** | Default since 12.0.0; required for strong isolation |
| 4 | **Enable process sandboxing** | Default since 20.0.0; disables if context isolation is off |
| 5 | **Handle session permission requests** | Use `ses.setPermissionRequestHandler()` for remote content; verify URL before approving |
| 6 | **Do not disable webSecurity** | Disabling disables same-origin policy |
| 7 | **Define a Content-Security-Policy** | Restrict `script-src` (e.g. `'self'`); use `webRequest.onHeadersReceived` or meta tag |
| 8 | **Do not enable allowRunningInsecureContent** | Avoid mixed content (HTTPS page loading HTTP resources) |
| 9 | **Do not enable experimental features** | `experimentalFeatures: true` is risky |
| 10 | **Do not use enableBlinkFeatures** | Only enable if you know the ramifications |
| 11 | **&lt;webview&gt;: Do not use allowpopups** | Avoid `allowpopups` unless needed |
| 12 | **&lt;webview&gt;: Verify options and params** | Use `will-attach-webview` to strip/validate preload, nodeIntegration, and `params.src` |
| 13 | **Disable or limit navigation** | Use `will-navigate` handler; validate URL with `new URL()` (avoid naive `startsWith`) |
| 14 | **Disable or limit creation of new windows** | Use `setWindowOpenHandler`; deny unexpected windows |
| 15 | **Do not use shell.openExternal with untrusted content** | Can execute arbitrary commands; only use with trusted URLs |
| 16 | **Use a current version of Electron** | Migrate one major version at a time; see Breaking Changes |
| 17 | **Validate the sender of all IPC messages** | Check `event.senderFrame` / `frame.url`; allowlist hosts |
| 18 | **Avoid file:// protocol; prefer custom protocols** | `file://` gives broad file access; use `protocol.handle` for controlled serving |
| 19 | **Check which fuses you can change** | Use `@electron/fuses`; e.g. `runAsNode`, `nodeCliInspect` can allow CLI-based execution |
| 20 | **Do not expose Electron APIs to untrusted web content** | Never expose `ipcRenderer.on` or pass callbacks that receive `IpcRendererEvent` (includes `sender`) |

### 5.5 Code Examples (from official docs)

**Secure BrowserWindow for remote content:**

```js
// Good
const mainWindow = new BrowserWindow({
  webPreferences: {
    preload: path.join(app.getAppPath(), 'preload.js')
  }
})
mainWindow.loadURL('https://example.com')
```

**Secure preload (do not expose raw IPC):**

```js
// Bad
contextBridge.exposeInMainWorld('electronAPI', { on: ipcRenderer.on })

// Good
contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateCounter: (callback) => ipcRenderer.on('update-counter', (_event, value) => callback(value))
})
```

**Limit navigation:**

```js
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    if (parsedUrl.origin !== 'https://example.com') event.preventDefault()
  })
})
```

**Validate IPC sender:**

```js
ipcMain.handle('get-secrets', (e) => {
  if (!validateSender(e.senderFrame)) return null
  return getSecrets()
})
function validateSender(frame) {
  if ((new URL(frame.url)).host === 'electronjs.org') return true
  return false
}
```

---

## 6. Key APIs for JARVIS-WEB

### 6.1 BrowserWindow

- Creates and controls browser windows
- `webPreferences.preload` — path to preload script (must be absolute)
- `ready-to-show` event — show window after first render to avoid visual flash
- `loadURL()` for dev server; `loadFile()` for built app

### 6.2 contextBridge

- Creates a **safe, bi-directional bridge** across isolated contexts
- Use `contextBridge.exposeInMainWorld(apiKey, api)` in preload
- **Never** expose `ipcRenderer` directly — provide a safe wrapper instead
- Supported types: `Function`, `string`, `number`, `Array`, `boolean`, nested objects

### 6.3 ipcMain / ipcRenderer

- **ipcMain.handle(channel, listener)** — handle async requests from renderer; returns a Promise
- **ipcRenderer.invoke(channel, ...args)** — call from renderer; returns Promise
- Use for secure main↔renderer communication (e.g. n8n webhook proxy)

---

## 7. JARVIS-WEB Implementation

### 7.1 Architecture

| Piece | Location | Notes |
|-------|----------|-------|
| Main process | `electron/main.js` | ESM; creates `BrowserWindow`, loads Vite dev URL or `dist-public/index.html`; handles `n8n-webhook` IPC; sandbox + contextIsolation |
| Preload | `electron/preload.js` | CommonJS; exposes `electronAPI` via `contextBridge`: `isElectron`, `platform`, `versions`, `invokeN8nWebhook` |
| Frontend | `public/js/app.js` | Sets `window.JARVIS_IS_ELECTRON` when `window.electronAPI?.isElectron`; uses `invokeN8nWebhook` for n8n POST (avoids CORS) |
| Vite build | `vite.config.js` | `base: './'` and relative script path in built `index.html` so `loadFile()` (file://) resolves assets correctly |
| Validation | `debug/tools/validate-electron-paths.js` | Run after `vite:build` to ensure paths exist |
| Integration verify | `debug/tools/verify-electron-integration.mjs` | `npm run electron:verify` — checks Vite, bridge, frontend, backend wiring |

### 7.2 Integration Flow

```
Electron main.js
    ├── Dev: loadURL(http://localhost:PORT)  ← Vite dev server
    ├── Built: loadFile(dist-public/index.html)  ← file://
    └── Preload (before page): contextBridge.exposeInMainWorld('electronAPI', {...})
            └── Frontend (app.js): window.electronAPI?.isElectron → JARVIS_IS_ELECTRON
            └── n8n: window.electronAPI.invokeN8nWebhook(url, body) → ipcMain.handle → fetch (no CORS)
```

- **Vite**: `base: './'` + relative script paths → works with both `http://` and `file://`
- **AudioWorklet**: `new URL('../audio/', import.meta.url).href` → resolves to `dist-public/audio/` in built mode
- **PORT**: `scripts/wait-for-vite.mjs` and `scripts/start-electron-with-env.mjs` use `.env` so Electron and Vite stay in sync

### 7.3 Security Measures in This Project

Implements the [Electron security checklist](https://www.electronjs.org/docs/latest/tutorial/security):

| # | Measure | Implementation |
|---|---------|----------------|
| 1 | Secure content | Dev: localhost; built: file:// from dist-public |
| 2 | No Node for remote | `nodeIntegration: false`; preload + contextBridge only |
| 3 | Context isolation | `contextIsolation: true` |
| 4 | Sandbox | `sandbox: true` |
| 5 | Permission handler | `setPermissionRequestHandler` — media/microphone/notifications only for app origins |
| 6 | webSecurity | `webSecurity: true` (default) |
| 7 | CSP | `webRequest.onHeadersReceived` + meta tag in index.html |
| 13 | Limit navigation | `will-navigate` — allow only localhost (dev) or file:// dist-public (built) |
| 14 | Limit new windows | `setWindowOpenHandler` — deny all |
| 12 | webview safety | `will-attach-webview` — strip preload, enforce nodeIntegration: false, HTTPS-only src |
| 17 | Validate IPC sender | `validateIpcSender(event.senderFrame)` on all handlers (n8n, mcp, set-title) |

Additional: webhook URL validation (HTTPS, `/webhook/`), payload shape validation, 30s n8n timeout.

### 7.4 Scripts (package.json)

| Script | Purpose |
|--------|---------|
| `electron` | Start Vite, wait for PORT (from .env), launch Electron with env |
| `electron:raw` | Launch Electron only (requires Vite running or use `electron:built`) |
| `electron:built` | `USE_BUILT=1` — load from `dist-public/index.html` |
| `dev:electron` | Alias for `electron` |
| `electron:build` | `vite:build` → validate paths → `electron:built` |
| `electron:verify` | Run integration verification (Vite, bridge, frontend, backend) |

### 7.5 Electron Version

This project uses **Electron 40.2.1** (see `package.json` devDependencies).

---

## 8. Quick Links

- [Getting Started](https://www.electronjs.org/docs/latest/tutorial/tutorial-prerequisites)
- [API Reference (app)](https://www.electronjs.org/docs/latest/api/app)
- [Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window)
- [contextBridge](https://www.electronjs.org/docs/latest/api/context-bridge)
- [ipcMain](https://www.electronjs.org/docs/latest/api/ipc-main)
- [electron-builder](https://www.electron.build/) (packaging/building — **used by this project**; see Part B above)
- [Electron Forge](https://www.electronforge.io/) (alternative packager)
- [Electron Fiddle](https://www.electronjs.org/fiddle) (experimentation)

---

## 9. References

- [Electron Security (tutorial)](https://www.electronjs.org/docs/latest/tutorial/security) – official security checklist and recommendations
- [Electron Documentation (blog)](https://www.electronjs.org/blog/electron-doumentation) – source for this research
- [Electron docs on GitHub](https://github.com/electron/electron/tree/main/docs) – upstream doc source
- [electron-builder (electron.build)](https://www.electron.build/) – packaging and distribution (Part B of this doc)
- [Jekyll Collections](https://jekyllrb.com/docs/collections/) – feature used for the docs site
- [How GitHub uses Jekyll for docs](https://github.com/blog/1939-how-github-uses-github-to-document-github) – referenced in the original post
