# DevTools Access Guide

If F12 isn't working to open DevTools, try these alternative methods:

## Method 1: Right-Click Menu (Easiest)
1. **Right-click anywhere on the page**
2. Select **"Inspect"** or **"Inspect Element"**
3. DevTools will open

## Method 2: Keyboard Shortcuts (Alternative to F12)

### Windows/Linux:
- **Ctrl + Shift + I** - Open DevTools
- **Ctrl + Shift + J** - Open Console directly
- **Ctrl + Shift + C** - Inspect Element mode

### Mac:
- **Cmd + Option + I** - Open DevTools
- **Cmd + Option + J** - Open Console directly
- **Cmd + Option + C** - Inspect Element mode

## Method 3: Browser Menu

### Chrome/Edge:
1. Click the **three dots menu** (⋮) in the top-right
2. Go to **More Tools** → **Developer Tools**

### Firefox:
1. Click the **hamburger menu** (☰) in the top-right
2. Go to **More Tools** → **Web Developer Tools**

### Safari:
1. Enable Developer menu first: **Safari** → **Preferences** → **Advanced** → Check "Show Develop menu"
2. Then: **Develop** → **Show Web Inspector**

## Method 4: If F12 is Blocked by System

### Windows:
1. Check if F12 is disabled in Windows settings
2. Some keyboards have an "F Lock" key - make sure it's enabled
3. Try **Fn + F12** if your keyboard requires the Fn key
4. Check if any software is intercepting F12 (gaming software, remote desktop, etc.)

### Browser Extensions:
- Disable browser extensions that might block shortcuts
- Try opening in **Incognito/Private mode** (extensions are usually disabled there)

## Method 5: Direct URL Access

If you can't open DevTools at all, you can still access debug pages directly:

- **Voice Pipeline Debug**: `http://localhost:3000/debug/voice-pipeline-debug.html`
- **AudioWorklet Debug**: `http://localhost:3000/debug/debug-audioworklet.html`
- **Fallback Revert Debug**: `http://localhost:3000/debug/fallback-revert-debug.html`

## Method 6: Enable Debug Mode

Add `?debug=1` to your URL:
```
http://localhost:3000/?debug=1
```

This enables enhanced logging and debug functions. Even if you can't see the console, the debug functions will be available if you can access DevTools later.

## Troubleshooting

### If nothing works:
1. **Check browser version** - Make sure you're using a modern browser (Chrome 90+, Firefox 88+, Edge 90+)
2. **Try a different browser** - If one browser blocks shortcuts, try another
3. **Check for malware** - Some malware blocks DevTools
4. **Restart browser** - Sometimes browser state can block shortcuts
5. **Check Windows Group Policy** - If on a managed computer, DevTools might be disabled by policy

### Quick Test:
1. Open any website (like google.com)
2. Try F12 there
3. If F12 works on other sites but not on localhost, it's likely a page-specific issue
4. If F12 doesn't work anywhere, it's a system/browser configuration issue

## Still Having Issues?

If none of these methods work, you can:
1. Use the debug HTML pages directly (they have their own console output)
2. Check the browser's built-in error console (some browsers show errors in a separate window)
3. Contact your system administrator if you're on a managed computer
