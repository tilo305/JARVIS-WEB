# Timestamp Not Showing - Troubleshooting Guide

## Quick Fix: Clear Browser Cache

The timestamp code is correctly implemented, but your browser may be caching the old JavaScript file.

### Steps to Fix:

1. **Hard Refresh the Browser:**
   - **Windows/Linux**: Press `Ctrl + Shift + R` or `Ctrl + F5`
   - **Mac**: Press `Cmd + Shift + R`
   - This forces the browser to reload all files from the server

2. **Clear Browser Cache:**
   - Open Developer Tools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

3. **Restart Dev Server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run vite
   # or
   npm run serve
   ```

4. **Verify in Browser Console:**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Type: `document.querySelector('.timestamp')`
   - If it returns `null`, the timestamp element doesn't exist yet
   - Send a test message and check again

## Verification Steps

### 1. Check if Code is Loaded
Open browser console (F12) and run:
```javascript
// Check if appendMessage function exists
typeof window.JARVIS_TEST?.appendMessage === 'function'
```

### 2. Test Timestamp Generation
In browser console:
```javascript
const now = new Date();
const timestamp = now.toLocaleTimeString('en-US', { 
  hour12: true, 
  hour: 'numeric', 
  minute: '2-digit'
});
console.log('Timestamp:', timestamp);
// Should output something like "3:45 PM"
```

### 3. Check CSS
In browser console:
```javascript
// Check if CSS rule exists
const style = getComputedStyle(document.querySelector('.timestamp') || document.body);
console.log('Timestamp CSS loaded:', style.fontSize !== '');
```

### 4. Manual Test
1. Open the app in browser
2. Send a test message (type or use voice)
3. Inspect the message element (right-click → Inspect)
4. Look for `<div class="timestamp">` in the HTML
5. Check if it has content like "3:45 PM"

## Test Page

**Note:** The standalone test page has been removed. Use the main app with debug mode enabled:

1. Start the dev server: `npm run vite` or `npm run serve`
2. Navigate to: `http://localhost:3000/?debug=1`
3. Send a test message and check the console for timestamp generation
4. Inspect message elements to verify timestamps are displayed

## Common Issues

### Issue: Timestamps not showing
**Solution**: Hard refresh (Ctrl+Shift+R) or clear cache

### Issue: Timestamp shows but wrong format
**Solution**: Check browser locale settings, should use en-US

### Issue: Timestamp shows but no styling
**Solution**: Verify CSS is loaded, check `.message .timestamp` rule exists

### Issue: JavaScript errors in console
**Solution**: Check for errors, may indicate code not loading correctly

## Code Verification

The timestamp code is in `public/js/app.js` at line 161:
```javascript
wrap.innerHTML = `<div class="label">${escapeHtml(label)}</div><div class="timestamp">${escapeHtml(timestamp)}</div><div class="content">${escapeHtml(content)}</div>`;
```

The CSS is in `public/index.html` at line 642:
```css
.message .timestamp {
  font-size: 0.75rem;
  color: var(--text-muted);
  opacity: 0.7;
  margin-top: 0.125rem;
  margin-bottom: 0.375rem;
  font-weight: 400;
}
```

## Still Not Working?

1. Check browser console for errors
2. Verify the dev server is running
3. Try a different browser
4. Check if JavaScript is enabled
5. Verify the file `public/js/app.js` contains the timestamp code (line 161)
