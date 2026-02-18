# cSp DoCs

**Comprehensive research on Content Security Policy (CSP)**  
Based on [csp.withgoogle.com/docs](https://csp.withgoogle.com/docs/index.html) and [web.dev/strict-csp](https://web.dev/strict-csp), tailored for the JARVIS-WEB project.

> **Note:** The Google CSP docs site states its content is *outdated and available for historical reasons only*. For current guidance on enabling strict CSP, use [web.dev/strict-csp](https://web.dev/strict-csp). This doc synthesizes both sources.

---

## 1. Introduction

**Content Security Policy (CSP)** is a mechanism designed to make applications more secure against common web vulnerabilities, particularly **cross-site scripting (XSS)**. It is enabled by setting the `Content-Security-Policy` HTTP response header.

### Core functionality (three areas)

1. **Script trust** — Requiring that all scripts are safe and trusted by the application owner (ideally via a CSP **nonce**).
2. **Resource trust** — Ensuring page resources (images, stylesheets, frames) load from trusted sources.
3. **Miscellaneous** — Preventing framing by untrusted domains, upgrading requests to HTTPS, etc.

### Basic policy example

```
Content-Security-Policy: default-src https:; script-src 'nonce-{random}'; object-src 'none'
```

This policy requires HTTPS for resources, allows only `<script>` elements with the correct `nonce` attribute, and blocks plugins.

---

## 2. Why CSP?

### Primary benefit: XSS mitigation

When an application uses a **strict policy**, an attacker who finds an XSS bug generally cannot force the browser to execute malicious scripts. The policy only allows scripts with the correct nonce (or hash), which attackers cannot guess.

### Why XSS is serious

- **Damaging** — An attacker executing JavaScript in another user's session gets full access to their data in the vulnerable app and often other apps on the same domain.
- **Ubiquitous** — XSS is consistently among the [most common flaws](https://www.owasp.org/index.php/Top_10_2013-Top_10) in web applications; almost all large apps have suffered from it.

### Traditional CSP vs strict CSP

**Traditional CSP** (URL allowlists like `script-src www.googleapis.com`) is generally **ineffective** against XSS — attackers can often bypass it. See [research paper](https://research.google.com/pubs/pub45542.html).

**Strict CSP** uses cryptographic **nonces** or **hashes** instead of host allowlists, avoiding common bypasses.

---

## 3. When to use CSP

- **Recommended for**: Most complex web applications, especially those managing sensitive data (admin UIs, device consoles) or hosting user-generated content.
- **Good fit**: Apps using modern frameworks (e.g. Closure Templates) where adoption can be relatively straightforward.

### When not to use CSP

- **Static apps** without logged-in functionality or cookies on their own subdomain — XSS is a minor concern.
- **Large legacy apps** with a history of XSS and insecure templates — CSP is not a substitute for fixing the codebase; improve security posture first.
- **Weak policies** — Policies that allow `'unsafe-inline'` or untrusted domains do **not** improve security. Deploy only when you can adopt strict CSP.

---

## 4. Strict CSP

### Requirements

To enable strict CSP, most applications need to:

1. **Generate a new nonce** for every page load, pass it to the template system, and use the same value in the policy.
2. **Refactor** inline event handlers (`onclick`, etc.) and `javascript:` URIs.
3. **Add a `nonce` attribute** to all `<script>` elements.

### Nonce-based strict CSP (web.dev)

```
Content-Security-Policy:
  script-src 'nonce-{RANDOM}' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
```

### Hash-based strict CSP

```
Content-Security-Policy:
  script-src 'sha256-{HASHED_INLINE_SCRIPT}' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
```

### Production example (Google docs)

```
Content-Security-Policy:
  object-src 'none';
  script-src 'nonce-{random}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:;
  base-uri 'none';
  report-uri https://your-report-collector.example.com/
```

**Directive meanings**:

| Directive | Purpose |
|-----------|---------|
| `object-src 'none'` | Prevents Flash and other plugins. |
| `script-src 'nonce-{random}'` | Only scripts with matching nonce execute. |
| `'unsafe-inline'` | Ignored by modern browsers when nonce is present; fallback for older browsers. |
| `'strict-dynamic'` | Allows scripts dynamically added by trusted scripts; reduces deployment effort. |
| `'unsafe-eval'` | Allows `eval()`; remove if not needed for stronger protection. |
| `base-uri 'none'` | Blocks `<base>` URIs; use `'self'` if you use `<base>`. |
| `report-uri` | Sends violation reports to a collector URL. |

---

## 5. Adopting CSP

### Step 1: Add nonces to `<script>` elements

Every `<script>` must have a `nonce` attribute matching the value in the policy.

**Generate a nonce** (cryptographically strong, ≥128 bits, new per page load):

```python
def GetCspNonce():
    NONCE_LENGTH = 16
    return base64.b64encode(os.urandom(NONCE_LENGTH))
```

**Express (Node.js)**:

```javascript
const nonce = crypto.randomBytes(16).toString("base64");
const csp = `script-src 'nonce-${nonce}' 'strict-dynamic'; object-src 'none'; base-uri 'none';`;
response.set("Content-Security-Policy", csp);
response.render(template, { nonce: nonce });
```

### Step 2: Refactor inline event handlers and `javascript:` URIs

**Blocked by CSP**:

```html
<button onclick="doThings()">A thing.</button>
<a href="javascript:void(0)">foo</a>
```

**Allowed by CSP**:

```html
<button id="things">A thing.</button>
<a href="#" id="foo">foo</a>
<script nonce="{nonce}">
  document.getElementById('things').addEventListener('click', doThings);
  document.getElementById('foo').addEventListener('click', linkClicked);
</script>
```

### Step 3: Load sourced scripts dynamically

For external scripts, use an inline script (with nonce or hash) to load them:

```html
<script nonce="{nonce}">
  var scripts = ['https://example.org/foo.js', 'https://example.org/bar.js'];
  scripts.forEach(function(scriptUrl) {
    var s = document.createElement('script');
    s.src = scriptUrl;
    s.async = false;
    document.head.appendChild(s);
  });
</script>
```

### Step 4: Remove or limit `eval()`

Prefer `JSON.parse()` over `eval()` for JSON. If you must use `eval()`, add `'unsafe-eval'` to the policy (reduces protection).

### Step 5: Report-only mode

Test without enforcing:

```
Content-Security-Policy-Report-Only: ...
```

Violations are reported but not blocked.

---

## 6. Nonce vs hash

| Approach | Use case |
|----------|----------|
| **Nonce-based** | Server-rendered HTML; new nonce per response. |
| **Hash-based** | Static HTML or cached pages; single-page apps (Angular, React) served statically. |

For static sites, use [report-uri.io hash tool](https://report-uri.io/home/hash) or browser console violation hashes.

---

## 7. FAQ

### How do I generate nonces?

Cryptographically strong random values, ≥128 bits. New nonce per page load. Unpredictable.

### What if my site is static?

Use CSP **hashes** instead of nonces, or convert external scripts to inline blocks and hash them.

### What XSS bugs are not mitigated by strict CSP?

~25% of XSS bugs may still be exploitable:

- Injections into the body of `<script>` elements.
- Injections into the `src` of external `<script>`.
- Injections into `document.createElement('script')` or jQuery `.html()`, `.get()`, `.post()`.
- Template injections in Angular applications.
- If `'unsafe-eval'` is present: injections into `eval()`, `setTimeout()`, etc.

### Does CSP replace XSS prevention?

**No.** CSP is defense-in-depth. You must still avoid and fix XSS bugs. Not all browsers support CSP; scriptless and post-XSS attacks remain possible.

### Browser support

- `strict-dynamic`: Chrome, Opera, Firefox; under consideration in Edge.
- Strict CSP is backwards-compatible; older browsers get limited protection (e.g. no `javascript:` URIs).

---

## 8. Tools and resources

| Resource | Purpose |
|----------|---------|
| [CSP Evaluator](https://csp-evaluator.withgoogle.com/) | Check if a policy is secure. |
| [CSP Mitigator](https://chrome.google.com/webstore/detail/csp-mitigator/gijlobangojajlbodabkpjpheeeokhfa) | Chrome extension to find patterns incompatible with CSP. |
| [web.dev/strict-csp](https://web.dev/strict-csp) | Current guidance for strict CSP. |
| [report-uri.io hash](https://report-uri.io/home/hash) | Generate hashes for inline scripts. |
| [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) | Best Practices audit for CSP (v7.3.0+). |
| [CSP paper](https://research.google/pubs/pub45542.html) | Research on allowlist insecurity and strict CSP. |

---

## 9. JARVIS-WEB context

### Implemented CSP usage

- **`server.js`**: Strict nonce-based CSP for HTML with `{{CSP_NONCE}}` placeholder. Injects nonce per request, sets `Content-Security-Policy` header. Production: no `unsafe-eval`; dev: allows `unsafe-eval`.
- **`scripts/csp-utils.mjs`**: `generateCspNonce()`, `buildStrictCspPolicy()`, `injectNonceIntoHtml()`.
- **`public/index.html`**: All `<script>` tags have `nonce="{{CSP_NONCE}}"`; meta tag fallback for Vite dev (includes `object-src 'none'`, `base-uri 'none'`).
- **`electron/main.js`**: For `file://` only, sets CSP with `object-src 'none'`, `base-uri 'none'`, `script-src 'self' 'unsafe-inline' 'strict-dynamic'`. For `http://localhost`, preserves server's CSP.
- **`src/security/headers.ts`**: `buildStrictCsp()` for nonce-based policy; `getSecurityHeaders({ csp })` accepts pre-built CSP.

### Optional next steps

- [ ] Add `CSP_REPORT_URI` env var and `report-uri` for violation monitoring.
- [ ] Use [CSP Evaluator](https://csp-evaluator.withgoogle.com/) to validate policies.
- [ ] Hash-based CSP for Electron `file://` (build-time script hashes) to remove `unsafe-inline`.

---

## 10. References

- [csp.withgoogle.com/docs](https://csp.withgoogle.com/docs/index.html) — Google CSP docs (historical)
- [web.dev/strict-csp](https://web.dev/strict-csp) — Current strict CSP guide
- [MDN: Content-Security-Policy](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy)
- [CSP Is Dead, Long Live CSP!](https://research.google.com/pubs/pub45542.html) — Research paper
- [W3C CSP3 spec](https://www.w3.org/TR/CSP3/)
