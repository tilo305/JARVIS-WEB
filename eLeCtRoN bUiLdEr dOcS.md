# JARVIS-WEB — electron-builder Documentation

## 🚨 CRITICAL: MANDATORY RESEARCH PROTOCOL (MUST READ FIRST)

### BEFORE USING THIS DOCUMENTATION, YOU MUST:

#### 1. COMPREHENSIVE RESEARCH ON ELECTRON.BUILD (MANDATORY FIRST STEP)
- **ALWAYS** start by doing comprehensive research on: **https://www.electron.build/**
- This is the **official electron-builder documentation**
- Covers configuration, targets, code signing, auto-update, file patterns, and platform-specific options
- Essential for understanding electron-builder before diving into this project-specific guide
- **THIS MUST BE DONE FIRST** before using any content from this document

#### 2. THEN RESEARCH THIS DOCUMENT
- After researching electron.build, read this document thoroughly
- This document is **electron-builder project-specific** for the JARVIS-WEB application
- Covers project-specific build config, scripts, and packaging flow
- Both sources are complementary and should be used together

#### 3. RESEARCH HIERARCHY
```
1. https://www.electron.build/ (FIRST - Official electron-builder documentation)
   ↓
2. https://www.electron.build/configuration (Configuration reference)
   ↓
3. This document (Project-specific JARVIS-WEB packaging)
   ↓
4. Platform-specific docs (mac, win, linux) as needed
```

#### 4. WHY THIS ORDER MATTERS
- **electron.build** teaches configuration options, targets, hooks, and platform behavior
- **This document** teaches how JARVIS-WEB uses electron-builder with Vite
- Understanding electron-builder fundamentals first makes build customization easier
- Prevents confusion between generic options and JARVIS-WEB-specific setup

