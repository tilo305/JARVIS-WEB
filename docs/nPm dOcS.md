# nPm dOcS

**Comprehensive research on npm documentation (docs.npmjs.com)**  
Based on [npm Docs](https://docs.npmjs.com/), tailored for the JARVIS-WEB project.

---

## 1. Overview

npm is the world's largest software registry. It consists of three components:

| Component | Purpose |
|-----------|---------|
| **Registry** | Large public database of JavaScript packages and metadata |
| **CLI** | Command-line interface—how developers interact with npm |
| **Website** | [npmjs.com](https://www.npmjs.com/) — discover packages, manage profiles, organizations |

**JARVIS-WEB** uses npm for:

- **Package management** — `dependencies`, `devDependencies` (Electron, Vite, Jest, etc.)
- **Scripts** — `build`, `dev`, `serve`, `electron`, `lint`, `test`, etc.
- **Lifecycle hooks** — `postinstall` (electron-builder install-app-deps)
- **Version locking** — `package-lock.json` for reproducible installs
- **Overrides** — Security fixes (e.g., `tar`, `minimatch`) without forking deps

- **Source:** [docs.npmjs.com](https://docs.npmjs.com/)
- **CLI reference:** [docs.npmjs.com/cli/v10/commands](https://docs.npmjs.com/cli/v10/commands)
- **GitHub:** [github.com/npm/cli](https://github.com/npm/cli)

---

## 2. Where to Find npm Docs

| Purpose | URL |
|---------|-----|
| Main docs | [docs.npmjs.com](https://docs.npmjs.com/) |
| About npm | [docs.npmjs.com/about-npm](https://docs.npmjs.com/about-npm) |
| CLI commands | [docs.npmjs.com/cli/v10/commands](https://docs.npmjs.com/cli/v10/commands) |
| package.json | [docs.npmjs.com/cli/v10/configuring-npm/package-json](https://docs.npmjs.com/cli/v10/configuring-npm/package-json) |
| package-lock.json | [docs.npmjs.com/cli/v10/configuring-npm/package-lock-json](https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json) |
| Scripts | [docs.npmjs.com/cli/v10/using-npm/scripts](https://docs.npmjs.com/cli/v10/using-npm/scripts) |
| Config / .npmrc | [docs.npmjs.com/cli/v10/using-npm/config](https://docs.npmjs.com/cli/v10/using-npm/config) |
| Packages & modules | [docs.npmjs.com/packages-and-modules](https://docs.npmjs.com/packages-and-modules) |
| Security / audit | [docs.npmjs.com/cli/v10/commands/npm-audit](https://docs.npmjs.com/cli/v10/commands/npm-audit) |

---

## 3. package.json in JARVIS-WEB

### 3.1 Core Fields Used

| Field | JARVIS-WEB Value | Doc |
|-------|------------------|-----|
| `name` | `jarvis-web-cartesia` | Must be lowercase, URL-safe, ≤214 chars |
| `version` | `1.0.0` | [SemVer](https://github.com/npm/node-semver) |
| `main` | `electron/main.js` | Entry point for the app |
| `type` | `"module"` | ESM by default |
| `engines` | `{"node": ">=18.0.0"}` | Node version requirement |
| `license` | `MIT` | SPDX identifier |

### 3.2 dependencies vs devDependencies

| Type | Purpose | JARVIS-WEB examples |
|------|---------|---------------------|
| `dependencies` | Runtime deps | `dotenv`, `ws`, `zod`, `jspdf`, `tesseract.js`, `@ricky0123/vad-web` |
| `devDependencies` | Build/test/dev only | `electron`, `vite`, `eslint`, `jest`, `typescript`, `electron-builder` |

- Use `npm install <pkg> --save-dev` for devDependencies.
- `NODE_ENV=production` omits devDependencies on install unless overridden.

### 3.3 overrides (JARVIS-WEB)

```json
"overrides": {
  "tar": ">=7.5.8",
  "minimatch": ">=10.2.1"
}
```

Used to force secure versions of transitive deps. Prefer over forking packages.

### 3.4 build (electron-builder)

The `build` key is read by **electron-builder**, not npm. See [eLeCtRoN dOcS.md](eLeCtRoN%20dOcS.md) for details.

---

## 4. Scripts in JARVIS-WEB

### 4.1 Lifecycle Scripts

| Event | When it runs |
|-------|--------------|
| `prepare` | Before pack (npm publish/pack), and on local `npm install` |
| `preinstall`, `install`, `postinstall` | After npm modifies node_modules |

**JARVIS-WEB:** `"postinstall": "electron-builder install-app-deps"` — runs after `npm install` to install native deps for electron-builder.

### 4.2 Pre/Post Scripts

For any script `myscript`, you can add:

- `premyscript` — runs before `myscript`
- `postmyscript` — runs after `myscript`

Example: `npm run test` runs `pretest` → `test` → `posttest`.

### 4.3 Running Scripts

```bash
npm run <script>          # Run arbitrary script
npm start                 # Same as npm run start
npm test                  # Same as npm run test
npm run <script> -- --flag  # Pass args (use -- to separate)
```

- Scripts run from package root; `INIT_CWD` = cwd when `npm run` was invoked.
- `node_modules/.bin` is added to PATH for scripts.

### 4.4 Key JARVIS-WEB Scripts

| Script | Purpose |
|--------|---------|
| `dev` | TypeScript watch |
| `start` | Start Node app (dist/src/index.js) |
| `serve` | HTTP static server |
| `serve:prod` | Build + serve production |
| `dev:browser` | Vite dev server |
| `electron` | Run Electron app (Vite + Electron) |
| `electron:build` | Build Electron + Vite |
| `vite:build` | Production Vite build |
| `test` | Jest |
| `test:ci` | Jest with coverage, CI mode |
| `lint`, `lint:fix` | ESLint |
| `build` | TypeScript compile |
| `ci` | build + lint + test:coverage |

---

## 5. CLI Commands Most Relevant to JARVIS-WEB

### 5.1 Install & Update

| Command | Purpose |
|---------|---------|
| `npm install` | Install all deps from package.json + lockfile |
| `npm install <pkg>` | Add and install a package |
| `npm install <pkg> --save-dev` | Add as devDependency |
| `npm ci` | Clean install (CI) — removes node_modules, uses lockfile only |
| `npm update` | Update within semver ranges |
| `npm outdated` | Check for outdated packages |

**Lockfile precedence:** `yarn.lock` > `package-lock.json` > `npm-shrinkwrap.json`

### 5.2 Run & Exec

| Command | Purpose |
|---------|---------|
| `npm run [script]` | Run package script |
| `npm exec <pkg>` / `npx <pkg>` | Run binary from package (local or remote) |

Examples:

```bash
npx eslint .
npx markdownlint-cli "**/*.md"
npm run lint:fix
```

### 5.3 Security & Audit

| Command | Purpose |
|---------|---------|
| `npm audit` | List known vulnerabilities |
| `npm audit fix` | Apply compatible fixes |
| `npm audit fix --force` | Apply fixes including major version bumps (use with care) |
| `npm audit --audit-level=moderate` | Fail CI only if moderate or higher |

### 5.4 Other Useful Commands

| Command | Purpose |
|---------|---------|
| `npm ls` | List installed packages |
| `npm explain <pkg>` | Why a package is installed |
| `npm view <pkg>` | Registry info for a package |
| `npm doctor` | Check environment |
| `npm pack` | Create tarball (for testing publish) |

---

## 6. package-lock.json

- **Purpose:** Exact dependency tree for reproducible installs.
- **Commit:** Yes—commit to source control.
- **Updated by:** `npm install`, `npm update`, `npm audit fix`.
- **JARVIS-WEB:** Uses package-lock.json; do not delete it.

### 6.1 Hidden Lockfile

npm v7+ uses `node_modules/.package-lock.json` to speed installs. If another tool changes node_modules, delete this file to avoid confusion.

---

## 7. Configuration (.npmrc)

| Location | Scope |
|----------|-------|
| Per-project | `.npmrc` in project root |
| Per-user | `~/.npmrc` |
| Global | `$PREFIX/etc/npmrc` |

Common options:

```ini
registry=https://registry.npmjs.org/
save-exact=true
legacy-peer-deps=true
audit=true
```

Use `npm config set <key> <value> --location=project` to write project `.npmrc`.

---

## 8. Semantic Versioning (semver)

| Range | Example | Meaning |
|-------|---------|---------|
| `^` | `^1.2.3` | Compatible with 1.x.x (≥1.2.3 <2.0.0) |
| `~` | `~1.2.3` | Patch only (≥1.2.3 <1.3.0) |
| exact | `1.2.3` | Exactly 1.2.3 |
| `*` | `*` | Any version |

JARVIS-WEB uses `^` for most deps (compatible updates).

---

## 9. npx vs npm exec

- **npx** — standalone binary; all flags before positional args.
- **npm exec** — use `--` to separate npm flags from command args.

Example:

```bash
npm exec -- eslint --fix .
npx eslint --fix .
```

`npx` prompts before installing remote packages; use `--yes` to skip in CI.

---

## 10. CI/CD Recommendations for JARVIS-WEB

1. **Install:** Use `npm ci` instead of `npm install` for deterministic builds.
2. **Audit:** Run `npm audit` and optionally fail on high/critical: `npm audit --audit-level=high`.
3. **Scripts:** Run `npm run ci` (build + lint + test) before merge.
4. **Cache:** Cache `~/.npm` and `node_modules` (or use `npm ci` with lockfile) to speed CI.

---

## 11. Common Issues

| Issue | Solution |
|-------|----------|
| EACCES on global install | Use a node version manager (nvm, fnm) or fix npm prefix |
| Peer dependency conflicts | `--legacy-peer-deps` or fix version ranges |
| Script fails on Windows | Use `cross-env` for env vars; avoid Unix-only shell features |
| Slow installs | Use `npm ci`, ensure lockfile is committed, consider cache |

---

## 12. See Also

- [nOdE.jS dOcS.md](nOdE.jS%20dOcS.md) — Node.js APIs used by server, scripts, Electron
- [eLeCtRoN dOcS.md](eLeCtRoN%20dOcS.md) — Electron and electron-builder
- [jEsT dOcS.md](../jEsT%20dOcS.md) — Testing with Jest
- [eSLiNt DoCs.md](../eSLiNt%20DoCs.md) — Linting