### ⚠️ CRITICAL WARNINGS
- **DO NOT** skip researching electron.build — it's essential foundational knowledge
- **DO NOT** name a config file `electron-builder.js` — it conflicts with the package name
- **ALWAYS** run `npm run vite:build` (or `electron:pack`) before packaging so `dist-public/` exists
- **CHECK** the project `package.json` `build` key for current configuration

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Installation & Scripts](#installation--scripts)
3. [Project Configuration](#project-configuration)
4. [Build Flow](#build-flow)
5. [Target Formats](#target-formats)
6. [File Inclusion](#file-inclusion)
7. [Programmatic Usage](#programmatic-usage)
8. [Debugging Builds](#debugging-builds)
9. [Code Signing & Production](#code-signing--production)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### What is electron-builder for JARVIS-WEB?
[electron-builder](https://www.electron.build/) packages the JARVIS-WEB app into distributable installers for Windows, macOS, and Linux. JARVIS-WEB uses:

- **Electron** for the desktop shell (main process + preload)
- **Vite** for building the frontend → `dist-public/`
- **electron-builder** for producing NSIS/portable (Win), DMG (macOS), and AppImage (Linux)

### Key electron-builder Capabilities
- **Target formats**: NSIS, portable, DMG, AppImage, and many more
- **ASAR packaging**: Source bundled into asar by default
- **Auto update**: Ready for electron-updater
- **Code signing**: Supported for production distribution
- **Build hooks**: `beforePack`, `afterPack`, `afterSign`, etc.

---

## Installation & Scripts

### Installation

electron-builder is a dev dependency:

```bash
npm install --save-dev electron-builder
```

In JARVIS-WEB it is already listed in `devDependencies`:

```json
"electron-builder": "^25.0.0"
```

### Scripts in JARVIS-WEB

| Script | Command | Purpose |
|--------|---------|---------|
| `electron:dev` | `vite` + wait-on + `electron .` | Dev mode: Vite dev server + Electron |
| `electron` | `electron .` | Run Electron (loads `dist-public` or dev server) |
| `electron:pack` | `vite:build` + `electron-builder` | Build frontend, then package with electron-builder |
| `electron:build` | `vite:build` + `run-electron-build.mjs` | Build frontend, then run Electron (no packaging) |

### Quick Commands

```bash
# Package for current platform (NSIS + portable on Win, DMG on Mac, AppImage on Linux)
npm run electron:pack

# Only generate unpacked app directory (useful for testing)
npx electron-builder --dir

# Package for specific platforms (from any OS with Docker, if configured)
npx electron-builder --win
npx electron-builder --mac
npx electron-builder --linux
```

---

## Project Configuration

JARVIS-WEB defines electron-builder config in `package.json` under the `build` key:

```json
"build": {
  "appId": "com.jarvis.web",
  "productName": "JARVIS",
  "files": [
    "electron/**/*",
    "dist-public/**/*"
  ],
  "directories": {
    "output": "release"
  },
  "win": {
    "target": ["nsis", "portable"]
  },
  "mac": {
    "target": ["dmg"],
    "category": "public.app-category.utilities"
  },
  "linux": {
    "target": ["AppImage"]
  }
}
```

### Configuration Summary

| Option | Value | Meaning |
|--------|-------|---------|
| `appId` | `com.jarvis.web` | CFBundleIdentifier (macOS), AUMID (Windows) |
| `productName` | `JARVIS` | Display name of the app |
| `files` | `electron/**/*`, `dist-public/**/*` | Only Electron main/preload and built frontend are packaged |
| `directories.output` | `release` | Artifacts written to `release/` |
| `win.target` | `nsis`, `portable` | Windows installer + portable exe |
| `mac.target` | `dmg` | macOS disk image |
| `linux.target` | `AppImage` | Linux AppImage |

### Why `files` Is Explicit

By default, electron-builder includes `**/*` and excludes dev artifacts. JARVIS-WEB restricts inclusion to:

- `electron/**/*` — main process and preload
- `dist-public/**/*` — Vite build output (index.html, JS, assets)

This avoids bundling `src/`, `public/` (raw source), `node_modules` dev deps, tests, and other non-runtime files.

---

## Build Flow

### High-Level Flow

```
1. npm run electron:pack
2. npm run vite:build  →  dist-public/ populated
3. electron-builder   →  release/ populated
```

### What electron-builder Does

1. Uses `main` from `package.json` → `electron/main.js`
2. Copies `files` into the app staging directory
3. Bundles into ASAR (unless disabled)
4. Produces target artifacts (NSIS, portable, DMG, AppImage) in `release/`

### Vite Build Dependency

**Critical**: `dist-public/` must exist before electron-builder runs. `electron:pack` runs `vite:build` first. If you run `electron-builder` manually, run `npm run vite:build` first.

---

## Target Formats

### Windows
- **nsis**: Standard installer (JARVIS Setup 1.0.0.exe)
- **portable**: Single .exe, no installation

### macOS
- **dmg**: Disk image for distribution
- **category**: `public.app-category.utilities`

### Linux
- **AppImage**: Portable binary

### Other Targets (Not Used in JARVIS-WEB)

electron-builder also supports: `7z`, `zip`, `tar.*`, `dir` (unpacked), `pkg` (macOS), `deb`, `rpm`, `snap`, `flatpak`, `msi`, `appx`, etc. See [Configuration](https://www.electron.build/configuration).

---

## File Inclusion

### Default vs JARVIS-WEB

- **Default**: `**/*` minus ignores (dev deps, tests, etc.)
- **JARVIS-WEB**: Explicit `electron/**/*` and `dist-public/**/*`

### File Macros and Patterns

electron-builder uses [glob patterns](https://www.electron.build/file-patterns). Example for adding extra files:

```json
"files": [
  "electron/**/*",
  "dist-public/**/*",
  "some-extra/**/*"
]
```

### ASAR

Default `asar: true` packages app code into an asar archive. Node modules needing unpacking are usually detected automatically. To unpack specific paths:

```json
"asarUnpack": ["**/*.node", "dist-public/audio/**/*"]
```

---

## Programmatic Usage

For custom build scripts, use the programmatic API:

```javascript
const builder = require("electron-builder");
const Platform = builder.Platform;

builder.build({
  targets: Platform.WINDOWS.createTarget("nsis", "portable"),
  config: {
    // Override or extend config
  },
})
  .then(() => console.log("Build done"))
  .catch((err) => console.error(err));
```

See [programmatic-usage](https://www.electron.build/programmatic-usage) and `node_modules/electron-builder/out/index.d.ts` for typings.

---

## Debugging Builds

### Environment Variables

```powershell
# PowerShell
$env:DEBUG = "electron-builder"
npm run electron:pack
```

```cmd
REM CMD
set DEBUG=electron-builder
npm run electron:pack
```

### Additional Debug Options

- **FPM_DEBUG**: Extra detail for Linux builds (deb, rpm, etc.)
- **DEBUG_DMG**: Verbose hdiutil output on macOS

### Common Checks

1. Ensure `dist-public/` exists and contains `index.html`
2. Ensure `electron/main.js` and `electron/preload.js` exist
3. Check `package.json` `main` points to `electron/main.js`
4. Run `npx electron-builder --dir` to inspect unpacked output without creating installers

---

## Code Signing & Production

For production distribution:

- **macOS**: Requires code signing and notarization (Gatekeeper).
- **Windows**: NSIS/portable can be signed with Authenticode.
- See [electron.build code signing](https://www.electron.build/code-signing) and [Where to buy certificates](https://www.electron.build/code-signing#where-to-buy-code-signing-certificate).

JARVIS-WEB does not configure signing by default; add `cscLink`, `cscKeyPassword`, and platform options as needed for your release pipeline.

---

## Troubleshooting

### "dist-public does not exist"
Run `npm run vite:build` before `electron-builder` or use `npm run electron:pack`.

### "main field missing"
Ensure `package.json` has `"main": "electron/main.js"`.

### Wrong files packaged
Check `build.files` in `package.json` and ensure paths match project layout.

### Build fails on specific platform
- Use `--dir` to produce unpacked app only and verify structure
- Set `DEBUG=electron-builder` for detailed logs
- Confirm platform-specific tools (e.g., WiX on Windows for MSI) if using other targets

### Yarn 3 (PnP)
If using Yarn 3, set `nodeLinker: "node-modules"` in `.yarnrc.yaml` because electron-builder expects `node_modules`.

---

## References

- [electron-builder homepage](https://www.electron.build/)
- [Configuration reference](https://www.electron.build/configuration)
- [File patterns](https://www.electron.build/file-patterns)
- [macOS options](https://www.electron.build/mac)
- [Windows options](https://www.electron.build/win)
- [Linux options](https://www.electron.build/linux)
- [Programmatic API](https://www.electron.build/programmatic-usage)
- [Code signing](https://www.electron.build/code-signing)
